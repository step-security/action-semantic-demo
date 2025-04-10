const core = require("@actions/core");
const github = require("@actions/github");
const npa = require("npm-package-arg");
const installPreset = require("./installPreset");
const validateTitle = require("./validateTitle");
const axios = require("axios");

async function validateSubscription() {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (error.response) {
      console.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io"
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
  }
}

async function run() {
  await validateSubscription();

  try {
    let contextName = core.getInput("context-name");
    let successState = core.getInput("success-state");
    let failureState = core.getInput("failure-state");
    let targetUrl = core.getInput("target-url");
    const installPresetPackage = core.getInput("preset");
    const requirePresetPackage = npa(installPresetPackage).name;

    const client = new github.getOctokit(process.env.GITHUB_TOKEN);

    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }

    const owner = contextPullRequest.base.user.login;
    const repo = contextPullRequest.base.repo.name;

    let error = null;
    try {
      await installPreset(installPresetPackage);
      await validateTitle(requirePresetPackage, contextPullRequest.title);
    } catch (err) {
      error = err;
    }

    core.setOutput("success", (error === null).toString());

    let state = "success";
    let description = successState;
    if (error) {
      state = "failure";
      description = failureState;
    }

    await client.request("POST /repos/:owner/:repo/statuses/:sha", {
      owner,
      repo,
      state,
      description,
      sha: contextPullRequest.head.sha,
      target_url: targetUrl,
      context: contextName,
    });

    if (error) {
      throw error;
    } else {
      console.log(`${state}: ${description}`);
    }
  } catch (error) {
    core.setOutput("error", error.message);
    core.setFailed(error.message);
  }
}

run().catch(console.error);
