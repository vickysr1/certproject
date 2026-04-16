import { config } from '../../config.js';

const SIZE = config.ai.inputSize;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function randomInt(minimum, maximum) {
  return Math.floor(randomBetween(minimum, maximum + 1));
}

function pixelIndex(x, y, size = SIZE) {
  return y * size + x;
}

function setPixel(pixels, x, y, value, size = SIZE) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  pixels[pixelIndex(x, y, size)] = clamp(value);
}

function getPixel(pixels, x, y, size = SIZE) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return 1;
  }

  return pixels[pixelIndex(x, y, size)];
}

function drawRectOutline(pixels, x, y, width, height, thickness, value, size = SIZE) {
  for (let layer = 0; layer < thickness; layer += 1) {
    for (let px = x + layer; px < x + width - layer; px += 1) {
      setPixel(pixels, px, y + layer, value, size);
      setPixel(pixels, px, y + height - 1 - layer, value, size);
    }

    for (let py = y + layer; py < y + height - layer; py += 1) {
      setPixel(pixels, x + layer, py, value, size);
      setPixel(pixels, x + width - 1 - layer, py, value, size);
    }
  }
}

function fillRect(pixels, x, y, width, height, value, size = SIZE) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      setPixel(pixels, px, py, value, size);
    }
  }
}

function drawHorizontalStroke(pixels, x, y, length, thickness, value, size = SIZE) {
  fillRect(pixels, x, y, length, thickness, value, size);
}

function drawSeal(pixels, centerX, centerY, radius, value, size = SIZE) {
  for (let y = centerY - radius - 1; y <= centerY + radius + 1; y += 1) {
    for (let x = centerX - radius - 1; x <= centerX + radius + 1; x += 1) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      if (Math.abs(distance - radius) < 1.2 || Math.abs(distance - radius * 0.55) < 0.8) {
        setPixel(pixels, x, y, value, size);
      }
    }
  }
}

function addBackgroundNoise(pixels, intensity) {
  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = clamp(pixels[index] + randomBetween(-intensity, intensity));
  }
}

export function createAuthenticSample(size = SIZE) {
  const base = 0.94 + randomBetween(-0.015, 0.015);
  const pixels = new Float32Array(size * size).fill(base);

  drawRectOutline(pixels, 3, 3, size - 6, size - 6, 1, 0.6 + randomBetween(-0.03, 0.03), size);
  drawRectOutline(pixels, 6, 6, size - 12, size - 12, 1, 0.71 + randomBetween(-0.03, 0.03), size);

  fillRect(pixels, 14, 10, 36, 2, 0.54 + randomBetween(-0.04, 0.03), size);
  fillRect(pixels, 12, 15, 40, 1, 0.63 + randomBetween(-0.04, 0.03), size);
  fillRect(pixels, 18, 19, 28, 1, 0.68 + randomBetween(-0.03, 0.02), size);

  const nameRow = 26 + randomInt(-1, 1);
  drawHorizontalStroke(pixels, 16, nameRow, 32 + randomInt(-2, 4), 2, 0.42 + randomBetween(-0.05, 0.03), size);
  drawHorizontalStroke(pixels, 20, nameRow + 4, 24 + randomInt(-4, 6), 1, 0.58 + randomBetween(-0.04, 0.03), size);
  drawHorizontalStroke(pixels, 18, nameRow + 8, 28 + randomInt(-4, 6), 1, 0.6 + randomBetween(-0.05, 0.03), size);

  const contentStartY = 38 + randomInt(-1, 1);

  for (let row = 0; row < 4; row += 1) {
    const y = contentStartY + row * 4;
    const x = 8 + randomInt(0, 4);
    const length = 42 + randomInt(-6, 6);
    const intensity = 0.53 + randomBetween(-0.06, 0.04);

    drawHorizontalStroke(pixels, x, y, length, 1, intensity, size);

    if (row % 2 === 0) {
      drawHorizontalStroke(pixels, x + 4, y + 1, Math.max(16, length - 12), 1, intensity + 0.05, size);
    }
  }

  drawHorizontalStroke(pixels, 10, 56, 18, 1, 0.45, size);
  drawHorizontalStroke(pixels, 38, 56, 16, 1, 0.45, size);
  drawSeal(pixels, 52, 50, 5, 0.43 + randomBetween(-0.04, 0.03), size);
  addBackgroundNoise(pixels, 0.02);

  return Array.from(pixels, (value) => clamp(value));
}

function resampleRegion(sourcePixels, sourceX, sourceY, sourceWidth, sourceHeight, size = SIZE) {
  const output = new Float32Array(size * size);

  for (let targetY = 0; targetY < size; targetY += 1) {
    for (let targetX = 0; targetX < size; targetX += 1) {
      const sourcePixelX = Math.min(
        SIZE - 1,
        Math.max(0, Math.round(sourceX + (targetX / Math.max(size - 1, 1)) * (sourceWidth - 1))),
      );
      const sourcePixelY = Math.min(
        SIZE - 1,
        Math.max(0, Math.round(sourceY + (targetY / Math.max(size - 1, 1)) * (sourceHeight - 1))),
      );
      output[pixelIndex(targetX, targetY, size)] = getPixel(sourcePixels, sourcePixelX, sourcePixelY, SIZE);
    }
  }

  return output;
}

function addNameEditForgery(sourcePixels, size = SIZE) {
  const pixels = Float32Array.from(sourcePixels);
  const patchX = 14 + randomInt(-1, 2);
  const patchY = 24 + randomInt(-1, 2);
  const patchWidth = 38 + randomInt(-2, 4);
  const patchHeight = 7 + randomInt(0, 2);
  const patchBase = 0.95 + randomBetween(-0.02, 0.015);

  fillRect(pixels, patchX, patchY, patchWidth, patchHeight, patchBase, size);
  drawRectOutline(pixels, patchX, patchY, patchWidth, patchHeight, 1, 0.83 + randomBetween(-0.04, 0.04), size);

  for (let row = 0; row < 2; row += 1) {
    const y = patchY + 1 + row * 2;
    const lineLength = patchWidth - 8 - row * randomInt(2, 6);
    drawHorizontalStroke(pixels, patchX + 4, y, lineLength, 1, 0.28 + randomBetween(-0.06, 0.05), size);
  }

  const anomalyX = patchX + randomInt(8, patchWidth - 10);
  for (let y = patchY; y < patchY + patchHeight; y += 1) {
    setPixel(pixels, anomalyX, y, getPixel(pixels, anomalyX, y, size) + 0.22, size);
  }

  addBackgroundNoise(pixels, 0.04);
  return Array.from(pixels, (value) => clamp(value));
}

function addCropForgery(sourcePixels, size = SIZE) {
  const crop = resampleRegion(sourcePixels, 8, 16, 48, 28, size);
  const pixels = Float32Array.from(crop);

  fillRect(pixels, 46, 44, 10, 8, 0.93 + randomBetween(-0.03, 0.02), size);
  fillRect(pixels, 6, 48, 18, 6, 0.92 + randomBetween(-0.03, 0.02), size);
  addBackgroundNoise(pixels, 0.05);

  return Array.from(pixels, (value) => clamp(value));
}

function addSealSignatureForgery(sourcePixels, size = SIZE) {
  const pixels = Float32Array.from(sourcePixels);

  fillRect(pixels, 43, 45, 14, 12, 0.9 + randomBetween(-0.02, 0.02), size);
  fillRect(pixels, 36, 54, 16, 3, 0.16 + randomBetween(-0.05, 0.04), size);

  const bandX = randomInt(10, 20);
  for (let y = 22; y < 50; y += 1) {
    const offset = y % 2 === 0 ? 0.16 : -0.06;
    setPixel(pixels, bandX, y, getPixel(pixels, bandX, y, size) + offset, size);
  }

  addBackgroundNoise(pixels, 0.045);
  return Array.from(pixels, (value) => clamp(value));
}

function addCompositeForgery(sourcePixels, size = SIZE) {
  const edited = addNameEditForgery(sourcePixels, size);
  return addCropForgery(edited, size);
}

function createForgedSample(sourcePixels, size = SIZE) {
  const variants = [
    addNameEditForgery,
    addCropForgery,
    addSealSignatureForgery,
    addCompositeForgery,
  ];

  const variant = variants[randomInt(0, variants.length - 1)];
  return variant(sourcePixels, size);
}

export function generateSyntheticDataset(samplesPerClass = config.ai.baselineSamplesPerClass) {
  const dataset = [];

  for (let index = 0; index < samplesPerClass; index += 1) {
    const authentic = createAuthenticSample();
    dataset.push({ label: 'authentic', pixels: authentic });
    dataset.push({ label: 'forged', pixels: createForgedSample(authentic) });
  }

  return dataset;
}
