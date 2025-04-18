import * as core from '@actions/core';

export interface Inputs {
  version: string;
  channel: string;
  daemonConfig?: string;
  context: string;
  setHost: boolean;
}

export function getInputs(): Inputs {
  return {
    version: core.getInput('version') || 'latest',
    channel: core.getInput('channel'),
    daemonConfig: core.getInput('daemon-config'),
    context: core.getInput('context'),
    setHost: core.getBooleanInput('set-host')
  };
}
