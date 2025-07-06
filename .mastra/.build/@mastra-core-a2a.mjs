// src/a2a/types.ts
var ErrorCodeParseError = -32700;
var ErrorCodeInvalidRequest = -32600;
var ErrorCodeMethodNotFound = -32601;
var ErrorCodeInvalidParams = -32602;
var ErrorCodeInternalError = -32603;
var ErrorCodeTaskNotFound = -32001;
var ErrorCodeTaskNotCancelable = -32002;
var ErrorCodePushNotificationNotSupported = -32003;
var ErrorCodeUnsupportedOperation = -32004;

// src/a2a/error.ts
var A2AError = class _A2AError extends Error {
  code;
  data;
  taskId;
  // Optional task ID context
  constructor(code, message, data, taskId) {
    super(message);
    this.name = "A2AError";
    this.code = code;
    this.data = data;
    this.taskId = taskId;
  }
  /**
   * Formats the error into a standard JSON-RPC error object structure.
   */
  toJSONRPCError() {
    const errorObject = {
      code: this.code,
      message: this.message
    };
    if (this.data !== void 0) {
      errorObject.data = this.data;
    }
    return errorObject;
  }
  // Static factory methods for common errors
  static parseError(message, data) {
    return new _A2AError(ErrorCodeParseError, message, data);
  }
  static invalidRequest(message, data) {
    return new _A2AError(ErrorCodeInvalidRequest, message, data);
  }
  static methodNotFound(method) {
    return new _A2AError(ErrorCodeMethodNotFound, `Method not found: ${method}`);
  }
  static invalidParams(message, data) {
    return new _A2AError(ErrorCodeInvalidParams, message, data);
  }
  static internalError(message, data) {
    return new _A2AError(ErrorCodeInternalError, message, data);
  }
  static taskNotFound(taskId) {
    return new _A2AError(ErrorCodeTaskNotFound, `Task not found: ${taskId}`, void 0, taskId);
  }
  static taskNotCancelable(taskId) {
    return new _A2AError(ErrorCodeTaskNotCancelable, `Task not cancelable: ${taskId}`, void 0, taskId);
  }
  static pushNotificationNotSupported() {
    return new _A2AError(ErrorCodePushNotificationNotSupported, "Push Notification is not supported");
  }
  static unsupportedOperation(operation) {
    return new _A2AError(ErrorCodeUnsupportedOperation, `Unsupported operation: ${operation}`);
  }
};

export { A2AError };
