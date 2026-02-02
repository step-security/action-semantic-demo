import * as core from '@actions/core'
import * as github from '@actions/github'
import {backOff} from 'exponential-backoff'
import {v4 as uuid} from 'uuid'
import {
  getConfig,
  DispatchMethod,
  ActionOutputs,
  getBackoffOptions
} from './action'
import * as api from './api'
import {getDispatchedWorkflowRun} from './utils'
import axios, {isAxiosError} from 'axios'

const DISTINCT_ID = uuid()

async function validateSubscription() {
  const repoPrivate = github.context?.payload?.repository?.private
  const visibilityUnknown = repoPrivate === undefined

  core.info(
    `Starting subscription validation - Repository private: ${repoPrivate}, Visibility unknown: ${visibilityUnknown}`
  )

  if (repoPrivate === false) {
    core.info('Repository is public, skipping subscription validation.')
    return
  }

  if (repoPrivate === true) {
    core.info('Repository is private, proceeding with subscription validation.')
  } else if (visibilityUnknown) {
    core.info(
      'Repository visibility is unknown, proceeding with subscription validation.'
    )
  }

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const params: Record<string, string> = {}
  if (process.env.GITHUB_ACTION_REPOSITORY)
    params.action = process.env.GITHUB_ACTION_REPOSITORY
  if (serverUrl !== 'https://github.com') params.ghes_server = serverUrl
  if (visibilityUnknown) params.repo_visibility = 'unknown'

  core.debug(`Validation params: ${JSON.stringify(params)}`)

  try {
    core.info('Checking subscription status...')
    await axios.get(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`,
      {params, timeout: 3000}
    )
    core.info('Subscription validation successful.')
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error('Subscription validation failed: 403 Forbidden')
      console.error(
        'This StepSecurity maintained action is free for public repositories.\n' +
          'This repository is private and does not currently have a StepSecurity Enterprise subscription enabled, so the action was not executed.\n\n' +
          'Learn more:\n' +
          'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'
      )
      process.exit(1)
    }
    core.warning(
      `Subscription validation error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

async function run(): Promise<void> {
  try {
    await validateSubscription()
    const config = getConfig()
    api.init(config)
    const backoffOptions = getBackoffOptions(config)

    // Display Exponential Backoff Options (if debug mode is enabled)
    core.info(`🔄 Exponential backoff parameters:
    starting-delay: ${backoffOptions.startingDelay}
    max-attempts: ${backoffOptions.numOfAttempts}
    time-multiple: ${backoffOptions.timeMultiple}`)

    // Get the workflow ID if give a string
    if (typeof config.workflow === 'string') {
      const workflowFileName = config.workflow
      core.info(`⌛ Fetching workflow id for ${workflowFileName}`)
      const workflowId = await backOff(
        async () => api.getWorkflowId(workflowFileName),
        backoffOptions
      )
      core.info(`✅ Fetched workflow id: ${workflowId}`)
      config.workflow = workflowId
    }

    // Dispatch the action using the chosen dispatch method
    if (config.dispatchMethod === DispatchMethod.WorkflowDispatch) {
      await api.workflowDispatch(DISTINCT_ID)
    } else {
      await api.repositoryDispatch(DISTINCT_ID)
    }

    // Exit Early Early if discover is disabled
    if (!config.discover) {
      core.info('✅ Workflow dispatched! Skipping the retrieval of the run-id')
      return
    }

    core.info(
      `⌛ Fetching run-ids for workflow with distinct-id=${DISTINCT_ID}`
    )

    const dispatchedWorkflowRun = await backOff(async () => {
      const workflowRuns = await api.getWorkflowRuns()
      const dispatchedWorkflowRun = getDispatchedWorkflowRun(
        workflowRuns,
        DISTINCT_ID
      )
      return dispatchedWorkflowRun
    }, backoffOptions)

    core.info(`✅ Successfully identified remote run:
    run-id: ${dispatchedWorkflowRun.id}
    run-url: ${dispatchedWorkflowRun.htmlUrl}`)
    core.setOutput(ActionOutputs.RunId, dispatchedWorkflowRun.id)
    core.setOutput(ActionOutputs.RunUrl, dispatchedWorkflowRun.htmlUrl)
  } catch (error) {
    if (error instanceof Error) {
      core.warning('🟠 Does the token have the correct permissions?')
      error.stack && core.debug(error.stack)
      core.setFailed(`🔴 Failed to complete: ${error.message}`)
    }
  }
}

run()
