import { createApp } from './app.js';
import { config } from './config.js';
import { initializeDatabase } from './lib/database.js';
import { bootstrapApplicationData } from './services/bootstrapService.js';

async function startServer() {
  await initializeDatabase();
  const bootstrap = await bootstrapApplicationData();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`${config.appName} API listening on http://localhost:${config.port}`);
    console.log(`Seed certificates available: ${bootstrap.certificates}`);
    console.log(`AI model: ${bootstrap.classifier.name} (${bootstrap.classifier.version})`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start the backend server');
  console.error(error);
  process.exitCode = 1;
});
