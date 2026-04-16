import { Jimp } from 'jimp';
import { config } from '../../config.js';
import { createHttpError } from '../../lib/http.js';
import { predictForgery } from './cnnClassifier.js';

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function pixelAt(pixels, size, x, y) {
  const safeX = Math.min(size - 1, Math.max(0, x));
  const safeY = Math.min(size - 1, Math.max(0, y));
  return pixels[safeY * size + safeX];
}

function averageRegion(pixels, size, box) {
  let sum = 0;
  let count = 0;

  for (let y = box.y; y < box.y + box.height; y += 1) {
    for (let x = box.x; x < box.x + box.width; x += 1) {
      sum += pixelAt(pixels, size, x, y);
      count += 1;
    }
  }

  return sum / Math.max(count, 1);
}

async function preprocessImage(buffer) {
  try {
    const source = await Jimp.read(buffer);
    const originalWidth = source.bitmap.width;
    const originalHeight = source.bitmap.height;
    const normalized = new Jimp({ width: config.ai.inputSize, height: config.ai.inputSize, color: 0xffffffff });
    const working = source.clone().greyscale();
    const scale = Math.min(
      config.ai.inputSize / originalWidth,
      config.ai.inputSize / originalHeight,
    );
    const contentWidth = Math.max(1, Math.round(originalWidth * scale));
    const contentHeight = Math.max(1, Math.round(originalHeight * scale));
    const offsetX = Math.floor((config.ai.inputSize - contentWidth) / 2);
    const offsetY = Math.floor((config.ai.inputSize - contentHeight) / 2);

    working.resize({ w: contentWidth, h: contentHeight });
    normalized.composite(working, offsetX, offsetY);

    const pixels = [];
    const { data } = normalized.bitmap;

    for (let index = 0; index < data.length; index += 4) {
      pixels.push(data[index] / 255);
    }

    return {
      pixels,
      originalWidth,
      originalHeight,
      aspectRatio: originalWidth / Math.max(originalHeight, 1),
      contentBox: {
        x: offsetX,
        y: offsetY,
        width: contentWidth,
        height: contentHeight,
      },
    };
  } catch {
    throw createHttpError(400, 'Unable to process the uploaded file as a certificate image');
  }
}

function computeTileMeans(pixels, size, tileSize = 8) {
  const means = [];

  for (let tileY = 0; tileY < size; tileY += tileSize) {
    for (let tileX = 0; tileX < size; tileX += tileSize) {
      means.push(
        averageRegion(pixels, size, {
          x: tileX,
          y: tileY,
          width: Math.min(tileSize, size - tileX),
          height: Math.min(tileSize, size - tileY),
        }),
      );
    }
  }

  return means;
}

function computeVariance(values) {
  const avg = average(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / Math.max(values.length, 1);
  return { average: avg, variance };
}

function computeBorderSignal(pixels, size, contentBox) {
  const borderThickness = Math.max(1, Math.round(Math.min(contentBox.width, contentBox.height) * 0.035));
  const innerOffset = borderThickness + 3;

  const topBorder = 1 - averageRegion(pixels, size, {
    x: contentBox.x,
    y: contentBox.y,
    width: contentBox.width,
    height: borderThickness,
  });
  const bottomBorder = 1 - averageRegion(pixels, size, {
    x: contentBox.x,
    y: contentBox.y + contentBox.height - borderThickness,
    width: contentBox.width,
    height: borderThickness,
  });
  const leftBorder = 1 - averageRegion(pixels, size, {
    x: contentBox.x,
    y: contentBox.y,
    width: borderThickness,
    height: contentBox.height,
  });
  const rightBorder = 1 - averageRegion(pixels, size, {
    x: contentBox.x + contentBox.width - borderThickness,
    y: contentBox.y,
    width: borderThickness,
    height: contentBox.height,
  });

  const topInner = 1 - averageRegion(pixels, size, {
    x: contentBox.x + 2,
    y: Math.min(size - 1, contentBox.y + innerOffset),
    width: Math.max(1, contentBox.width - 4),
    height: borderThickness,
  });
  const bottomInner = 1 - averageRegion(pixels, size, {
    x: contentBox.x + 2,
    y: Math.max(0, contentBox.y + contentBox.height - innerOffset - borderThickness),
    width: Math.max(1, contentBox.width - 4),
    height: borderThickness,
  });
  const leftInner = 1 - averageRegion(pixels, size, {
    x: Math.min(size - 1, contentBox.x + innerOffset),
    y: contentBox.y + 2,
    width: borderThickness,
    height: Math.max(1, contentBox.height - 4),
  });
  const rightInner = 1 - averageRegion(pixels, size, {
    x: Math.max(0, contentBox.x + contentBox.width - innerOffset - borderThickness),
    y: contentBox.y + 2,
    width: borderThickness,
    height: Math.max(1, contentBox.height - 4),
  });

  const outerDarkness = average([topBorder, bottomBorder, leftBorder, rightBorder]);
  const innerDarkness = average([topInner, bottomInner, leftInner, rightInner]);
  const contrast = outerDarkness - innerDarkness;

  return {
    outerDarkness,
    innerDarkness,
    contrast,
    borderMissingScore: clamp((0.13 - contrast) * 620),
  };
}

function buildRowProfile(pixels, size, contentBox) {
  const values = [];

  for (let y = contentBox.y; y < contentBox.y + contentBox.height; y += 1) {
    let rowSum = 0;

    for (let x = contentBox.x; x < contentBox.x + contentBox.width; x += 1) {
      rowSum += 1 - pixelAt(pixels, size, x, y);
    }

    values.push(rowSum / Math.max(contentBox.width, 1));
  }

  return values;
}

function computeRowAnomalyScore(profile) {
  if (profile.length < 5) {
    return 0;
  }

  let maxDeviation = 0;

  for (let index = 2; index < profile.length - 2; index += 1) {
    const neighborhood = average([
      profile[index - 2],
      profile[index - 1],
      profile[index + 1],
      profile[index + 2],
    ]);
    maxDeviation = Math.max(maxDeviation, Math.abs(profile[index] - neighborhood));
  }

  return clamp(maxDeviation * 1050);
}

function computeTileOutlierScore(pixels, size, contentBox) {
  const tileWidth = Math.max(4, Math.round(contentBox.width / 6));
  const tileHeight = Math.max(4, Math.round(contentBox.height / 5));
  const tiles = [];

  for (let tileY = contentBox.y; tileY < contentBox.y + contentBox.height; tileY += tileHeight) {
    const row = [];

    for (let tileX = contentBox.x; tileX < contentBox.x + contentBox.width; tileX += tileWidth) {
      row.push(
        averageRegion(pixels, size, {
          x: tileX,
          y: tileY,
          width: Math.min(tileWidth, contentBox.x + contentBox.width - tileX),
          height: Math.min(tileHeight, contentBox.y + contentBox.height - tileY),
        }),
      );
    }

    tiles.push(row);
  }

  let maxDiff = 0;

  for (let rowIndex = 0; rowIndex < tiles.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < tiles[rowIndex].length; columnIndex += 1) {
      const neighbors = [];

      for (let y = Math.max(0, rowIndex - 1); y <= Math.min(tiles.length - 1, rowIndex + 1); y += 1) {
        for (let x = Math.max(0, columnIndex - 1); x <= Math.min(tiles[rowIndex].length - 1, columnIndex + 1); x += 1) {
          if (x !== columnIndex || y !== rowIndex) {
            neighbors.push(tiles[y][x]);
          }
        }
      }

      const neighborAverage = average(neighbors);
      maxDiff = Math.max(maxDiff, Math.abs(tiles[rowIndex][columnIndex] - neighborAverage));
    }
  }

  return clamp(maxDiff * 850);
}

function computeEditBandScore(pixels, size, contentBox) {
  const bandTop = contentBox.y + Math.round(contentBox.height * 0.28);
  const bandHeight = Math.max(4, Math.round(contentBox.height * 0.18));
  const bandLeft = contentBox.x + Math.round(contentBox.width * 0.18);
  const bandWidth = Math.max(8, Math.round(contentBox.width * 0.64));
  const bandMean = averageRegion(pixels, size, {
    x: bandLeft,
    y: bandTop,
    width: bandWidth,
    height: bandHeight,
  });
  const surroundingMean = averageRegion(pixels, size, {
    x: contentBox.x + Math.round(contentBox.width * 0.1),
    y: contentBox.y + Math.round(contentBox.height * 0.18),
    width: Math.max(8, Math.round(contentBox.width * 0.8)),
    height: Math.max(8, Math.round(contentBox.height * 0.34)),
  });
  const brightnessLift = bandMean - surroundingMean;

  return clamp(brightnessLift * 1200);
}

function computeHeuristics(pixels, size, contentBox, aspectRatio) {
  let localNoise = 0;
  let edgeEnergy = 0;
  let blockiness = 0;
  let comparisons = 0;

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const current = pixels[y * size + x];
      const right = pixels[y * size + x + 1];
      const down = pixels[(y + 1) * size + x];
      const horizontalDiff = Math.abs(current - right);
      const verticalDiff = Math.abs(current - down);

      localNoise += (horizontalDiff + verticalDiff) / 2;
      edgeEnergy += Math.sqrt(horizontalDiff ** 2 + verticalDiff ** 2);
      comparisons += 1;

      if ((x + 1) % 8 === 0) {
        blockiness += horizontalDiff;
      }

      if ((y + 1) % 8 === 0) {
        blockiness += verticalDiff;
      }
    }
  }

  const tiles = computeTileMeans(pixels, size);
  const tileStats = computeVariance(tiles);
  const brightnessStats = computeVariance(pixels);
  const border = computeBorderSignal(pixels, size, contentBox);
  const rowProfile = buildRowProfile(pixels, size, contentBox);
  const aspectDeviation = Math.abs(aspectRatio - config.ai.expectedAspectRatio) / config.ai.expectedAspectRatio;
  const aspectScore = clamp(aspectDeviation * 240);
  const rowAnomalyScore = computeRowAnomalyScore(rowProfile);
  const tileOutlierScore = computeTileOutlierScore(pixels, size, contentBox);
  const editBandScore = computeEditBandScore(pixels, size, contentBox);
  const cropScore = clamp(aspectScore * 0.55 + border.borderMissingScore * 0.45);
  const editScore = clamp(tileOutlierScore * 0.42 + rowAnomalyScore * 0.28 + editBandScore * 0.3);

  return {
    noiseScore: clamp((localNoise / comparisons) * 480),
    edgeScore: clamp((edgeEnergy / comparisons) * 620),
    blockinessScore: clamp((blockiness / (comparisons / 4)) * 520),
    tileVarianceScore: clamp(tileStats.variance * 2600),
    brightnessScore: clamp(brightnessStats.variance * 1100),
    aspectScore,
    borderMissingScore: border.borderMissingScore,
    rowAnomalyScore,
    tileOutlierScore,
    editBandScore,
    cropScore,
    editScore,
    borderContrast: Number(border.contrast.toFixed(4)),
  };
}

function riskBand(score) {
  if (score < 25) {
    return 'low';
  }

  if (score < 55) {
    return 'moderate';
  }

  if (score < 80) {
    return 'high';
  }

  return 'critical';
}

function buildDetails(authentic, classifier, heuristics, score) {
  const details = [];

  if (authentic) {
    details.push(`CNN classifier favored an authentic pattern with ${(classifier.authenticProbability * 100).toFixed(1)}% probability.`);
    details.push(`Document framing and border continuity stayed within acceptable certificate ranges.`);

    if (heuristics.editScore > 25) {
      details.push('Minor local variation was present, but it did not cross the forgery threshold.');
    } else {
      details.push('No suspicious text-replacement patch was detected in the primary name region.');
    }

    details.push(`Overall tamper exposure was rated ${riskBand(score)} by the hybrid detector.`);
    return details;
  }

  details.push(`CNN classifier matched forged-like artifacts with ${(classifier.forgedProbability * 100).toFixed(1)}% probability.`);

  if (heuristics.cropScore >= 45) {
    details.push('Document framing diverges from the expected full-certificate layout, which suggests cropping or incomplete capture.');
  }

  if (heuristics.borderMissingScore >= 40) {
    details.push('Expected certificate border structure is incomplete or inconsistent near the document edges.');
  }

  if (heuristics.editScore >= 45) {
    details.push('A localized anomaly was detected in the central text region, consistent with field replacement or pasted edits.');
  }

  details.push(`Overall tamper exposure was rated ${riskBand(score)} and should be reviewed manually.`);
  return details;
}

export async function analyzeCertificateUpload(buffer, fileName) {
  const { pixels, originalWidth, originalHeight, aspectRatio, contentBox } = await preprocessImage(buffer);
  const classifier = await predictForgery(pixels);
  const heuristics = computeHeuristics(pixels, config.ai.inputSize, contentBox, aspectRatio);
  const heuristicRisk = (
    heuristics.noiseScore * 0.08 +
    heuristics.edgeScore * 0.1 +
    heuristics.blockinessScore * 0.12 +
    heuristics.tileVarianceScore * 0.08 +
    heuristics.brightnessScore * 0.06 +
    heuristics.aspectScore * 0.16 +
    heuristics.borderMissingScore * 0.16 +
    heuristics.rowAnomalyScore * 0.08 +
    heuristics.tileOutlierScore * 0.08 +
    heuristics.editBandScore * 0.08
  );
  const cnnRisk = classifier.forgedProbability * 100;
  let tamperScore = clamp(cnnRisk * 0.42 + heuristicRisk * 0.58);

  if (heuristics.cropScore > 55) {
    tamperScore = Math.max(tamperScore, clamp(64 + (heuristics.cropScore - 55) * 0.55));
  }

  if (heuristics.editScore > 50) {
    tamperScore = Math.max(tamperScore, clamp(62 + (heuristics.editScore - 50) * 0.5));
  }

  if (heuristics.borderMissingScore > 48 && heuristics.aspectScore > 35) {
    tamperScore = Math.max(tamperScore, 76);
  }

  const authentic = tamperScore < config.ai.authenticThreshold;
  const confidence = authentic
    ? clamp((100 - tamperScore) * 0.85 + classifier.authenticProbability * 15)
    : clamp(tamperScore * 0.82 + classifier.forgedProbability * 18);

  return {
    authentic,
    confidence: confidence.toFixed(1),
    tamperScore: tamperScore.toFixed(1),
    details: buildDetails(authentic, classifier, heuristics, tamperScore),
    model: {
      ...classifier.model,
      predictedLabel: classifier.predictedLabel,
      authenticProbability: Number((classifier.authenticProbability * 100).toFixed(2)),
      forgedProbability: Number((classifier.forgedProbability * 100).toFixed(2)),
    },
    evidence: {
      ...Object.fromEntries(
        Object.entries(heuristics).map(([key, value]) => [key, typeof value === 'number' ? Number(value.toFixed(2)) : value]),
      ),
      imageWidth: originalWidth,
      imageHeight: originalHeight,
      sourceAspectRatio: Number(aspectRatio.toFixed(3)),
      fileName,
    },
    riskBand: riskBand(tamperScore),
  };
}
