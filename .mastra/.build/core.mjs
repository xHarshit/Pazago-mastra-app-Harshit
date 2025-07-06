import { M as MastraError } from './chunk-6UNGH46J.mjs';
import { D as DiagAPI, C as ContextAPI, c as createContextKey, r as registerGlobal, u as unregisterGlobal, g as getGlobal, t as trace, S as SpanStatusCode } from './trace-api.mjs';

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var BaggageImpl = /** @class */ (function () {
    function BaggageImpl(entries) {
        this._entries = entries ? new Map(entries) : new Map();
    }
    BaggageImpl.prototype.getEntry = function (key) {
        var entry = this._entries.get(key);
        if (!entry) {
            return undefined;
        }
        return Object.assign({}, entry);
    };
    BaggageImpl.prototype.getAllEntries = function () {
        return Array.from(this._entries.entries()).map(function (_a) {
            var _b = __read(_a, 2), k = _b[0], v = _b[1];
            return [k, v];
        });
    };
    BaggageImpl.prototype.setEntry = function (key, entry) {
        var newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
    };
    BaggageImpl.prototype.removeEntry = function (key) {
        var newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
    };
    BaggageImpl.prototype.removeEntries = function () {
        var e_1, _a;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        var newBaggage = new BaggageImpl(this._entries);
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                newBaggage._entries.delete(key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return newBaggage;
    };
    BaggageImpl.prototype.clear = function () {
        return new BaggageImpl();
    };
    return BaggageImpl;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
DiagAPI.instance();
/**
 * Create a new Baggage with optional entries
 *
 * @param entries An array of baggage entries the new baggage should contain
 */
function createBaggage(entries) {
    if (entries === void 0) { entries = {}; }
    return new BaggageImpl(new Map(Object.entries(entries)));
}

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var defaultTextMapGetter = {
    get: function (carrier, key) {
        if (carrier == null) {
            return undefined;
        }
        return carrier[key];
    },
    keys: function (carrier) {
        if (carrier == null) {
            return [];
        }
        return Object.keys(carrier);
    },
};
var defaultTextMapSetter = {
    set: function (carrier, key, value) {
        if (carrier == null) {
            return;
        }
        carrier[key] = value;
    },
};

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var SpanKind;
(function (SpanKind) {
    /** Default value. Indicates that the span is used internally. */
    SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
    /**
     * Indicates that the span covers server-side handling of an RPC or other
     * remote request.
     */
    SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
    /**
     * Indicates that the span covers the client-side wrapper around an RPC or
     * other remote request.
     */
    SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
    /**
     * Indicates that the span describes producer sending a message to a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
    /**
     * Indicates that the span describes consumer receiving a message from a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
/** Entrypoint for context API */
var context = ContextAPI.getInstance();

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * No-op implementations of {@link TextMapPropagator}.
 */
var NoopTextMapPropagator = /** @class */ (function () {
    function NoopTextMapPropagator() {
    }
    /** Noop inject function does nothing */
    NoopTextMapPropagator.prototype.inject = function (_context, _carrier) { };
    /** Noop extract function does nothing and returns the input context */
    NoopTextMapPropagator.prototype.extract = function (context, _carrier) {
        return context;
    };
    NoopTextMapPropagator.prototype.fields = function () {
        return [];
    };
    return NoopTextMapPropagator;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Baggage key
 */
var BAGGAGE_KEY = createContextKey('OpenTelemetry Baggage Key');
/**
 * Retrieve the current baggage from the given context
 *
 * @param {Context} Context that manage all context values
 * @returns {Baggage} Extracted baggage from the context
 */
function getBaggage(context) {
    return context.getValue(BAGGAGE_KEY) || undefined;
}
/**
 * Retrieve the current baggage from the active/current context
 *
 * @returns {Baggage} Extracted baggage from the context
 */
function getActiveBaggage() {
    return getBaggage(ContextAPI.getInstance().active());
}
/**
 * Store a baggage in the given context
 *
 * @param {Context} Context that manage all context values
 * @param {Baggage} baggage that will be set in the actual context
 */
function setBaggage(context, baggage) {
    return context.setValue(BAGGAGE_KEY, baggage);
}
/**
 * Delete the baggage stored in the given context
 *
 * @param {Context} Context that manage all context values
 */
function deleteBaggage(context) {
    return context.deleteValue(BAGGAGE_KEY);
}

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var API_NAME = 'propagation';
var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
/**
 * Singleton object which represents the entry point to the OpenTelemetry Propagation API
 */
var PropagationAPI = /** @class */ (function () {
    /** Empty private constructor prevents end users from constructing a new instance of the API */
    function PropagationAPI() {
        this.createBaggage = createBaggage;
        this.getBaggage = getBaggage;
        this.getActiveBaggage = getActiveBaggage;
        this.setBaggage = setBaggage;
        this.deleteBaggage = deleteBaggage;
    }
    /** Get the singleton instance of the Propagator API */
    PropagationAPI.getInstance = function () {
        if (!this._instance) {
            this._instance = new PropagationAPI();
        }
        return this._instance;
    };
    /**
     * Set the current propagator.
     *
     * @returns true if the propagator was successfully registered, else false
     */
    PropagationAPI.prototype.setGlobalPropagator = function (propagator) {
        return registerGlobal(API_NAME, propagator, DiagAPI.instance());
    };
    /**
     * Inject context into a carrier to be propagated inter-process
     *
     * @param context Context carrying tracing data to inject
     * @param carrier carrier to inject context into
     * @param setter Function used to set values on the carrier
     */
    PropagationAPI.prototype.inject = function (context, carrier, setter) {
        if (setter === void 0) { setter = defaultTextMapSetter; }
        return this._getGlobalPropagator().inject(context, carrier, setter);
    };
    /**
     * Extract context from a carrier
     *
     * @param context Context which the newly created context will inherit from
     * @param carrier Carrier to extract context from
     * @param getter Function used to extract keys from a carrier
     */
    PropagationAPI.prototype.extract = function (context, carrier, getter) {
        if (getter === void 0) { getter = defaultTextMapGetter; }
        return this._getGlobalPropagator().extract(context, carrier, getter);
    };
    /**
     * Return a list of all fields which may be used by the propagator.
     */
    PropagationAPI.prototype.fields = function () {
        return this._getGlobalPropagator().fields();
    };
    /** Remove the global propagator */
    PropagationAPI.prototype.disable = function () {
        unregisterGlobal(API_NAME, DiagAPI.instance());
    };
    PropagationAPI.prototype._getGlobalPropagator = function () {
        return getGlobal(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
    };
    return PropagationAPI;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
/** Entrypoint for propagation API */
var propagation = PropagationAPI.getInstance();

function hasActiveTelemetry(tracerName = "default-tracer") {
  try {
    return !!trace.getTracer(tracerName);
  } catch {
    return false;
  }
}
function getBaggageValues(ctx) {
  const currentBaggage = propagation.getBaggage(ctx);
  const requestId = currentBaggage?.getEntry("http.request_id")?.value;
  const componentName = currentBaggage?.getEntry("componentName")?.value;
  const runId = currentBaggage?.getEntry("runId")?.value;
  return {
    requestId,
    componentName,
    runId
  };
}

// src/telemetry/telemetry.decorators.ts
function withSpan(options) {
  return function(_target, propertyKey, descriptor) {
    if (!descriptor || typeof descriptor === "number") return;
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    descriptor.value = function(...args) {
      if (options?.skipIfNoTelemetry && !hasActiveTelemetry(options?.tracerName)) {
        return originalMethod.apply(this, args);
      }
      const tracer = trace.getTracer(options?.tracerName ?? "default-tracer");
      let spanName;
      let spanKind;
      if (typeof options === "string") {
        spanName = options;
      } else if (options) {
        spanName = options.spanName || methodName;
        spanKind = options.spanKind;
      } else {
        spanName = methodName;
      }
      const span = tracer.startSpan(spanName, { kind: spanKind });
      let ctx = trace.setSpan(context.active(), span);
      args.forEach((arg, index) => {
        try {
          span.setAttribute(`${spanName}.argument.${index}`, JSON.stringify(arg));
        } catch {
          span.setAttribute(`${spanName}.argument.${index}`, "[Not Serializable]");
        }
      });
      const { requestId, componentName, runId } = getBaggageValues(ctx);
      if (requestId) {
        span.setAttribute("http.request_id", requestId);
      }
      if (componentName) {
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
      } else if (this && this.name) {
        span.setAttribute("componentName", this.name);
        span.setAttribute("runId", this.runId);
        ctx = propagation.setBaggage(
          ctx,
          propagation.createBaggage({
            // @ts-ignore
            componentName: { value: this.name },
            // @ts-ignore
            runId: { value: this.runId },
            // @ts-ignore
            "http.request_id": { value: requestId }
          })
        );
      }
      let result;
      try {
        result = context.with(ctx, () => originalMethod.apply(this, args));
        if (result instanceof Promise) {
          return result.then((resolvedValue) => {
            try {
              span.setAttribute(`${spanName}.result`, JSON.stringify(resolvedValue));
            } catch {
              span.setAttribute(`${spanName}.result`, "[Not Serializable]");
            }
            return resolvedValue;
          }).finally(() => span.end());
        }
        try {
          span.setAttribute(`${spanName}.result`, JSON.stringify(result));
        } catch {
          span.setAttribute(`${spanName}.result`, "[Not Serializable]");
        }
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error"
        });
        if (error instanceof Error) {
          span.recordException(error);
        }
        throw error;
      } finally {
        if (!(result instanceof Promise)) {
          span.end();
        }
      }
    };
    return descriptor;
  };
}
function InstrumentClass(options) {
  return function(target) {
    const methods = Object.getOwnPropertyNames(target.prototype);
    methods.forEach((method) => {
      if (options?.excludeMethods?.includes(method) || method === "constructor") return;
      if (options?.methodFilter && !options.methodFilter(method)) return;
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, method);
      if (descriptor && typeof descriptor.value === "function") {
        Object.defineProperty(
          target.prototype,
          method,
          withSpan({
            spanName: options?.prefix ? `${options.prefix}.${method}` : method,
            skipIfNoTelemetry: true,
            spanKind: options?.spanKind || SpanKind.INTERNAL,
            tracerName: options?.tracerName
          })(target, method, descriptor)
        );
      }
    });
    return target;
  };
}

// src/storage/constants.ts
var TABLE_WORKFLOW_SNAPSHOT = "mastra_workflow_snapshot";
var TABLE_EVALS = "mastra_evals";
var TABLE_MESSAGES = "mastra_messages";
var TABLE_THREADS = "mastra_threads";
var TABLE_TRACES = "mastra_traces";
var TABLE_RESOURCES = "mastra_resources";
var TABLE_SCHEMAS = {
  [TABLE_WORKFLOW_SNAPSHOT]: {
    workflow_name: {
      type: "text"
    },
    run_id: {
      type: "text"
    },
    resourceId: { type: "text", nullable: true },
    snapshot: {
      type: "text"
    },
    createdAt: {
      type: "timestamp"
    },
    updatedAt: {
      type: "timestamp"
    }
  },
  [TABLE_EVALS]: {
    input: {
      type: "text"
    },
    output: {
      type: "text"
    },
    result: {
      type: "jsonb"
    },
    agent_name: {
      type: "text"
    },
    metric_name: {
      type: "text"
    },
    instructions: {
      type: "text"
    },
    test_info: {
      type: "jsonb",
      nullable: true
    },
    global_run_id: {
      type: "text"
    },
    run_id: {
      type: "text"
    },
    created_at: {
      type: "timestamp"
    },
    createdAt: {
      type: "timestamp",
      nullable: true
    }
  },
  [TABLE_THREADS]: {
    id: { type: "text", nullable: false, primaryKey: true },
    resourceId: { type: "text", nullable: false },
    title: { type: "text", nullable: false },
    metadata: { type: "text", nullable: true },
    createdAt: { type: "timestamp", nullable: false },
    updatedAt: { type: "timestamp", nullable: false }
  },
  [TABLE_MESSAGES]: {
    id: { type: "text", nullable: false, primaryKey: true },
    thread_id: { type: "text", nullable: false },
    content: { type: "text", nullable: false },
    role: { type: "text", nullable: false },
    type: { type: "text", nullable: false },
    createdAt: { type: "timestamp", nullable: false },
    resourceId: { type: "text", nullable: true }
  },
  [TABLE_TRACES]: {
    id: { type: "text", nullable: false, primaryKey: true },
    parentSpanId: { type: "text", nullable: true },
    name: { type: "text", nullable: false },
    traceId: { type: "text", nullable: false },
    scope: { type: "text", nullable: false },
    kind: { type: "integer", nullable: false },
    attributes: { type: "jsonb", nullable: true },
    status: { type: "jsonb", nullable: true },
    events: { type: "jsonb", nullable: true },
    links: { type: "jsonb", nullable: true },
    other: { type: "text", nullable: true },
    startTime: { type: "bigint", nullable: false },
    endTime: { type: "bigint", nullable: false },
    createdAt: { type: "timestamp", nullable: false }
  },
  [TABLE_RESOURCES]: {
    id: { type: "text", nullable: false, primaryKey: true },
    workingMemory: { type: "text", nullable: true },
    metadata: { type: "jsonb", nullable: true },
    createdAt: { type: "timestamp", nullable: false },
    updatedAt: { type: "timestamp", nullable: false }
  }
};
var Telemetry = class _Telemetry {
  tracer = trace.getTracer("default");
  name = "default-service";
  constructor(config) {
    this.name = config.serviceName ?? "default-service";
    this.tracer = trace.getTracer(this.name);
  }
  /**
   * @deprecated This method does not do anything
   */
  async shutdown() {
  }
  /**
   * Initialize telemetry with the given configuration
   * @param config - Optional telemetry configuration object
   * @returns Telemetry instance that can be used for tracing
   */
  static init(config = {}) {
    try {
      if (!globalThis.__TELEMETRY__) {
        globalThis.__TELEMETRY__ = new _Telemetry(config);
      }
      return globalThis.__TELEMETRY__;
    } catch (error) {
      const wrappedError = new MastraError(
        {
          id: "TELEMETRY_INIT_FAILED",
          text: "Failed to initialize telemetry",
          domain: "MASTRA_TELEMETRY" /* MASTRA_TELEMETRY */,
          category: "SYSTEM" /* SYSTEM */
        },
        error
      );
      throw wrappedError;
    }
  }
  static getActiveSpan() {
    const span = trace.getActiveSpan();
    return span;
  }
  /**
   * Get the global telemetry instance
   * @throws {Error} If telemetry has not been initialized
   * @returns {Telemetry} The global telemetry instance
   */
  static get() {
    if (!globalThis.__TELEMETRY__) {
      throw new MastraError({
        id: "TELEMETRY_GETTER_FAILED_GLOBAL_TELEMETRY_NOT_INITIALIZED",
        text: "Telemetry not initialized",
        domain: "MASTRA_TELEMETRY" /* MASTRA_TELEMETRY */,
        category: "USER" /* USER */
      });
    }
    return globalThis.__TELEMETRY__;
  }
  /**
   * Wraps a class instance with telemetry tracing
   * @param instance The class instance to wrap
   * @param options Optional configuration for tracing
   * @returns Wrapped instance with all methods traced
   */
  traceClass(instance, options = {}) {
    const { skipIfNoTelemetry = true } = options;
    if (skipIfNoTelemetry && !hasActiveTelemetry()) {
      return instance;
    }
    const { spanNamePrefix = instance.constructor.name.toLowerCase(), attributes = {}, excludeMethods = [] } = options;
    return new Proxy(instance, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === "function" && prop !== "constructor" && !prop.toString().startsWith("_") && !excludeMethods.includes(prop.toString())) {
          return this.traceMethod(value.bind(target), {
            spanName: `${spanNamePrefix}.${prop.toString()}`,
            attributes: {
              ...attributes,
              [`${spanNamePrefix}.name`]: target.constructor.name,
              [`${spanNamePrefix}.method.name`]: prop.toString()
            }
          });
        }
        return value;
      }
    });
  }
  static setBaggage(baggage, ctx = context.active()) {
    const currentBaggage = Object.fromEntries(propagation.getBaggage(ctx)?.getAllEntries() ?? []);
    const newCtx = propagation.setBaggage(
      ctx,
      propagation.createBaggage({
        ...currentBaggage,
        ...baggage
      })
    );
    return newCtx;
  }
  static withContext(ctx, fn) {
    return context.with(ctx, fn);
  }
  /**
   * method to trace individual methods with proper context
   * @param method The method to trace
   * @param context Additional context for the trace
   * @returns Wrapped method with tracing
   */
  traceMethod(method, context3) {
    let ctx = context.active();
    const { skipIfNoTelemetry = true } = context3;
    if (skipIfNoTelemetry && !hasActiveTelemetry()) {
      return method;
    }
    return (...args) => {
      const span = this.tracer.startSpan(context3.spanName);
      function handleError(error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.end();
        throw error;
      }
      try {
        let recordResult2 = function(res) {
          try {
            span.setAttribute(`${context3.spanName}.result`, JSON.stringify(res));
          } catch {
            span.setAttribute(`${context3.spanName}.result`, "[Not Serializable]");
          }
          span.end();
          return res;
        };
        const { requestId, componentName, runId } = getBaggageValues(ctx);
        if (context3.attributes) {
          span.setAttributes(context3.attributes);
        }
        if (requestId) {
          span.setAttribute("http.request_id", requestId);
        }
        if (context3.attributes?.componentName) {
          ctx = propagation.setBaggage(
            ctx,
            propagation.createBaggage({
              componentName: { value: context3.attributes.componentName },
              // @ts-ignore
              runId: { value: context3.attributes.runId },
              // @ts-ignore
              "http.request_id": { value: requestId }
            })
          );
        } else {
          if (componentName) {
            span.setAttribute("componentName", componentName);
            span.setAttribute("runId", runId);
          } else if (this && this.name) {
            span.setAttribute("componentName", this.name);
            span.setAttribute("runId", this.runId);
            ctx = propagation.setBaggage(
              ctx,
              propagation.createBaggage({
                componentName: { value: this.name },
                // @ts-ignore
                runId: { value: this.runId },
                // @ts-ignore
                "http.request_id": { value: requestId }
              })
            );
          }
        }
        args.forEach((arg, index) => {
          try {
            span.setAttribute(`${context3.spanName}.argument.${index}`, JSON.stringify(arg));
          } catch {
            span.setAttribute(`${context3.spanName}.argument.${index}`, "[Not Serializable]");
          }
        });
        let result;
        context.with(trace.setSpan(ctx, span), () => {
          result = method(...args);
        });
        if (result instanceof Promise) {
          return result.then(recordResult2).catch(handleError);
        } else {
          return recordResult2(result);
        }
      } catch (error) {
        handleError(error);
      }
    };
  }
  getBaggageTracer() {
    return new BaggageTracer(this.tracer);
  }
};
var BaggageTracer = class {
  _tracer;
  constructor(tracer) {
    this._tracer = tracer;
  }
  startSpan(name, options = {}, ctx) {
    ctx = ctx ?? context.active();
    const span = this._tracer.startSpan(name, options, ctx);
    const { componentName, runId, requestId } = getBaggageValues(ctx);
    span.setAttribute("componentName", componentName);
    span.setAttribute("runId", runId);
    span.setAttribute("http.request_id", requestId);
    return span;
  }
  startActiveSpan(name, optionsOrFn, ctxOrFn, fn) {
    if (typeof optionsOrFn === "function") {
      const wrappedFn2 = (span) => {
        const { componentName, runId, requestId } = getBaggageValues(context.active());
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
        span.setAttribute("http.request_id", requestId);
        return optionsOrFn(span);
      };
      return this._tracer.startActiveSpan(name, {}, context.active(), wrappedFn2);
    }
    if (typeof ctxOrFn === "function") {
      const wrappedFn2 = (span) => {
        const { componentName, runId, requestId } = getBaggageValues(context.active());
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
        span.setAttribute("http.request_id", requestId);
        return ctxOrFn(span);
      };
      return this._tracer.startActiveSpan(name, optionsOrFn, context.active(), wrappedFn2);
    }
    const wrappedFn = (span) => {
      const { componentName, runId, requestId } = getBaggageValues(ctxOrFn ?? context.active());
      span.setAttribute("componentName", componentName);
      span.setAttribute("runId", runId);
      span.setAttribute("http.request_id", requestId);
      return fn(span);
    };
    return this._tracer.startActiveSpan(name, optionsOrFn, ctxOrFn, wrappedFn);
  }
};

export { InstrumentClass as I, Telemetry as T, TABLE_WORKFLOW_SNAPSHOT as a, TABLE_EVALS as b, TABLE_MESSAGES as c, TABLE_THREADS as d, TABLE_TRACES as e, TABLE_SCHEMAS as f, TABLE_RESOURCES as g, context as h };
