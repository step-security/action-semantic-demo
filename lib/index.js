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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exponential_backoff_1 = require("exponential-backoff");
const uuid_1 = require("uuid");
const action_1 = require("./action");
const api = __importStar(require("./api"));
const utils_1 = require("./utils");
const axios_1 = __importStar(require("axios"));
const DISTINCT_ID = (0, uuid_1.v4)();
function validateSubscription() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const repoPrivate = (_c = (_b = (_a = github.context) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.repository) === null || _c === void 0 ? void 0 : _c.private;
        const visibilityUnknown = repoPrivate === undefined;
        core.info(`Starting subscription validation - Repository private: ${repoPrivate}, Visibility unknown: ${visibilityUnknown}`);
        if (repoPrivate === false) {
            core.info('Repository is public, skipping subscription validation.');
            return;
        }
        if (repoPrivate === true) {
            core.info('Repository is private, proceeding with subscription validation.');
        }
        else if (visibilityUnknown) {
            core.info('Repository visibility is unknown, proceeding with subscription validation.');
        }
        const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
        const params = {};
        if (process.env.GITHUB_ACTION_REPOSITORY)
            params.action = process.env.GITHUB_ACTION_REPOSITORY;
        if (serverUrl !== 'https://github.com')
            params.ghes_server = serverUrl;
        if (visibilityUnknown)
            params.repo_visibility = 'unknown';
        core.debug(`Validation params: ${JSON.stringify(params)}`);
        try {
            core.info('Checking subscription status...');
            yield axios_1.default.get(`https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`, { params, timeout: 3000 });
            core.info('Subscription validation successful.');
        }
        catch (error) {
            if ((0, axios_1.isAxiosError)(error) && ((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 403) {
                core.error('Subscription validation failed: 403 Forbidden');
                console.error('This StepSecurity maintained action is free for public repositories.\n' +
                    'This repository is private and does not currently have a StepSecurity Enterprise subscription enabled, so the action was not executed.\n\n' +
                    'Learn more:\n' +
                    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions');
                process.exit(1);
            }
            core.warning(`Subscription validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            core.info('Timeout or API not reachable. Continuing to next step.');
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield validateSubscription();
            const config = (0, action_1.getConfig)();
            api.init(config);
            const backoffOptions = (0, action_1.getBackoffOptions)(config);
            // Display Exponential Backoff Options (if debug mode is enabled)
            core.info(`🔄 Exponential backoff parameters:
    starting-delay: ${backoffOptions.startingDelay}
    max-attempts: ${backoffOptions.numOfAttempts}
    time-multiple: ${backoffOptions.timeMultiple}`);
            // Get the workflow ID if give a string
            if (typeof config.workflow === 'string') {
                const workflowFileName = config.workflow;
                core.info(`⌛ Fetching workflow id for ${workflowFileName}`);
                const workflowId = yield (0, exponential_backoff_1.backOff)(() => __awaiter(this, void 0, void 0, function* () { return api.getWorkflowId(workflowFileName); }), backoffOptions);
                core.info(`✅ Fetched workflow id: ${workflowId}`);
                config.workflow = workflowId;
            }
            // Dispatch the action using the chosen dispatch method
            if (config.dispatchMethod === action_1.DispatchMethod.WorkflowDispatch) {
                yield api.workflowDispatch(DISTINCT_ID);
            }
            else {
                yield api.repositoryDispatch(DISTINCT_ID);
            }
            // Exit Early Early if discover is disabled
            if (!config.discover) {
                core.info('✅ Workflow dispatched! Skipping the retrieval of the run-id');
                return;
            }
            core.info(`⌛ Fetching run-ids for workflow with distinct-id=${DISTINCT_ID}`);
            const dispatchedWorkflowRun = yield (0, exponential_backoff_1.backOff)(() => __awaiter(this, void 0, void 0, function* () {
                const workflowRuns = yield api.getWorkflowRuns();
                const dispatchedWorkflowRun = (0, utils_1.getDispatchedWorkflowRun)(workflowRuns, DISTINCT_ID);
                return dispatchedWorkflowRun;
            }), backoffOptions);
            core.info(`✅ Successfully identified remote run:
    run-id: ${dispatchedWorkflowRun.id}
    run-url: ${dispatchedWorkflowRun.htmlUrl}`);
            core.setOutput(action_1.ActionOutputs.RunId, dispatchedWorkflowRun.id);
            core.setOutput(action_1.ActionOutputs.RunUrl, dispatchedWorkflowRun.htmlUrl);
        }
        catch (error) {
            if (error instanceof Error) {
                core.warning('🟠 Does the token have the correct permissions?');
                error.stack && core.debug(error.stack);
                core.setFailed(`🔴 Failed to complete: ${error.message}`);
            }
        }
    });
}
run();
