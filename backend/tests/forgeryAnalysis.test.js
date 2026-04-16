import assert from 'node:assert/strict';
import test from 'node:test';
import { Jimp, JimpMime } from 'jimp';
import { analyzeCertificateUpload } from '../services/ai/forgeryAnalysisService.js';

function setGrayPixel(image, x, y, gray) {
  const index = (y * image.bitmap.width + x) * 4;
  image.bitmap.data[index] = gray;
  image.bitmap.data[index + 1] = gray;
  image.bitmap.data[index + 2] = gray;
  image.bitmap.data[index + 3] = 255;
}

function fillRect(image, x, y, width, height, gray) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      setGrayPixel(image, px, py, gray);
    }
  }
}

function drawRectOutline(image, x, y, width, height, thickness, gray) {
  for (let layer = 0; layer < thickness; layer += 1) {
    fillRect(image, x + layer, y + layer, width - layer * 2, 1, gray);
    fillRect(image, x + layer, y + height - 1 - layer, width - layer * 2, 1, gray);
    fillRect(image, x + layer, y + layer, 1, height - layer * 2, gray);
    fillRect(image, x + width - 1 - layer, y + layer, 1, height - layer * 2, gray);
  }
}

function drawCircleOutline(image, centerX, centerY, radius, gray) {
  for (let y = centerY - radius - 1; y <= centerY + radius + 1; y += 1) {
    for (let x = centerX - radius - 1; x <= centerX + radius + 1; x += 1) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      if (Math.abs(distance - radius) < 1.4 || Math.abs(distance - radius * 0.58) < 0.9) {
        setGrayPixel(image, x, y, gray);
      }
    }
  }
}

async function buildCertificateBuffer({ tampered = false, cropped = false } = {}) {
  const image = new Jimp({ width: 842, height: 595, color: 0xffffffff });

  drawRectOutline(image, 18, 18, 806, 559, 4, 150);
  drawRectOutline(image, 42, 42, 758, 511, 2, 180);
  fillRect(image, 250, 84, 340, 10, 125);
  fillRect(image, 200, 128, 440, 5, 148);
  fillRect(image, 280, 164, 280, 5, 165);

  fillRect(image, 268, 226, 310, 15, 92);
  fillRect(image, 318, 278, 210, 5, 148);
  fillRect(image, 296, 314, 254, 5, 154);

  for (let row = 0; row < 4; row += 1) {
    fillRect(image, 110, 374 + row * 28, 620 - row * 24, 4, 136);
  }

  fillRect(image, 132, 520, 160, 5, 104);
  fillRect(image, 520, 520, 148, 5, 104);
  drawCircleOutline(image, 700, 470, 42, 96);

  if (tampered) {
    fillRect(image, 250, 216, 360, 42, 247);
    drawRectOutline(image, 250, 216, 360, 42, 2, 212);
    fillRect(image, 282, 228, 284, 5, 58);
    fillRect(image, 300, 242, 226, 4, 64);
    fillRect(image, 512, 220, 6, 38, 28);
  }

  const output = cropped
    ? (() => {
        const crop = new Jimp({ width: 560, height: 230, color: 0xffffffff });
        crop.composite(image, -150, -150);
        return crop;
      })()
    : image;

  return output.getBuffer(JimpMime.png);
}

test('an authentic full certificate image is accepted', async () => {
  const buffer = await buildCertificateBuffer();
  const result = await analyzeCertificateUpload(buffer, 'authentic-certificate.png');

  assert.equal(result.authentic, true);
  assert.ok(Number(result.tamperScore) < 44);
});

test('a cropped and name-edited certificate is flagged as suspicious', async () => {
  const buffer = await buildCertificateBuffer({ tampered: true, cropped: true });
  const result = await analyzeCertificateUpload(buffer, 'cropped-edited-certificate.png');

  assert.equal(result.authentic, false);
  assert.ok(Number(result.tamperScore) >= 60);
  assert.ok(result.details.some((detail) => /crop|field replacement|edited|layout/i.test(detail)));
});
