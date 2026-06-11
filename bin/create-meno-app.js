#!/usr/bin/env node

const command = process.argv[2];

// meno generate <module>
if (command === 'generate') {
  const moduleName = process.argv[3];
  const { runGenerate } = await import('../lib/generators/extras/generate-command.js');
  await runGenerate(moduleName);
} else {
  // create-meno-app [project-name]
  const { createApp } = await import('../lib/create-app.js');
  await createApp();
}
