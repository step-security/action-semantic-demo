"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExponentialBackoff = exports.ActionOutputs = exports.DispatchMethod = void 0;
var DispatchMethod;
(function (DispatchMethod) {
    DispatchMethod["RepositoryDispatch"] = "repository_dispatch";
    DispatchMethod["WorkflowDispatch"] = "workflow_dispatch";
})(DispatchMethod || (exports.DispatchMethod = DispatchMethod = {}));
var ActionOutputs;
(function (ActionOutputs) {
    ActionOutputs["RunId"] = "run-id";
    ActionOutputs["RunUrl"] = "run-url";
})(ActionOutputs || (exports.ActionOutputs = ActionOutputs = {}));
// Default parameters for exponential backoff. These will be the fallback
// options in the event that the parameters responsible for tuning exponential
// backoff are provided non-numeric inputs
var ExponentialBackoff;
(function (ExponentialBackoff) {
    ExponentialBackoff[ExponentialBackoff["StartingDelay"] = 200] = "StartingDelay";
    ExponentialBackoff[ExponentialBackoff["MaxAttempts"] = 5] = "MaxAttempts";
    ExponentialBackoff[ExponentialBackoff["TimeMultiple"] = 2] = "TimeMultiple";
})(ExponentialBackoff || (exports.ExponentialBackoff = ExponentialBackoff = {}));
