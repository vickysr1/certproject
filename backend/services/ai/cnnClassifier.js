import fs from 'node:fs/promises';
import convnetjsModule from 'convnetjs';
import { config } from '../../config.js';
import { generateSyntheticDataset } from './syntheticDataset.js';

const convnetjs = convnetjsModule.default ?? convnetjsModule;
const LABELS = ['authentic', 'forged'];
const MODEL_NAME = 'Synthetic Certificate CNN';
const MODEL_VERSION = 'synthetic-certificate-cnn-v2';

let cachedClassifier = null;

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function buildNetwork() {
  const network = new convnetjs.Net();
  network.makeLayers([
    { type: 'input', out_sx: config.ai.inputSize, out_sy: config.ai.inputSize, out_depth: 1 },
    { type: 'conv', sx: 5, filters: 8, stride: 1, pad: 2, activation: 'relu' },
    { type: 'pool', sx: 2, stride: 2 },
    { type: 'conv', sx: 3, filters: 16, stride: 1, pad: 1, activation: 'relu' },
    { type: 'pool', sx: 2, stride: 2 },
    { type: 'fc', num_neurons: 32, activation: 'relu' },
    { type: 'softmax', num_classes: LABELS.length },
  ]);
  return network;
}

function pixelsToVolume(pixels) {
  const volume = new convnetjs.Vol(config.ai.inputSize, config.ai.inputSize, 1, 0.0);

  for (let index = 0; index < pixels.length; index += 1) {
    volume.w[index] = pixels[index] - 0.5;
  }

  return volume;
}

function labelToIndex(label) {
  return LABELS.indexOf(label);
}

function evaluate(network, samples) {
  if (!samples.length) {
    return { accuracy: 1 };
  }

  let correct = 0;

  for (const sample of samples) {
    const output = network.forward(pixelsToVolume(sample.pixels)).w;
    const predictedIndex = output[0] >= output[1] ? 0 : 1;

    if (predictedIndex === labelToIndex(sample.label)) {
      correct += 1;
    }
  }

  return {
    accuracy: correct / samples.length,
  };
}

async function saveModel(network, metadata) {
  await fs.writeFile(
    config.cnnModelPath,
    JSON.stringify(
      {
        ...metadata,
        net: network.toJSON(),
      },
      null,
      2,
    ),
  );
}

async function loadStoredModel() {
  try {
    const raw = await fs.readFile(config.cnnModelPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (
      parsed.version !== MODEL_VERSION ||
      parsed.inputSize !== config.ai.inputSize ||
      JSON.stringify(parsed.labels || []) !== JSON.stringify(LABELS)
    ) {
      return null;
    }

    const network = new convnetjs.Net();
    network.fromJSON(parsed.net);

    return {
      metadata: {
        ...parsed,
      },
      network,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function trainSyntheticModel(options = {}) {
  const samplesPerClass = options.samplesPerClass || config.ai.baselineSamplesPerClass;
  const epochs = options.epochs || config.ai.epochs;
  const dataset = shuffle(generateSyntheticDataset(samplesPerClass));
  const splitIndex = Math.max(1, Math.floor(dataset.length * 0.8));
  const trainingSamples = dataset.slice(0, splitIndex);
  const validationSamples = dataset.slice(splitIndex);
  const network = buildNetwork();
  const trainer = new convnetjs.Trainer(network, {
    method: 'adadelta',
    batch_size: 16,
    l2_decay: 0.0005,
  });

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    for (const sample of shuffle(trainingSamples)) {
      trainer.train(pixelsToVolume(sample.pixels), labelToIndex(sample.label));
    }
  }

  const metrics = evaluate(network, validationSamples);
  const metadata = {
    name: MODEL_NAME,
    version: MODEL_VERSION,
    inputSize: config.ai.inputSize,
    labels: LABELS,
    trainedAt: new Date().toISOString(),
    training: {
      samplesPerClass,
      trainingSamples: trainingSamples.length,
      validationSamples: validationSamples.length,
      epochs,
      validationAccuracy: Number((metrics.accuracy * 100).toFixed(2)),
    },
  };

  await saveModel(network, metadata);

  cachedClassifier = {
    metadata,
    network,
  };

  return cachedClassifier;
}

export async function ensureBaselineModel() {
  if (cachedClassifier) {
    return cachedClassifier;
  }

  const storedClassifier = await loadStoredModel();

  if (storedClassifier) {
    cachedClassifier = storedClassifier;
    return cachedClassifier;
  }

  return trainSyntheticModel();
}

export async function predictForgery(pixels) {
  const classifier = await ensureBaselineModel();
  const probabilities = classifier.network.forward(pixelsToVolume(pixels)).w;
  const authenticProbability = Number(probabilities[0] || 0);
  const forgedProbability = Number(probabilities[1] || 0);
  const predictedLabel = authenticProbability >= forgedProbability ? 'authentic' : 'forged';

  return {
    model: {
      name: MODEL_NAME,
      version: MODEL_VERSION,
    },
    authenticProbability,
    forgedProbability,
    predictedLabel,
    confidence: Math.max(authenticProbability, forgedProbability),
  };
}

export async function getClassifierSummary() {
  const classifier = await ensureBaselineModel();

  return {
    name: MODEL_NAME,
    version: MODEL_VERSION,
    inputSize: classifier.metadata.inputSize,
    trainedAt: classifier.metadata.trainedAt,
    validationAccuracy: classifier.metadata.training?.validationAccuracy ?? null,
  };
}
