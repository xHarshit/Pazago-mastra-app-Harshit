import { I as InstrumentClass } from './core.mjs';
import { M as MastraError } from './chunk-6UNGH46J.mjs';
import { M as MastraBase, O as OpenAIReasoningSchemaCompatLayer, b as OpenAISchemaCompatLayer, G as GoogleSchemaCompatLayer, A as AnthropicSchemaCompatLayer, D as DeepSeekSchemaCompatLayer, f as MetaSchemaCompatLayer, g as applyCompatLayer, h as generateText, o as output_exports, j as generateObject, s as streamText, k as streamObject, l as jsonSchema, m as delay, n as ensureToolProperties, q as makeCoreTool, r as createMastraProxy } from './utils.mjs';
import { b as __decoratorStart, _ as __decorateElement, a as __runInitializers, c as __toESM, d as __commonJS } from './chunk-WQNOATKB.mjs';
import { M as MessageList } from './chunk-2H5YEBCO.mjs';
import { e as executeHook } from './hooks.mjs';
import { R as RegisteredLogger } from './chunk-5YDTZN2X.mjs';
import { w as ZodArray, o as objectType, s as stringType } from './types.mjs';
import { RuntimeContext } from './@mastra-core-runtime-context.mjs';
import { randomUUID } from 'crypto';

// src/voice/voice.ts
var _MastraVoice_decorators, _init$1, _a$1;
_MastraVoice_decorators = [InstrumentClass({
  prefix: "voice",
  excludeMethods: ["__setTools", "__setLogger", "__setTelemetry", "#log"]
})];
var MastraVoice = class extends (_a$1 = MastraBase) {
  listeningModel;
  speechModel;
  speaker;
  realtimeConfig;
  constructor({
    listeningModel,
    speechModel,
    speaker,
    realtimeConfig,
    name
  } = {}) {
    super({
      component: "VOICE",
      name
    });
    this.listeningModel = listeningModel;
    this.speechModel = speechModel;
    this.speaker = speaker;
    this.realtimeConfig = realtimeConfig;
  }
  traced(method, methodName) {
    return this.telemetry?.traceMethod(method, {
      spanName: `voice.${methodName}`,
      attributes: {
        "voice.type": this.speechModel?.name || this.listeningModel?.name || "unknown"
      }
    }) ?? method;
  }
  updateConfig(_options) {
    this.logger.warn("updateConfig not implemented by this voice provider");
  }
  /**
   * Initializes a WebSocket or WebRTC connection for real-time communication
   * @returns Promise that resolves when the connection is established
   */
  connect(_options) {
    this.logger.warn("connect not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Relay audio data to the voice provider for real-time processing
   * @param audioData Audio data to relay
   */
  send(_audioData) {
    this.logger.warn("relay not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Trigger voice providers to respond
   */
  answer(_options) {
    this.logger.warn("answer not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Equip the voice provider with instructions
   * @param instructions Instructions to add
   */
  addInstructions(_instructions) {}
  /**
   * Equip the voice provider with tools
   * @param tools Array of tools to add
   */
  addTools(_tools) {}
  /**
   * Disconnect from the WebSocket or WebRTC connection
   */
  close() {
    this.logger.warn("close not implemented by this voice provider");
  }
  /**
   * Register an event listener
   * @param event Event name (e.g., 'speaking', 'writing', 'error')
   * @param callback Callback function that receives event data
   */
  on(_event, _callback) {
    this.logger.warn("on not implemented by this voice provider");
  }
  /**
   * Remove an event listener
   * @param event Event name (e.g., 'speaking', 'writing', 'error')
   * @param callback Callback function to remove
   */
  off(_event, _callback) {
    this.logger.warn("off not implemented by this voice provider");
  }
  /**
   * Get available speakers/voices
   * @returns Array of available voice IDs and their metadata
   */
  getSpeakers() {
    this.logger.warn("getSpeakers not implemented by this voice provider");
    return Promise.resolve([]);
  }
  /**
   * Get available speakers/voices
   * @returns Array of available voice IDs and their metadata
   */
  getListener() {
    this.logger.warn("getListener not implemented by this voice provider");
    return Promise.resolve({
      enabled: false
    });
  }
};
MastraVoice = /*@__PURE__*/(_ => {
  _init$1 = __decoratorStart(_a$1);
  MastraVoice = __decorateElement(_init$1, 0, "MastraVoice", _MastraVoice_decorators, MastraVoice);
  __runInitializers(_init$1, 1, MastraVoice);

  // src/voice/composite-voice.ts
  return MastraVoice;
})();

// src/voice/default-voice.ts
var DefaultVoice = class extends MastraVoice {
  constructor() {
    super();
  }
  async speak(_input) {
    throw new MastraError({
      id: "VOICE_DEFAULT_NO_SPEAK_PROVIDER",
      text: "No voice provider configured",
      domain: "MASTRA_VOICE" /* MASTRA_VOICE */,
      category: "USER" /* USER */
    });
  }
  async listen(_input) {
    throw new MastraError({
      id: "VOICE_DEFAULT_NO_LISTEN_PROVIDER",
      text: "No voice provider configured",
      domain: "MASTRA_VOICE" /* MASTRA_VOICE */,
      category: "USER" /* USER */
    });
  }
  async getSpeakers() {
    throw new MastraError({
      id: "VOICE_DEFAULT_NO_SPEAKERS_PROVIDER",
      text: "No voice provider configured",
      domain: "MASTRA_VOICE" /* MASTRA_VOICE */,
      category: "USER" /* USER */
    });
  }
  async getListener() {
    throw new MastraError({
      id: "VOICE_DEFAULT_NO_LISTENER_PROVIDER",
      text: "No voice provider configured",
      domain: "MASTRA_VOICE" /* MASTRA_VOICE */,
      category: "USER" /* USER */
    });
  }
};

// src/llm/model/base.ts
var MastraLLMBase = class extends MastraBase {
  // @ts-ignore
  #mastra;
  #model;
  constructor({ name, model }) {
    super({
      component: RegisteredLogger.LLM,
      name
    });
    this.#model = model;
  }
  getProvider() {
    return this.#model.provider;
  }
  getModelId() {
    return this.#model.modelId;
  }
  getModel() {
    return this.#model;
  }
  convertToMessages(messages) {
    if (Array.isArray(messages)) {
      return messages.map((m) => {
        if (typeof m === "string") {
          return {
            role: "user",
            content: m
          };
        }
        return m;
      });
    }
    return [
      {
        role: "user",
        content: messages
      }
    ];
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  __registerMastra(p) {
    this.#mastra = p;
  }
  async __text(input) {
    this.logger.debug(`[LLMs:${this.name}] Generating text.`, { input });
    throw new Error("Method not implemented.");
  }
  async __textObject(input) {
    this.logger.debug(`[LLMs:${this.name}] Generating object.`, { input });
    throw new Error("Method not implemented.");
  }
  async generate(messages, options) {
    this.logger.debug(`[LLMs:${this.name}] Generating text.`, { messages, options });
    throw new Error("Method not implemented.");
  }
  async __stream(input) {
    this.logger.debug(`[LLMs:${this.name}] Streaming text.`, { input });
    throw new Error("Method not implemented.");
  }
  async __streamObject(input) {
    this.logger.debug(`[LLMs:${this.name}] Streaming object.`, { input });
    throw new Error("Method not implemented.");
  }
  async stream(messages, options) {
    this.logger.debug(`[LLMs:${this.name}] Streaming text.`, { messages, options });
    throw new Error("Method not implemented.");
  }
};

// src/llm/model/model.ts
var MastraLLM = class extends MastraLLMBase {
  #model;
  #mastra;
  constructor({ model, mastra }) {
    super({ name: "aisdk", model });
    this.#model = model;
    if (mastra) {
      this.#mastra = mastra;
      if (mastra.getLogger()) {
        this.__setLogger(this.#mastra.getLogger());
      }
    }
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  __registerMastra(p) {
    this.#mastra = p;
  }
  getProvider() {
    return this.#model.provider;
  }
  getModelId() {
    return this.#model.modelId;
  }
  getModel() {
    return this.#model;
  }
  _applySchemaCompat(schema) {
    const model = this.#model;
    const schemaCompatLayers = [];
    if (model) {
      schemaCompatLayers.push(
        new OpenAIReasoningSchemaCompatLayer(model),
        new OpenAISchemaCompatLayer(model),
        new GoogleSchemaCompatLayer(model),
        new AnthropicSchemaCompatLayer(model),
        new DeepSeekSchemaCompatLayer(model),
        new MetaSchemaCompatLayer(model)
      );
    }
    return applyCompatLayer({
      schema,
      compatLayers: schemaCompatLayers,
      mode: "aiSdkSchema"
    });
  }
  async __text({
    runId,
    messages,
    maxSteps = 5,
    tools = {},
    temperature,
    toolChoice = "auto",
    onStepFinish,
    experimental_output,
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Generating text`, {
      runId,
      messages,
      maxSteps,
      threadId,
      resourceId,
      tools: Object.keys(tools)
    });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      toolChoice,
      maxSteps,
      onStepFinish: async (props) => {
        try {
          await onStepFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_TEXT_ON_STEP_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                modelId: model.modelId,
                modelProvider: model.provider,
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                finishReason: props?.finishReason,
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                usage: props?.usage ? JSON.stringify(props.usage) : ""
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      ...rest
    };
    let schema;
    if (experimental_output) {
      this.logger.debug("[LLM] - Using experimental output", {
        runId
      });
      if (typeof experimental_output.parse === "function") {
        schema = experimental_output;
        if (schema instanceof ZodArray) {
          schema = schema._def.type;
        }
      } else {
        schema = jsonSchema(experimental_output);
      }
    }
    try {
      return await generateText({
        messages,
        ...argsForExecute,
        experimental_telemetry: {
          ...this.experimental_telemetry,
          ...telemetry
        },
        experimental_output: schema ? output_exports.object({
          schema
        }) : void 0
      });
    } catch (e) {
      const mastraError = new MastraError(
        {
          id: "LLM_GENERATE_TEXT_AI_SDK_EXECUTION_FAILED",
          domain: "LLM" /* LLM */,
          category: "THIRD_PARTY" /* THIRD_PARTY */,
          details: {
            modelId: model.modelId,
            modelProvider: model.provider,
            runId: runId ?? "unknown",
            threadId: threadId ?? "unknown",
            resourceId: resourceId ?? "unknown"
          }
        },
        e
      );
      this.logger.trackException(mastraError);
      throw mastraError;
    }
  }
  async __textObject({
    messages,
    onStepFinish,
    maxSteps = 5,
    tools = {},
    structuredOutput,
    runId,
    temperature,
    toolChoice = "auto",
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Generating a text object`, { runId });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        try {
          await onStepFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_TEXT_OBJECT_ON_STEP_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                finishReason: props?.finishReason,
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                usage: props?.usage ? JSON.stringify(props.usage) : ""
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      ...rest
    };
    let output = "object";
    if (structuredOutput instanceof ZodArray) {
      output = "array";
      structuredOutput = structuredOutput._def.type;
    }
    try {
      const processedSchema = this._applySchemaCompat(structuredOutput);
      return await generateObject({
        messages,
        ...argsForExecute,
        output,
        schema: processedSchema,
        experimental_telemetry: {
          ...this.experimental_telemetry,
          ...telemetry
        }
      });
    } catch (e) {
      const mastraError = new MastraError(
        {
          id: "LLM_GENERATE_OBJECT_AI_SDK_EXECUTION_FAILED",
          domain: "LLM" /* LLM */,
          category: "THIRD_PARTY" /* THIRD_PARTY */,
          details: {
            modelId: model.modelId,
            modelProvider: model.provider,
            runId: runId ?? "unknown",
            threadId: threadId ?? "unknown",
            resourceId: resourceId ?? "unknown"
          }
        },
        e
      );
      this.logger.trackException(mastraError);
      throw mastraError;
    }
  }
  async __stream({
    messages,
    onStepFinish,
    onFinish,
    maxSteps = 5,
    tools = {},
    runId,
    temperature,
    toolChoice = "auto",
    experimental_output,
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Streaming text`, {
      runId,
      threadId,
      resourceId,
      messages,
      maxSteps,
      tools: Object.keys(tools || {})
    });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        try {
          await onStepFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_STREAM_ON_STEP_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                modelId: model.modelId,
                modelProvider: model.provider,
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                finishReason: props?.finishReason,
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                usage: props?.usage ? JSON.stringify(props.usage) : ""
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Stream Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      onFinish: async (props) => {
        try {
          await onFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_STREAM_ON_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                modelId: model.modelId,
                modelProvider: model.provider,
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                finishReason: props?.finishReason,
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                usage: props?.usage ? JSON.stringify(props.usage) : ""
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Stream Finished:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
      },
      ...rest
    };
    let schema;
    if (experimental_output) {
      this.logger.debug("[LLM] - Using experimental output", {
        runId
      });
      if (typeof experimental_output.parse === "function") {
        schema = experimental_output;
        if (schema instanceof ZodArray) {
          schema = schema._def.type;
        }
      } else {
        schema = jsonSchema(experimental_output);
      }
    }
    try {
      return await streamText({
        messages,
        ...argsForExecute,
        experimental_telemetry: {
          ...this.experimental_telemetry,
          ...telemetry
        },
        experimental_output: schema ? output_exports.object({
          schema
        }) : void 0
      });
    } catch (e) {
      const mastraError = new MastraError(
        {
          id: "LLM_STREAM_TEXT_AI_SDK_EXECUTION_FAILED",
          domain: "LLM" /* LLM */,
          category: "THIRD_PARTY" /* THIRD_PARTY */,
          details: {
            modelId: model.modelId,
            modelProvider: model.provider,
            runId: runId ?? "unknown",
            threadId: threadId ?? "unknown",
            resourceId: resourceId ?? "unknown"
          }
        },
        e
      );
      this.logger.trackException(mastraError);
      throw mastraError;
    }
  }
  async __streamObject({
    messages,
    runId,
    tools = {},
    maxSteps = 5,
    toolChoice = "auto",
    runtimeContext,
    threadId,
    resourceId,
    memory,
    temperature,
    onStepFinish,
    onFinish,
    structuredOutput,
    telemetry,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Streaming structured output`, {
      runId,
      messages,
      maxSteps,
      tools: Object.keys(tools || {})
    });
    const finalTools = tools;
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...finalTools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        try {
          await onStepFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_STREAM_OBJECT_ON_STEP_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                modelId: model.modelId,
                modelProvider: model.provider,
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                usage: props?.usage ? JSON.stringify(props.usage) : "",
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                finishReason: props?.finishReason
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Stream Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      onFinish: async (props) => {
        try {
          await onFinish?.(props);
        } catch (e) {
          const mastraError = new MastraError(
            {
              id: "LLM_STREAM_OBJECT_ON_FINISH_CALLBACK_EXECUTION_FAILED",
              domain: "LLM" /* LLM */,
              category: "USER" /* USER */,
              details: {
                modelId: model.modelId,
                modelProvider: model.provider,
                runId: runId ?? "unknown",
                threadId: threadId ?? "unknown",
                resourceId: resourceId ?? "unknown",
                toolCalls: props?.toolCalls ? JSON.stringify(props.toolCalls) : "",
                toolResults: props?.toolResults ? JSON.stringify(props.toolResults) : "",
                finishReason: props?.finishReason,
                usage: props?.usage ? JSON.stringify(props.usage) : ""
              }
            },
            e
          );
          this.logger.trackException(mastraError);
          throw mastraError;
        }
        this.logger.debug("[LLM] - Stream Finished:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
      },
      ...rest
    };
    let output = "object";
    if (structuredOutput instanceof ZodArray) {
      output = "array";
      structuredOutput = structuredOutput._def.type;
    }
    try {
      const processedSchema = this._applySchemaCompat(structuredOutput);
      return streamObject({
        messages,
        ...argsForExecute,
        output,
        schema: processedSchema,
        experimental_telemetry: {
          ...this.experimental_telemetry,
          ...telemetry
        }
      });
    } catch (e) {
      const mastraError = new MastraError(
        {
          id: "LLM_STREAM_OBJECT_AI_SDK_EXECUTION_FAILED",
          domain: "LLM" /* LLM */,
          category: "THIRD_PARTY" /* THIRD_PARTY */,
          details: {
            modelId: model.modelId,
            modelProvider: model.provider,
            runId: runId ?? "unknown",
            threadId: threadId ?? "unknown",
            resourceId: resourceId ?? "unknown"
          }
        },
        e
      );
      this.logger.trackException(mastraError);
      throw mastraError;
    }
  }
  async generate(messages, { maxSteps = 5, output, ...rest }) {
    const msgs = this.convertToMessages(messages);
    if (!output) {
      return await this.__text({
        messages: msgs,
        maxSteps,
        ...rest
      });
    }
    return await this.__textObject({
      messages: msgs,
      structuredOutput: output,
      maxSteps,
      ...rest
    });
  }
  async stream(messages, { maxSteps = 5, output, ...rest }) {
    const msgs = this.convertToMessages(messages);
    if (!output) {
      return await this.__stream({
        messages: msgs,
        maxSteps,
        ...rest
      });
    }
    return await this.__streamObject({
      messages: msgs,
      structuredOutput: output,
      maxSteps,
      ...rest
    });
  }
};

// ../../node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "../../node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js"(exports, module) {

    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0;) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// src/workflows/legacy/step.ts
var LegacyStep = class {
  id;
  description;
  inputSchema;
  outputSchema;
  payload;
  execute;
  retryConfig;
  mastra;
  constructor({
    id,
    description,
    execute,
    payload,
    outputSchema,
    inputSchema,
    retryConfig
  }) {
    this.id = id;
    this.description = description ?? "";
    this.inputSchema = inputSchema;
    this.payload = payload;
    this.outputSchema = outputSchema;
    this.execute = execute;
    this.retryConfig = retryConfig;
  }
};

// src/agent/index.ts
var import_fast_deep_equal = __toESM(require_fast_deep_equal());
function resolveMaybePromise(value, cb) {
  if (value instanceof Promise) {
    return value.then(cb);
  }
  return cb(value);
}
function resolveThreadIdFromArgs(args) {
  if (args?.memory?.thread) {
    if (typeof args.memory.thread === "string") return {
      id: args.memory.thread
    };
    if (typeof args.memory.thread === "object" && args.memory.thread.id) return args.memory.thread;
  }
  if (args?.threadId) return {
    id: args.threadId
  };
  return void 0;
}
var _Agent_decorators, _init, _a;
_Agent_decorators = [InstrumentClass({
  prefix: "agent",
  excludeMethods: ["hasOwnMemory", "getMemory", "__primitive", "__registerMastra", "__registerPrimitives", "__setTools", "__setLogger", "__setTelemetry", "log", "getModel", "getInstructions", "getTools", "getLLM", "getWorkflows", "getDefaultGenerateOptions", "getDefaultStreamOptions", "getDescription"]
})];
var Agent = class extends (_a = MastraBase) {
  id;
  name;
  #instructions;
  #description;
  model;
  #mastra;
  #memory;
  #workflows;
  #defaultGenerateOptions;
  #defaultStreamOptions;
  #tools;
  /** @deprecated This property is deprecated. Use evals instead. */
  metrics;
  evals;
  #voice;
  constructor(config) {
    super({
      component: RegisteredLogger.AGENT
    });
    this.name = config.name;
    this.id = config.name;
    this.#instructions = config.instructions;
    this.#description = config.description;
    if (!config.model) {
      const mastraError = new MastraError({
        id: "AGENT_CONSTRUCTOR_MODEL_REQUIRED",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: config.name
        },
        text: `LanguageModel is required to create an Agent. Please provide the 'model'.`
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    this.model = config.model;
    if (config.workflows) {
      this.#workflows = config.workflows;
    }
    this.#defaultGenerateOptions = config.defaultGenerateOptions || {};
    this.#defaultStreamOptions = config.defaultStreamOptions || {};
    this.#tools = config.tools || {};
    this.metrics = {};
    this.evals = {};
    if (config.mastra) {
      this.__registerMastra(config.mastra);
      this.__registerPrimitives({
        telemetry: config.mastra.getTelemetry(),
        logger: config.mastra.getLogger()
      });
    }
    if (config.metrics) {
      this.logger.warn("The metrics property is deprecated. Please use evals instead to add evaluation metrics.");
      this.metrics = config.metrics;
      this.evals = config.metrics;
    }
    if (config.evals) {
      this.evals = config.evals;
    }
    if (config.memory) {
      this.#memory = config.memory;
    }
    if (config.voice) {
      this.#voice = config.voice;
      if (typeof config.tools !== "function") {
        this.#voice?.addTools(this.tools);
      }
      if (typeof config.instructions === "string") {
        this.#voice?.addInstructions(config.instructions);
      }
    } else {
      this.#voice = new DefaultVoice();
    }
  }
  hasOwnMemory() {
    return Boolean(this.#memory);
  }
  getMemory() {
    const memory = this.#memory;
    if (memory && !memory.hasOwnStorage && this.#mastra) {
      const storage = this.#mastra.getStorage();
      if (storage) {
        memory.setStorage(storage);
      }
    }
    return memory;
  }
  get voice() {
    if (typeof this.#instructions === "function") {
      const mastraError = new MastraError({
        id: "AGENT_VOICE_INCOMPATIBLE_WITH_FUNCTION_INSTRUCTIONS",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "Voice is not compatible when instructions are a function. Please use getVoice() instead."
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    return this.#voice;
  }
  async getWorkflows({
    runtimeContext = new RuntimeContext()
  } = {}) {
    let workflowRecord;
    if (typeof this.#workflows === "function") {
      workflowRecord = await Promise.resolve(this.#workflows({
        runtimeContext
      }));
    } else {
      workflowRecord = this.#workflows ?? {};
    }
    Object.entries(workflowRecord || {}).forEach(([_workflowName, workflow]) => {
      if (this.#mastra) {
        workflow.__registerMastra(this.#mastra);
      }
    });
    return workflowRecord;
  }
  async getVoice({
    runtimeContext
  } = {}) {
    if (this.#voice) {
      const voice = this.#voice;
      voice?.addTools(await this.getTools({
        runtimeContext
      }));
      voice?.addInstructions(await this.getInstructions({
        runtimeContext
      }));
      return voice;
    } else {
      return new DefaultVoice();
    }
  }
  get instructions() {
    this.logger.warn("The instructions property is deprecated. Please use getInstructions() instead.");
    if (typeof this.#instructions === "function") {
      const mastraError = new MastraError({
        id: "AGENT_INSTRUCTIONS_INCOMPATIBLE_WITH_FUNCTION_INSTRUCTIONS",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "Instructions are not compatible when instructions are a function. Please use getInstructions() instead."
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    return this.#instructions;
  }
  getInstructions({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#instructions === "string") {
      return this.#instructions;
    }
    const result = this.#instructions({
      runtimeContext
    });
    return resolveMaybePromise(result, instructions => {
      if (!instructions) {
        const mastraError = new MastraError({
          id: "AGENT_GET_INSTRUCTIONS_FUNCTION_EMPTY_RETURN",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: "Instructions are required to use an Agent. The function-based instructions returned an empty value."
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return instructions;
    });
  }
  getDescription() {
    return this.#description ?? "";
  }
  getDefaultGenerateOptions({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#defaultGenerateOptions !== "function") {
      return this.#defaultGenerateOptions;
    }
    const result = this.#defaultGenerateOptions({
      runtimeContext
    });
    return resolveMaybePromise(result, options => {
      if (!options) {
        const mastraError = new MastraError({
          id: "AGENT_GET_DEFAULT_GENERATE_OPTIONS_FUNCTION_EMPTY_RETURN",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: `[Agent:${this.name}] - Function-based default generate options returned empty value`
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return options;
    });
  }
  getDefaultStreamOptions({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#defaultStreamOptions !== "function") {
      return this.#defaultStreamOptions;
    }
    const result = this.#defaultStreamOptions({
      runtimeContext
    });
    return resolveMaybePromise(result, options => {
      if (!options) {
        const mastraError = new MastraError({
          id: "AGENT_GET_DEFAULT_STREAM_OPTIONS_FUNCTION_EMPTY_RETURN",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: `[Agent:${this.name}] - Function-based default stream options returned empty value`
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return options;
    });
  }
  get tools() {
    this.logger.warn("The tools property is deprecated. Please use getTools() instead.");
    if (typeof this.#tools === "function") {
      const mastraError = new MastraError({
        id: "AGENT_GET_TOOLS_FUNCTION_INCOMPATIBLE_WITH_TOOL_FUNCTION_TYPE",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "Tools are not compatible when tools are a function. Please use getTools() instead."
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    return ensureToolProperties(this.#tools);
  }
  getTools({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#tools !== "function") {
      return ensureToolProperties(this.#tools);
    }
    const result = this.#tools({
      runtimeContext
    });
    return resolveMaybePromise(result, tools => {
      if (!tools) {
        const mastraError = new MastraError({
          id: "AGENT_GET_TOOLS_FUNCTION_EMPTY_RETURN",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: `[Agent:${this.name}] - Function-based tools returned empty value`
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return ensureToolProperties(tools);
    });
  }
  get llm() {
    this.logger.warn("The llm property is deprecated. Please use getLLM() instead.");
    if (typeof this.model === "function") {
      const mastraError = new MastraError({
        id: "AGENT_LLM_GETTER_INCOMPATIBLE_WITH_FUNCTION_MODEL",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "LLM is not compatible when model is a function. Please use getLLM() instead."
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    return this.getLLM();
  }
  /**
   * Gets or creates an LLM instance based on the current model
   * @param options Options for getting the LLM
   * @returns A promise that resolves to the LLM instance
   */
  getLLM({
    runtimeContext = new RuntimeContext(),
    model
  } = {}) {
    const modelToUse = model ? typeof model === "function" ? model({
      runtimeContext
    }) : model : this.getModel({
      runtimeContext
    });
    return resolveMaybePromise(modelToUse, resolvedModel => {
      const llm = new MastraLLM({
        model: resolvedModel,
        mastra: this.#mastra
      });
      if (this.#primitives) {
        llm.__registerPrimitives(this.#primitives);
      }
      if (this.#mastra) {
        llm.__registerMastra(this.#mastra);
      }
      return llm;
    });
  }
  /**
   * Gets the model, resolving it if it's a function
   * @param options Options for getting the model
   * @returns A promise that resolves to the model
   */
  getModel({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.model !== "function") {
      if (!this.model) {
        const mastraError = new MastraError({
          id: "AGENT_GET_MODEL_MISSING_MODEL_INSTANCE",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: `[Agent:${this.name}] - No model provided`
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return this.model;
    }
    const result = this.model({
      runtimeContext
    });
    return resolveMaybePromise(result, model => {
      if (!model) {
        const mastraError = new MastraError({
          id: "AGENT_GET_MODEL_FUNCTION_EMPTY_RETURN",
          domain: "AGENT" /* AGENT */,
          category: "USER" /* USER */,
          details: {
            agentName: this.name
          },
          text: `[Agent:${this.name}] - Function-based model returned empty value`
        });
        this.logger.trackException(mastraError);
        this.logger.error(mastraError.toString());
        throw mastraError;
      }
      return model;
    });
  }
  __updateInstructions(newInstructions) {
    this.#instructions = newInstructions;
    this.logger.debug(`[Agents:${this.name}] Instructions updated.`, {
      model: this.model,
      name: this.name
    });
  }
  #primitives;
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
    this.#primitives = p;
    this.logger.debug(`[Agents:${this.name}] initialized.`, {
      model: this.model,
      name: this.name
    });
  }
  __registerMastra(mastra) {
    this.#mastra = mastra;
  }
  /**
   * Set the concrete tools for the agent
   * @param tools
   */
  __setTools(tools) {
    this.#tools = tools;
    this.logger.debug(`[Agents:${this.name}] Tools set for agent ${this.name}`, {
      model: this.model,
      name: this.name
    });
  }
  async generateTitleFromUserMessage({
    message,
    runtimeContext = new RuntimeContext(),
    model
  }) {
    const llm = await this.getLLM({
      runtimeContext,
      model
    });
    const normMessage = new MessageList().add(message, "user").get.all.ui().at(-1);
    if (!normMessage) {
      throw new Error(`Could not generate title from input ${JSON.stringify(message)}`);
    }
    const partsToGen = [];
    for (const part of normMessage.parts) {
      if (part.type === `text`) {
        partsToGen.push(part);
      } else if (part.type === `source`) {
        partsToGen.push({
          type: "text",
          text: `User added URL: ${part.source.url.substring(0, 100)}`
        });
      } else if (part.type === `file`) {
        partsToGen.push({
          type: "text",
          text: `User added ${part.mimeType} file: ${part.data.substring(0, 100)}`
        });
      }
    }
    const {
      text
    } = await llm.__text({
      runtimeContext,
      messages: [{
        role: "system",
        content: `

    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
    - the entire text you return will be used as the title`
      }, {
        role: "user",
        content: JSON.stringify(partsToGen)
      }]
    });
    const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return cleanedText;
  }
  getMostRecentUserMessage(messages) {
    const userMessages = messages.filter(message => message.role === "user");
    return userMessages.at(-1);
  }
  async genTitle(userMessage, runtimeContext, model) {
    try {
      if (userMessage) {
        const normMessage = new MessageList().add(userMessage, "user").get.all.ui().at(-1);
        if (normMessage) {
          return await this.generateTitleFromUserMessage({
            message: normMessage,
            runtimeContext,
            model
          });
        }
      }
      return `New Thread ${(/* @__PURE__ */new Date()).toISOString()}`;
    } catch (e) {
      this.logger.error("Error generating title:", e);
      return void 0;
    }
  }
  /* @deprecated use agent.getMemory() and query memory directly */
  async fetchMemory({
    threadId,
    thread: passedThread,
    memoryConfig,
    resourceId,
    runId,
    userMessages,
    systemMessage,
    messageList = new MessageList({
      threadId,
      resourceId
    })
  }) {
    const memory = this.getMemory();
    if (memory) {
      const thread = passedThread ?? (await memory.getThreadById({
        threadId
      }));
      if (!thread) {
        return {
          threadId: threadId || "",
          messages: userMessages || []
        };
      }
      if (userMessages && userMessages.length > 0) {
        messageList.add(userMessages, "memory");
      }
      if (systemMessage?.role === "system") {
        messageList.addSystem(systemMessage, "memory");
      }
      const [memoryMessages, memorySystemMessage] = threadId && memory ? await Promise.all([memory.rememberMessages({
        threadId,
        resourceId,
        config: memoryConfig,
        vectorMessageSearch: messageList.getLatestUserContent() || ""
      }).then(r => r.messagesV2), memory.getSystemMessage({
        threadId,
        memoryConfig
      })]) : [[], null];
      this.logger.debug("Fetched messages from memory", {
        threadId,
        runId,
        fetchedCount: memoryMessages.length
      });
      if (memorySystemMessage) {
        messageList.addSystem(memorySystemMessage, "memory");
      }
      messageList.add(memoryMessages, "memory");
      const systemMessages = messageList.getSystemMessages()?.map(m => m.content)?.join(`
`) ?? void 0;
      const newMessages = messageList.get.input.v1();
      const processedMemoryMessages = memory.processMessages({
        // these will be processed
        messages: messageList.get.remembered.v1(),
        // these are here for inspecting but shouldn't be returned by the processor
        // - ex TokenLimiter needs to measure all tokens even though it's only processing remembered messages
        newMessages,
        systemMessage: systemMessages,
        memorySystemMessage: memorySystemMessage || void 0
      });
      const returnList = new MessageList().addSystem(systemMessages).add(processedMemoryMessages, "memory").add(newMessages, "user");
      return {
        threadId: thread.id,
        messages: returnList.get.all.prompt()
      };
    }
    return {
      threadId: threadId || "",
      messages: userMessages || []
    };
  }
  async getMemoryTools({
    runId,
    resourceId,
    threadId,
    runtimeContext,
    mastraProxy
  }) {
    let convertedMemoryTools = {};
    const memory = this.getMemory();
    const memoryTools = memory?.getTools?.();
    if (memoryTools) {
      const memoryToolEntries = await Promise.all(Object.entries(memoryTools).map(async ([k, tool]) => {
        return [k, {
          description: tool.description,
          parameters: tool.parameters,
          execute: typeof tool?.execute === "function" ? async (args, options) => {
            try {
              this.logger.debug(`[Agent:${this.name}] - Executing memory tool ${k}`, {
                name: k,
                description: tool.description,
                args,
                runId,
                threadId,
                resourceId
              });
              return tool?.execute?.({
                context: args,
                mastra: mastraProxy,
                memory,
                runId,
                threadId,
                resourceId,
                logger: this.logger,
                agentName: this.name,
                runtimeContext
              }, options) ?? void 0;
            } catch (err) {
              const mastraError = new MastraError({
                id: "AGENT_MEMORY_TOOL_EXECUTION_FAILED",
                domain: "AGENT" /* AGENT */,
                category: "USER" /* USER */,
                details: {
                  agentName: this.name,
                  runId: runId || "",
                  threadId: threadId || "",
                  resourceId: resourceId || ""
                },
                text: `[Agent:${this.name}] - Failed memory tool execution`
              }, err);
              this.logger.trackException(mastraError);
              this.logger.error(mastraError.toString());
              throw mastraError;
            }
          } : void 0
        }];
      }));
      convertedMemoryTools = Object.fromEntries(memoryToolEntries.filter(entry => Boolean(entry)));
    }
    return convertedMemoryTools;
  }
  async getAssignedTools({
    runtimeContext,
    runId,
    resourceId,
    threadId,
    mastraProxy
  }) {
    let toolsForRequest = {};
    this.logger.debug(`[Agents:${this.name}] - Assembling assigned tools`, {
      runId,
      threadId,
      resourceId
    });
    const memory = this.getMemory();
    const assignedTools = await this.getTools({
      runtimeContext
    });
    const assignedToolEntries = Object.entries(assignedTools || {});
    const assignedCoreToolEntries = await Promise.all(assignedToolEntries.map(async ([k, tool]) => {
      if (!tool) {
        return;
      }
      const options = {
        name: k,
        runId,
        threadId,
        resourceId,
        logger: this.logger,
        mastra: mastraProxy,
        memory,
        agentName: this.name,
        runtimeContext,
        model: typeof this.model === "function" ? await this.getModel({
          runtimeContext
        }) : this.model
      };
      return [k, makeCoreTool(tool, options)];
    }));
    const assignedToolEntriesConverted = Object.fromEntries(assignedCoreToolEntries.filter(entry => Boolean(entry)));
    toolsForRequest = {
      ...assignedToolEntriesConverted
    };
    return toolsForRequest;
  }
  async getToolsets({
    runId,
    threadId,
    resourceId,
    toolsets,
    runtimeContext,
    mastraProxy
  }) {
    let toolsForRequest = {};
    const memory = this.getMemory();
    const toolsFromToolsets = Object.values(toolsets || {});
    if (toolsFromToolsets.length > 0) {
      this.logger.debug(`[Agent:${this.name}] - Adding tools from toolsets ${Object.keys(toolsets || {}).join(", ")}`, {
        runId
      });
      for (const toolset of toolsFromToolsets) {
        for (const [toolName, tool] of Object.entries(toolset)) {
          const toolObj = tool;
          const options = {
            name: toolName,
            runId,
            threadId,
            resourceId,
            logger: this.logger,
            mastra: mastraProxy,
            memory,
            agentName: this.name,
            runtimeContext,
            model: typeof this.model === "function" ? await this.getModel({
              runtimeContext
            }) : this.model
          };
          const convertedToCoreTool = makeCoreTool(toolObj, options, "toolset");
          toolsForRequest[toolName] = convertedToCoreTool;
        }
      }
    }
    return toolsForRequest;
  }
  async getClientTools({
    runId,
    threadId,
    resourceId,
    runtimeContext,
    mastraProxy,
    clientTools
  }) {
    let toolsForRequest = {};
    const memory = this.getMemory();
    const clientToolsForInput = Object.entries(clientTools || {});
    if (clientToolsForInput.length > 0) {
      this.logger.debug(`[Agent:${this.name}] - Adding client tools ${Object.keys(clientTools || {}).join(", ")}`, {
        runId
      });
      for (const [toolName, tool] of clientToolsForInput) {
        const {
          execute,
          ...rest
        } = tool;
        const options = {
          name: toolName,
          runId,
          threadId,
          resourceId,
          logger: this.logger,
          mastra: mastraProxy,
          memory,
          agentName: this.name,
          runtimeContext,
          model: typeof this.model === "function" ? await this.getModel({
            runtimeContext
          }) : this.model
        };
        const convertedToCoreTool = makeCoreTool(rest, options, "client-tool");
        toolsForRequest[toolName] = convertedToCoreTool;
      }
    }
    return toolsForRequest;
  }
  async getWorkflowTools({
    runId,
    threadId,
    resourceId,
    runtimeContext
  }) {
    let convertedWorkflowTools = {};
    const workflows = await this.getWorkflows({
      runtimeContext
    });
    if (Object.keys(workflows).length > 0) {
      convertedWorkflowTools = Object.entries(workflows).reduce((memo, [workflowName, workflow]) => {
        memo[workflowName] = {
          description: workflow.description || `Workflow: ${workflowName}`,
          parameters: workflow.inputSchema || {
            type: "object",
            properties: {}
          },
          execute: async args => {
            try {
              this.logger.debug(`[Agent:${this.name}] - Executing workflow as tool ${workflowName}`, {
                name: workflowName,
                description: workflow.description,
                args,
                runId,
                threadId,
                resourceId
              });
              const run = workflow.createRun();
              const result = await run.start({
                inputData: args,
                runtimeContext
              });
              return result;
            } catch (err) {
              const mastraError = new MastraError({
                id: "AGENT_WORKFLOW_TOOL_EXECUTION_FAILED",
                domain: "AGENT" /* AGENT */,
                category: "USER" /* USER */,
                details: {
                  agentName: this.name,
                  runId: runId || "",
                  threadId: threadId || "",
                  resourceId: resourceId || ""
                },
                text: `[Agent:${this.name}] - Failed workflow tool execution`
              }, err);
              this.logger.trackException(mastraError);
              this.logger.error(mastraError.toString());
              throw mastraError;
            }
          }
        };
        return memo;
      }, {});
    }
    return convertedWorkflowTools;
  }
  async convertTools({
    toolsets,
    clientTools,
    threadId,
    resourceId,
    runId,
    runtimeContext
  }) {
    let mastraProxy = void 0;
    const logger = this.logger;
    if (this.#mastra) {
      mastraProxy = createMastraProxy({
        mastra: this.#mastra,
        logger
      });
    }
    const assignedTools = await this.getAssignedTools({
      runId,
      resourceId,
      threadId,
      runtimeContext,
      mastraProxy
    });
    const memoryTools = await this.getMemoryTools({
      runId,
      resourceId,
      threadId,
      runtimeContext,
      mastraProxy
    });
    const toolsetTools = await this.getToolsets({
      runId,
      resourceId,
      threadId,
      runtimeContext,
      mastraProxy,
      toolsets
    });
    const clientsideTools = await this.getClientTools({
      runId,
      resourceId,
      threadId,
      runtimeContext,
      mastraProxy,
      clientTools
    });
    const workflowTools = await this.getWorkflowTools({
      runId,
      resourceId,
      threadId,
      runtimeContext
    });
    return {
      ...assignedTools,
      ...memoryTools,
      ...toolsetTools,
      ...clientsideTools,
      ...workflowTools
    };
  }
  __primitive({
    instructions,
    messages,
    context,
    thread,
    memoryConfig,
    resourceId,
    runId,
    toolsets,
    clientTools,
    runtimeContext,
    generateMessageId
  }) {
    return {
      before: async () => {
        if (process.env.NODE_ENV !== "test") {
          this.logger.debug(`[Agents:${this.name}] - Starting generation`, {
            runId
          });
        }
        const memory = this.getMemory();
        const toolEnhancements = [
        // toolsets
        toolsets && Object.keys(toolsets || {}).length > 0 ? `toolsets present (${Object.keys(toolsets || {}).length} tools)` : void 0,
        // memory tools
        memory && resourceId ? "memory and resourceId available" : void 0].filter(Boolean).join(", ");
        this.logger.debug(`[Agent:${this.name}] - Enhancing tools: ${toolEnhancements}`, {
          runId,
          toolsets: toolsets ? Object.keys(toolsets) : void 0,
          clientTools: clientTools ? Object.keys(clientTools) : void 0,
          hasMemory: !!this.getMemory(),
          hasResourceId: !!resourceId
        });
        const threadId = thread?.id;
        const convertedTools = await this.convertTools({
          toolsets,
          clientTools,
          threadId,
          resourceId,
          runId,
          runtimeContext
        });
        const messageList = new MessageList({
          threadId,
          resourceId,
          generateMessageId
        }).addSystem({
          role: "system",
          content: instructions || `${this.instructions}.`
        }).add(context || [], "context");
        if (!memory || !threadId && !resourceId) {
          messageList.add(messages, "user");
          return {
            messageObjects: messageList.get.all.prompt(),
            convertedTools,
            messageList
          };
        }
        if (!threadId || !resourceId) {
          const mastraError = new MastraError({
            id: "AGENT_MEMORY_MISSING_RESOURCE_ID",
            domain: "AGENT" /* AGENT */,
            category: "USER" /* USER */,
            details: {
              agentName: this.name,
              threadId: threadId || "",
              resourceId: resourceId || ""
            },
            text: `A resourceId must be provided when passing a threadId and using Memory. Saw threadId ${threadId} but resourceId is ${resourceId}`
          });
          this.logger.trackException(mastraError);
          this.logger.error(mastraError.toString());
          throw mastraError;
        }
        const store = memory.constructor.name;
        this.logger.debug(`[Agent:${this.name}] - Memory persistence enabled: store=${store}, resourceId=${resourceId}`, {
          runId,
          resourceId,
          threadId,
          memoryStore: store
        });
        let threadObject = void 0;
        const existingThread = await memory.getThreadById({
          threadId
        });
        if (existingThread) {
          if (!existingThread.metadata && thread.metadata || thread.metadata && !(0, import_fast_deep_equal.default)(existingThread.metadata, thread.metadata)) {
            threadObject = await memory.saveThread({
              thread: {
                ...existingThread,
                metadata: thread.metadata
              },
              memoryConfig
            });
          } else {
            threadObject = existingThread;
          }
        } else {
          threadObject = await memory.createThread({
            threadId,
            metadata: thread.metadata,
            title: thread.title,
            memoryConfig,
            resourceId
          });
        }
        let [memoryMessages, memorySystemMessage] = thread.id && memory ? await Promise.all([memory.rememberMessages({
          threadId: threadObject.id,
          resourceId,
          config: memoryConfig,
          // The new user messages aren't in the list yet cause we add memory messages first to try to make sure ordering is correct (memory comes before new user messages)
          vectorMessageSearch: new MessageList().add(messages, `user`).getLatestUserContent() || ""
        }).then(r => r.messagesV2), memory.getSystemMessage({
          threadId: threadObject.id,
          memoryConfig
        })]) : [[], null, null];
        this.logger.debug("Fetched messages from memory", {
          threadId: threadObject.id,
          runId,
          fetchedCount: memoryMessages.length
        });
        const resultsFromOtherThreads = memoryMessages.filter(m => m.threadId !== threadObject.id);
        if (resultsFromOtherThreads.length && !memorySystemMessage) {
          memorySystemMessage = ``;
        }
        if (resultsFromOtherThreads.length) {
          memorySystemMessage += `
The following messages were remembered from a different conversation:
<remembered_from_other_conversation>
${JSON.stringify(
          // get v1 since they're closer to CoreMessages (which get sent to the LLM) but also include timestamps
          new MessageList().add(resultsFromOtherThreads, "memory").get.all.v1())}
<end_remembered_from_other_conversation>`;
        }
        if (memorySystemMessage) {
          messageList.addSystem(memorySystemMessage, "memory");
        }
        messageList.add(memoryMessages.filter(m => m.threadId === threadObject.id),
        // filter out messages from other threads. those are added to system message above
        "memory").add(messages, "user");
        const systemMessage = [...messageList.getSystemMessages(), ...messageList.getSystemMessages("memory")]?.map(m => m.content)?.join(`
`) ?? void 0;
        const processedMemoryMessages = memory.processMessages({
          // these will be processed
          messages: messageList.get.remembered.v1(),
          // these are here for inspecting but shouldn't be returned by the processor
          // - ex TokenLimiter needs to measure all tokens even though it's only processing remembered messages
          newMessages: messageList.get.input.v1(),
          systemMessage,
          memorySystemMessage: memorySystemMessage || void 0
        });
        const processedList = new MessageList({
          threadId: threadObject.id,
          resourceId
        }).addSystem(instructions || `${this.instructions}.`).addSystem(memorySystemMessage).add(context || [], "context").add(processedMemoryMessages, "memory").add(messageList.get.input.v2(), "user").get.all.prompt();
        return {
          convertedTools,
          thread: threadObject,
          messageList,
          // add old processed messages + new input messages
          messageObjects: processedList
        };
      },
      after: async ({
        result,
        thread: threadAfter,
        threadId,
        memoryConfig: memoryConfig2,
        outputText,
        runId: runId2,
        messageList
      }) => {
        const resToLog = {
          text: result?.text,
          object: result?.object,
          toolResults: result?.toolResults,
          toolCalls: result?.toolCalls,
          usage: result?.usage,
          steps: result?.steps?.map(s => {
            return {
              stepType: s?.stepType,
              text: result?.text,
              object: result?.object,
              toolResults: result?.toolResults,
              toolCalls: result?.toolCalls,
              usage: result?.usage
            };
          })
        };
        this.logger.debug(`[Agent:${this.name}] - Post processing LLM response`, {
          runId: runId2,
          result: resToLog,
          threadId
        });
        const memory = this.getMemory();
        const messageListResponses = new MessageList({
          threadId,
          resourceId
        }).add(result.response.messages, "response").get.all.core();
        const usedWorkingMemory = messageListResponses?.some(m => m.role === "tool" && m?.content?.some(c => c?.toolName === "updateWorkingMemory"));
        const thread2 = usedWorkingMemory ? threadId ? await memory?.getThreadById({
          threadId
        }) : void 0 : threadAfter;
        if (memory && resourceId && thread2) {
          try {
            let responseMessages = result.response.messages;
            if (!responseMessages && result.object) {
              responseMessages = [{
                role: "assistant",
                content: [{
                  type: "text",
                  text: outputText
                  // outputText contains the stringified object
                }]
              }];
            }
            if (responseMessages) {
              messageList.add(responseMessages, "response");
            }
            const promises = [memory.saveMessages({
              messages: messageList.drainUnsavedMessages(),
              memoryConfig: memoryConfig2
            })];
            if (thread2.title?.startsWith("New Thread")) {
              const config = memory.getMergedThreadConfig(memoryConfig2);
              const userMessage = this.getMostRecentUserMessage(messageList.get.all.ui());
              const {
                shouldGenerate,
                model: titleModel
              } = this.resolveTitleGenerationConfig(config?.threads?.generateTitle);
              if (shouldGenerate && userMessage) {
                promises.push(this.genTitle(userMessage, runtimeContext, titleModel).then(title => {
                  if (title) {
                    return memory.createThread({
                      threadId: thread2.id,
                      resourceId,
                      memoryConfig: memoryConfig2,
                      title,
                      metadata: thread2.metadata
                    });
                  }
                }));
              }
            }
            await Promise.all(promises);
          } catch (e) {
            if (e instanceof MastraError) {
              throw e;
            }
            const mastraError = new MastraError({
              id: "AGENT_MEMORY_PERSIST_RESPONSE_MESSAGES_FAILED",
              domain: "AGENT" /* AGENT */,
              category: "SYSTEM" /* SYSTEM */,
              details: {
                agentName: this.name,
                runId: runId2 || "",
                threadId: threadId || "",
                result: JSON.stringify(resToLog)
              }
            }, e);
            this.logger.trackException(mastraError);
            this.logger.error(mastraError.toString());
            throw mastraError;
          }
        }
        if (Object.keys(this.evals || {}).length > 0) {
          const userInputMessages = messageList.get.all.ui().filter(m => m.role === "user");
          const input = userInputMessages.map(message => typeof message.content === "string" ? message.content : "").join("\n");
          const runIdToUse = runId2 || crypto.randomUUID();
          for (const metric of Object.values(this.evals || {})) {
            executeHook("onGeneration" /* ON_GENERATION */, {
              input,
              output: outputText,
              runId: runIdToUse,
              metric,
              agentName: this.name,
              instructions: instructions || this.instructions
            });
          }
        }
      }
    };
  }
  async generate(messages, generateOptions = {}) {
    const defaultGenerateOptions = await this.getDefaultGenerateOptions({
      runtimeContext: generateOptions.runtimeContext
    });
    const {
      context,
      memoryOptions: memoryConfigFromArgs,
      resourceId: resourceIdFromArgs,
      maxSteps,
      onStepFinish,
      output,
      toolsets,
      clientTools,
      temperature,
      toolChoice = "auto",
      experimental_output,
      telemetry,
      runtimeContext = new RuntimeContext(),
      ...args
    } = Object.assign({}, defaultGenerateOptions, generateOptions);
    const generateMessageId = `experimental_generateMessageId` in args && typeof args.experimental_generateMessageId === `function` ? args.experimental_generateMessageId : void 0;
    const threadFromArgs = resolveThreadIdFromArgs({
      ...args,
      ...generateOptions
    });
    const resourceId = args.memory?.resource || resourceIdFromArgs;
    const memoryConfig = args.memory?.options || memoryConfigFromArgs;
    const runId = args.runId || randomUUID();
    const instructions = args.instructions || (await this.getInstructions({
      runtimeContext
    }));
    const llm = await this.getLLM({
      runtimeContext
    });
    const {
      before,
      after
    } = this.__primitive({
      messages,
      instructions,
      context,
      thread: threadFromArgs,
      memoryConfig,
      resourceId,
      runId,
      toolsets,
      clientTools,
      runtimeContext,
      generateMessageId
    });
    const {
      thread,
      messageObjects,
      convertedTools,
      messageList
    } = await before();
    const threadId = thread?.id;
    if (!output && experimental_output) {
      const result2 = await llm.__text({
        messages: messageObjects,
        tools: convertedTools,
        onStepFinish: result3 => {
          return onStepFinish?.({
            ...result3,
            runId
          });
        },
        maxSteps,
        runId,
        temperature,
        toolChoice: toolChoice || "auto",
        experimental_output,
        threadId,
        resourceId,
        memory: this.getMemory(),
        runtimeContext,
        telemetry,
        ...args
      });
      const outputText2 = result2.text;
      await after({
        result: result2,
        threadId,
        thread,
        memoryConfig,
        outputText: outputText2,
        runId,
        messageList
      });
      const newResult = result2;
      newResult.object = result2.experimental_output;
      return newResult;
    }
    if (!output) {
      const result2 = await llm.__text({
        messages: messageObjects,
        tools: convertedTools,
        onStepFinish: result3 => {
          return onStepFinish?.({
            ...result3,
            runId
          });
        },
        maxSteps,
        runId,
        temperature,
        toolChoice,
        telemetry,
        threadId,
        resourceId,
        memory: this.getMemory(),
        runtimeContext,
        ...args
      });
      const outputText2 = result2.text;
      await after({
        result: result2,
        thread,
        threadId,
        memoryConfig,
        outputText: outputText2,
        runId,
        messageList
      });
      return result2;
    }
    const result = await llm.__textObject({
      messages: messageObjects,
      tools: convertedTools,
      structuredOutput: output,
      onStepFinish: result2 => {
        return onStepFinish?.({
          ...result2,
          runId
        });
      },
      maxSteps,
      runId,
      temperature,
      toolChoice,
      telemetry,
      memory: this.getMemory(),
      runtimeContext,
      ...args
    });
    const outputText = JSON.stringify(result.object);
    await after({
      result,
      thread,
      threadId,
      memoryConfig,
      outputText,
      runId,
      messageList
    });
    return result;
  }
  async stream(messages, streamOptions = {}) {
    const defaultStreamOptions = await this.getDefaultStreamOptions({
      runtimeContext: streamOptions.runtimeContext
    });
    const {
      context,
      memoryOptions: memoryConfigFromArgs,
      resourceId: resourceIdFromArgs,
      maxSteps,
      onFinish,
      onStepFinish,
      toolsets,
      clientTools,
      output,
      temperature,
      toolChoice = "auto",
      experimental_output,
      telemetry,
      runtimeContext = new RuntimeContext(),
      ...args
    } = Object.assign({}, defaultStreamOptions, streamOptions);
    const generateMessageId = `experimental_generateMessageId` in args && typeof args.experimental_generateMessageId === `function` ? args.experimental_generateMessageId : void 0;
    const threadFromArgs = resolveThreadIdFromArgs({
      ...args,
      ...streamOptions
    });
    const resourceId = args.memory?.resource || resourceIdFromArgs;
    const memoryConfig = args.memory?.options || memoryConfigFromArgs;
    const runId = args.runId || randomUUID();
    const instructions = args.instructions || (await this.getInstructions({
      runtimeContext
    }));
    const llm = await this.getLLM({
      runtimeContext
    });
    const {
      before,
      after
    } = this.__primitive({
      instructions,
      messages,
      context,
      thread: threadFromArgs,
      memoryConfig,
      resourceId,
      runId,
      toolsets,
      clientTools,
      runtimeContext,
      generateMessageId
    });
    const {
      thread,
      messageObjects,
      convertedTools,
      messageList
    } = await before();
    const threadId = thread?.id;
    if (!output && experimental_output) {
      this.logger.debug(`Starting agent ${this.name} llm stream call`, {
        runId
      });
      const streamResult = await llm.__stream({
        messages: messageObjects,
        temperature,
        tools: convertedTools,
        onStepFinish: result => {
          return onStepFinish?.({
            ...result,
            runId
          });
        },
        onFinish: async result => {
          try {
            const outputText = result.text;
            await after({
              result,
              thread,
              threadId,
              memoryConfig,
              outputText,
              runId,
              messageList
            });
          } catch (e) {
            this.logger.error("Error saving memory on finish", {
              error: e,
              runId
            });
          }
          await onFinish?.({
            ...result,
            runId
          });
        },
        maxSteps,
        runId,
        toolChoice,
        experimental_output,
        telemetry,
        memory: this.getMemory(),
        runtimeContext,
        threadId: thread?.id,
        resourceId,
        ...args
      });
      const newStreamResult = streamResult;
      newStreamResult.partialObjectStream = streamResult.experimental_partialOutputStream;
      return newStreamResult;
    } else if (!output) {
      this.logger.debug(`Starting agent ${this.name} llm stream call`, {
        runId
      });
      return llm.__stream({
        messages: messageObjects,
        temperature,
        tools: convertedTools,
        onStepFinish: result => {
          return onStepFinish?.({
            ...result,
            runId
          });
        },
        onFinish: async result => {
          try {
            const outputText = result.text;
            await after({
              result,
              thread,
              threadId,
              memoryConfig,
              outputText,
              runId,
              messageList
            });
          } catch (e) {
            this.logger.error("Error saving memory on finish", {
              error: e,
              runId
            });
          }
          await onFinish?.({
            ...result,
            runId
          });
        },
        maxSteps,
        runId,
        toolChoice,
        telemetry,
        memory: this.getMemory(),
        runtimeContext,
        threadId: thread?.id,
        resourceId,
        ...args
      });
    }
    this.logger.debug(`Starting agent ${this.name} llm streamObject call`, {
      runId
    });
    return llm.__streamObject({
      messages: messageObjects,
      tools: convertedTools,
      temperature,
      structuredOutput: output,
      onStepFinish: result => {
        return onStepFinish?.({
          ...result,
          runId
        });
      },
      onFinish: async result => {
        try {
          const outputText = JSON.stringify(result.object);
          await after({
            result,
            thread,
            threadId,
            memoryConfig,
            outputText,
            runId,
            messageList
          });
        } catch (e) {
          this.logger.error("Error saving memory on finish", {
            error: e,
            runId
          });
        }
        await onFinish?.({
          ...result,
          runId
        });
      },
      runId,
      toolChoice,
      telemetry,
      memory: this.getMemory(),
      runtimeContext,
      threadId: thread?.id,
      resourceId,
      ...args
    });
  }
  /**
   * Convert text to speech using the configured voice provider
   * @param input Text or text stream to convert to speech
   * @param options Speech options including speaker and provider-specific options
   * @returns Audio stream
   * @deprecated Use agent.voice.speak() instead
   */
  async speak(input, options) {
    if (!this.voice) {
      const mastraError = new MastraError({
        id: "AGENT_SPEAK_METHOD_VOICE_NOT_CONFIGURED",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "No voice provider configured"
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    this.logger.warn("Warning: agent.speak() is deprecated. Please use agent.voice.speak() instead.");
    try {
      return this.voice.speak(input, options);
    } catch (e) {
      let err;
      if (e instanceof MastraError) {
        err = e;
      } else {
        err = new MastraError({
          id: "AGENT_SPEAK_METHOD_ERROR",
          domain: "AGENT" /* AGENT */,
          category: "UNKNOWN" /* UNKNOWN */,
          details: {
            agentName: this.name
          },
          text: "Error during agent speak"
        }, e);
      }
      this.logger.trackException(err);
      this.logger.error(err.toString());
      throw err;
    }
  }
  /**
   * Convert speech to text using the configured voice provider
   * @param audioStream Audio stream to transcribe
   * @param options Provider-specific transcription options
   * @returns Text or text stream
   * @deprecated Use agent.voice.listen() instead
   */
  async listen(audioStream, options) {
    if (!this.voice) {
      const mastraError = new MastraError({
        id: "AGENT_LISTEN_METHOD_VOICE_NOT_CONFIGURED",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "No voice provider configured"
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    this.logger.warn("Warning: agent.listen() is deprecated. Please use agent.voice.listen() instead");
    try {
      return this.voice.listen(audioStream, options);
    } catch (e) {
      let err;
      if (e instanceof MastraError) {
        err = e;
      } else {
        err = new MastraError({
          id: "AGENT_LISTEN_METHOD_ERROR",
          domain: "AGENT" /* AGENT */,
          category: "UNKNOWN" /* UNKNOWN */,
          details: {
            agentName: this.name
          },
          text: "Error during agent listen"
        }, e);
      }
      this.logger.trackException(err);
      this.logger.error(err.toString());
      throw err;
    }
  }
  /**
   * Get a list of available speakers from the configured voice provider
   * @throws {Error} If no voice provider is configured
   * @returns {Promise<Array<{voiceId: string}>>} List of available speakers
   * @deprecated Use agent.voice.getSpeakers() instead
   */
  async getSpeakers() {
    if (!this.voice) {
      const mastraError = new MastraError({
        id: "AGENT_SPEAKERS_METHOD_VOICE_NOT_CONFIGURED",
        domain: "AGENT" /* AGENT */,
        category: "USER" /* USER */,
        details: {
          agentName: this.name
        },
        text: "No voice provider configured"
      });
      this.logger.trackException(mastraError);
      this.logger.error(mastraError.toString());
      throw mastraError;
    }
    this.logger.warn("Warning: agent.getSpeakers() is deprecated. Please use agent.voice.getSpeakers() instead.");
    try {
      return await this.voice.getSpeakers();
    } catch (e) {
      let err;
      if (e instanceof MastraError) {
        err = e;
      } else {
        err = new MastraError({
          id: "AGENT_GET_SPEAKERS_METHOD_ERROR",
          domain: "AGENT" /* AGENT */,
          category: "UNKNOWN" /* UNKNOWN */,
          details: {
            agentName: this.name
          },
          text: "Error during agent getSpeakers"
        }, e);
      }
      this.logger.trackException(err);
      this.logger.error(err.toString());
      throw err;
    }
  }
  toStep() {
    const x = agentToStep(this);
    return new LegacyStep(x);
  }
  /**
   * Resolves the configuration for title generation.
   * @private
   */
  resolveTitleGenerationConfig(generateTitleConfig) {
    if (typeof generateTitleConfig === "boolean") {
      return {
        shouldGenerate: generateTitleConfig
      };
    }
    if (typeof generateTitleConfig === "object" && generateTitleConfig !== null) {
      return {
        shouldGenerate: true,
        model: generateTitleConfig.model
      };
    }
    return {
      shouldGenerate: false
    };
  }
};
Agent = /*@__PURE__*/(_ => {
  _init = __decoratorStart(_a);
  Agent = __decorateElement(_init, 0, "Agent", _Agent_decorators, Agent);
  __runInitializers(_init, 1, Agent);

  // src/workflows/legacy/utils.ts
  return Agent;
})();
function agentToStep(agent, {
  mastra
} = {}) {
  return {
    id: agent.name,
    inputSchema: objectType({
      prompt: stringType(),
      resourceId: stringType().optional(),
      threadId: stringType().optional()
    }),
    outputSchema: objectType({
      text: stringType()
    }),
    execute: async ({
      context,
      runId,
      mastra: mastraFromExecute
    }) => {
      const realMastra = mastraFromExecute ?? mastra;
      if (!realMastra) {
        throw new Error("Mastra instance not found");
      }
      agent.__registerMastra(realMastra);
      agent.__registerPrimitives({
        logger: realMastra.getLogger(),
        telemetry: realMastra.getTelemetry()
      });
      const result = await agent.generate(context.inputData.prompt, {
        runId,
        resourceId: context.inputData.resourceId,
        threadId: context.inputData.threadId
      });
      return {
        text: result.text
      };
    }
  };
}

export { Agent };
