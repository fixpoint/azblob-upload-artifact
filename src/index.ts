import * as core from '@actions/core';
import { upload } from './upload';
import { loadConfigFromInputs } from './config';

async function main() {
  const config = loadConfigFromInputs();
  core.debug(`Config: ${config}`);

  await upload(
    config.connectionString,
    config.name,
    config.path,
    config.container,
    config.cleanup,
  );
}

main().catch((e) => {
  core.debug(e.stack);
  core.error(e.message);
  core.setFailed(e.message);
});
