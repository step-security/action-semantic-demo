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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackoffOptions = exports.getConfig = void 0;
const core = __importStar(require("@actions/core"));
const action_types_1 = require("./action.types");
function getNumberFromValue(value) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
}
function getWorkflowIdFromValue(value) {
    // Only treat as a workflow ID if the entire string is a positive integer
    // This prevents filenames like "1-release.yaml" from being parsed as workflow ID 1
    if (!/^\d+$/.test(value)) {
        return undefined;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
}
function getWorkflowInputs(dispatchMethod) {
    const workflowInputs = core.getInput('workflow-inputs');
    if (workflowInputs === '') {
        return {};
    }
    try {
        const parsedWorkflowInputs = JSON.parse(workflowInputs);
        if (dispatchMethod === action_types_1.DispatchMethod.RepositoryDispatch) {
            return parsedWorkflowInputs;
        }
        for (const key in parsedWorkflowInputs) {
            if (typeof parsedWorkflowInputs[key] !== 'string') {
                throw new Error(`
For the workflow_dispatch method, the only supported value type is string
Key: ${key}
Current Type: ${typeof parsedWorkflowInputs[key]}
Expected Type: string
`);
            }
        }
        return parsedWorkflowInputs;
    }
    catch (error) {
        core.error('Failed to parse input: workflow_inputs');
        throw error;
    }
}
function getDispatchMethod() {
    const dispatchMethod = core.getInput('dispatch-method', { required: true });
    try {
        if (Object.values(action_types_1.DispatchMethod).includes(dispatchMethod)) {
            return dispatchMethod;
        }
        else {
            throw new Error(`
Allowed Values: [${Object.values(action_types_1.DispatchMethod).join(', ')}]
Current Value: ${dispatchMethod}
`);
        }
    }
    catch (error) {
        core.error(`Failed to parse input: dispatch-method`);
        throw error;
    }
}
function getRef(dispatchMethod) {
    const ref = core.getInput('ref');
    try {
        if (dispatchMethod === action_types_1.DispatchMethod.RepositoryDispatch && !!ref) {
            throw new Error(`
Currently the repository_dispatch method only supports dispatching workflows
from the default branch. Therefore, the 'ref' input is not supported and must be ignored.
The workflow_dispatch method supports dispatching workflows from non-default branches`);
        }
        if (dispatchMethod === action_types_1.DispatchMethod.WorkflowDispatch && !ref) {
            throw new Error(`
A valid git reference must be provided to the 'ref' input, if using the workflow_dispatch method.
Can be formatted as 'main' or 'refs/heads/main'`);
        }
    }
    catch (error) {
        core.error(`Failed to parse input: ref`);
        throw error;
    }
    return ref || undefined;
}
function getEventType(dispatchMethod) {
    const eventType = core.getInput('event-type');
    try {
        if (dispatchMethod === action_types_1.DispatchMethod.RepositoryDispatch && !eventType) {
            throw new Error(`
An event-type must be provided to the 'event-type' input, if using the repository_dispatch method.`);
        }
        if (dispatchMethod === action_types_1.DispatchMethod.WorkflowDispatch && !!eventType) {
            throw new Error(`
The 'event-type' input is not supported for the workflow_dispatch method and must be ignored.`);
        }
    }
    catch (error) {
        core.error(`Failed to parse input: event-type`);
        throw error;
    }
    return eventType || undefined;
}
function getWorkflow(dispatchMethod) {
    const workflow = core.getInput('workflow');
    try {
        if (dispatchMethod === action_types_1.DispatchMethod.WorkflowDispatch && !workflow) {
            throw new Error(`
A workflow file name or ID must be provided to the 'workflow' input, if using the workflow_dispatch method`);
        }
        if (dispatchMethod === action_types_1.DispatchMethod.RepositoryDispatch && !!workflow) {
            throw new Error(`
The 'workflow' input is not supported for the repository_dispatch method and must be ignored.`);
        }
    }
    catch (error) {
        core.error(`Failed to parse input: workflow`);
        if (error instanceof Error) {
            error.stack && core.debug(error.stack);
        }
        throw error;
    }
    if (dispatchMethod === action_types_1.DispatchMethod.WorkflowDispatch) {
        return getWorkflowIdFromValue(workflow) || workflow;
    }
    return undefined;
}
function getConfig() {
    const dispatchMethod = getDispatchMethod();
    return {
        dispatchMethod,
        repo: core.getInput('repo', { required: true }),
        owner: core.getInput('owner', { required: true }),
        token: core.getInput('token', { required: true }),
        ref: getRef(dispatchMethod),
        workflow: getWorkflow(dispatchMethod),
        eventType: getEventType(dispatchMethod),
        workflowInputs: getWorkflowInputs(dispatchMethod),
        discover: core.getBooleanInput('discover'),
        startingDelay: getNumberFromValue(core.getInput('starting-delay-ms')) ||
            action_types_1.ExponentialBackoff.StartingDelay,
        maxAttempts: getNumberFromValue(core.getInput('max-attempts')) ||
            action_types_1.ExponentialBackoff.MaxAttempts,
        timeMultiple: getNumberFromValue(core.getInput('time-multiple')) ||
            action_types_1.ExponentialBackoff.TimeMultiple
    };
}
exports.getConfig = getConfig;
function getBackoffOptions(config) {
    return {
        timeMultiple: config.timeMultiple,
        numOfAttempts: config.maxAttempts,
        startingDelay: config.startingDelay
    };
}
exports.getBackoffOptions = getBackoffOptions;
__exportStar(require("./action.types"), exports);
