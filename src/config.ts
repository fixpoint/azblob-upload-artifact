import { getInput } from '@actions/core';

export interface Config {
  readonly connectionString: string;
  readonly name: string;
  readonly path: string;
  readonly container: string;
  readonly cleanup: boolean;
}

export function loadConfigFromInputs(): Config {
  return {
    connectionString: getInput('connection-string'),
    name: getInput('name'),
    path: getInput('path'),
    container: getInput('container'),
    cleanup: getInput('cleanup').toLowerCase() === 'true',
  };
}
