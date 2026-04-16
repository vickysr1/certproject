import { ensureBaselineModel, getClassifierSummary } from '../services/ai/cnnClassifier.js';

await ensureBaselineModel();
const summary = await getClassifierSummary();

console.log('CNN model ready');
console.log(JSON.stringify(summary, null, 2));
