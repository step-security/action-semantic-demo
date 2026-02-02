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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDispatchedWorkflowRun = exports.getBranchNameFromRef = void 0;
const core = __importStar(require("@actions/core"));
function getBranchNameFromHeadRef(ref) {
    const refItems = ref.split(/\/?refs\/heads\//);
    if (refItems.length > 1 && refItems[1].length > 0) {
        return refItems[1];
    }
}
function isTagRef(ref) {
    return new RegExp(/\/?refs\/tags\//).test(ref);
}
function getBranchNameFromRef(ref) {
    if (!ref) {
        return undefined;
    }
    if (isTagRef(ref)) {
        core.debug(`Unable to filter branch, unsupported ref: ${ref}`);
        return undefined;
    }
    /**
     * Worst case scenario: return original ref if getBranchNameFromHeadRef
     * cannot extract a valid branch name. This is to allow valid ref
     * like 'main' to be supported by this function. The implication of this
     * is that malformed ref like 'refs/heads/' are pass through this function
     * undetected.
     *
     * We could introduce an external third party call to validate
     * the authenticity of the branch name, but this requires additional permissions
     * for workflow_dispatch: [actions:write -> contents:read + actions:write]
     *
     * This would be a neglibile issue for repository_dispatch as it already has
     * [contents:write] permissions
     */
    return getBranchNameFromHeadRef(ref) || ref;
}
exports.getBranchNameFromRef = getBranchNameFromRef;
function getDispatchedWorkflowRun(workflowRuns, distinctID) {
    const dispatchedWorkflow = workflowRuns.find(workflowRun => workflowRun.name.includes(distinctID));
    if (dispatchedWorkflow) {
        return dispatchedWorkflow;
    }
    throw new Error(`
getDispatchedWorkflowRun: Failed to find dispatched workflow
Distinct ID: ${distinctID}`);
}
exports.getDispatchedWorkflowRun = getDispatchedWorkflowRun;
