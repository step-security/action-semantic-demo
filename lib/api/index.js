"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultBranch = exports.getWorkflowRuns = exports.getWorkflowId = exports.repositoryDispatch = exports.workflowDispatch = exports.init = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const action_1 = require("../action");
const utils_1 = require("../utils");
let config;
let octokit;
function init(cfg) {
    config = cfg || (0, action_1.getConfig)();
    octokit = github.getOctokit(config.token);
}
exports.init = init;
function workflowDispatch(distinctId) {
    return __awaiter(this, void 0, void 0, function* () {
        const inputs = Object.assign(Object.assign({}, config.workflowInputs), (config.discover ? { distinct_id: distinctId } : undefined));
        if (!config.workflow) {
            throw new Error(`workflow_dispatch: An input to 'workflow' was not provided`);
        }
        if (!config.ref) {
            throw new Error(`workflow_dispatch: An input to 'ref' was not provided`);
        }
        // GitHub released a breaking change to the createWorkflowDispatch API that resulted in a change where the returned
        // status code changed to 200, from 204. At the time, the @octokit/types had not been updated to reflect this change.
        //
        // Given that we are in an interim state where the API behaviour, but the public documentation has not been updated
        // to reflect this change, and GitHub has not yet released any updates on this topic. I can going to play the safe
        // route and assume that the response status code could be either 200 or 204.
        //
        // Reference:     https://github.com/orgs/community/discussions/9752#discussioncomment-15295321
        // Documentation: https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
        const response = (yield octokit.rest.actions.createWorkflowDispatch({
            owner: config.owner,
            repo: config.repo,
            workflow_id: config.workflow,
            ref: config.ref,
            inputs
        }));
        if (response.status !== 200 && response.status !== 204) {
            throw new Error(`workflow_dispatch: Failed to dispatch action, expected 200 or 204 but received ${response.status}`);
        }
        core.info(`✅ Successfully dispatched workflow using workflow_dispatch method:
    repository: ${config.owner}/${config.repo}
    branch: ${config.ref}
    workflow-id: ${config.workflow}
    distinct-id: ${distinctId}
    workflow-inputs: ${JSON.stringify(inputs)}`);
    });
}
exports.workflowDispatch = workflowDispatch;
function repositoryDispatch(distinctId) {
    return __awaiter(this, void 0, void 0, function* () {
        const clientPayload = Object.assign(Object.assign({}, config.workflowInputs), (config.discover ? { distinct_id: distinctId } : undefined));
        if (!config.eventType) {
            throw new Error(`repository_dispatch: An input to 'event-type' was not provided`);
        }
        // https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
        const response = yield octokit.rest.repos.createDispatchEvent({
            owner: config.owner,
            repo: config.repo,
            event_type: config.eventType,
            client_payload: clientPayload
        });
        if (response.status !== 204) {
            throw new Error(`repository_dispatch: Failed to dispatch action, expected 204 but received ${response.status}`);
        }
        core.info(`✅ Successfully dispatched workflow using repository_dispatch method:
    repository: ${config.owner}/${config.repo}
    event-type: ${config.eventType}
    distinct-id: ${distinctId}
    client-payload: ${JSON.stringify(clientPayload)}`);
    });
}
exports.repositoryDispatch = repositoryDispatch;
function getWorkflowId(workflowFilename) {
    return __awaiter(this, void 0, void 0, function* () {
        // https://docs.github.com/en/rest/reference/actions#list-repository-workflows
        const response = yield octokit.rest.actions.listRepoWorkflows({
            owner: config.owner,
            repo: config.repo
        });
        if (response.status !== 200) {
            throw new Error(`Failed to get workflows, expected 200 but received ${response.status}`);
        }
        const workflow = response.data.workflows.find(workflow => workflow.path.includes(workflowFilename));
        if (!workflow) {
            throw new Error(`getWorkflowId: Unable to find ID for Workflow: ${workflowFilename}`);
        }
        return workflow.id;
    });
}
exports.getWorkflowId = getWorkflowId;
function getWorkflowRuns() {
    return __awaiter(this, void 0, void 0, function* () {
        let status;
        let branchName;
        let response;
        if (config.dispatchMethod === action_1.DispatchMethod.WorkflowDispatch) {
            branchName = (0, utils_1.getBranchNameFromRef)(config.ref);
            if (!config.workflow) {
                throw new Error(`An input to 'workflow' was not provided`);
            }
            // https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-workflow
            response = yield octokit.rest.actions.listWorkflowRuns(Object.assign({ owner: config.owner, repo: config.repo, workflow_id: config.workflow }, (branchName
                ? {
                    branch: branchName,
                    per_page: 5
                }
                : {
                    per_page: 10
                })));
            status = response.status;
        }
        else {
            // repository_dipsatch can only be triggered from the default branch
            const branchName = yield getDefaultBranch();
            // https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
            response = yield octokit.rest.actions.listWorkflowRunsForRepo({
                owner: config.owner,
                repo: config.repo,
                branch: branchName,
                event: action_1.DispatchMethod.RepositoryDispatch,
                per_page: 5
            });
            status = response.status;
        }
        if (status !== 200) {
            throw new Error(`getWorkflowRuns: Failed to get workflow runs, expected 200 but received ${status}`);
        }
        const workflowRuns = response.data.workflow_runs.map(workflowRun => ({
            id: workflowRun.id,
            name: workflowRun.name || '',
            htmlUrl: workflowRun.html_url
        }));
        core.debug(`
Fetched Workflow Runs
Repository: ${config.owner}/${config.repo}
Branch: ${branchName || 'undefined'}
Runs Fetched: [${workflowRuns.map(workflowRun => workflowRun.id)}]`);
        return workflowRuns;
    });
}
exports.getWorkflowRuns = getWorkflowRuns;
function getDefaultBranch() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.repos.get({
            owner: config.owner,
            repo: config.repo
        });
        if (response.status !== 200) {
            throw new Error(`getDefaultBranch: Failed to get repository information, expected 200 but received ${response.status}`);
        }
        core.debug(`
Fetched Repository Information
Repository: ${config.owner}/${config.repo}
Default Branch: ${response.data.default_branch}`);
        return response.data.default_branch;
    });
}
exports.getDefaultBranch = getDefaultBranch;
__exportStar(require("./api.types"), exports);
