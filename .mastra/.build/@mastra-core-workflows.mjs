import { Agent } from './@mastra-core-agent.mjs';
import { T as Tool } from './tools.mjs';
import { M as MastraError } from './chunk-6UNGH46J.mjs';
import { M as MastraBase } from './utils.mjs';
import { R as RegisteredLogger } from './chunk-5YDTZN2X.mjs';
import { RuntimeContext } from './@mastra-core-runtime-context.mjs';
import { h as context } from './core.mjs';
import { t as trace } from './trace-api.mjs';
import { randomUUID } from 'crypto';
import EventEmitter from 'events';
import { TransformStream } from 'stream/web';
import { o as objectType, s as stringType } from './types.mjs';

// src/workflows/constants.ts
var EMITTER_SYMBOL = Symbol("emitter");

// src/workflows/execution-engine.ts
var ExecutionEngine = class extends MastraBase {
  mastra;
  constructor({ mastra }) {
    super({ name: "ExecutionEngine", component: RegisteredLogger.WORKFLOW });
    this.mastra = mastra;
  }
  __registerMastra(mastra) {
    this.mastra = mastra;
  }
};
var DefaultExecutionEngine = class extends ExecutionEngine {
  /**
   * The runCounts map is used to keep track of the run count for each step.
   * The step id is used as the key and the run count is the value.
   */
  runCounts = /* @__PURE__ */ new Map();
  /**
   * Get or generate the run count for a step.
   * If the step id is not in the map, it will be added and the run count will be 0.
   * If the step id is in the map, it will return the run count.
   *
   * @param stepId - The id of the step.
   * @returns The run count for the step.
   */
  getOrGenerateRunCount(stepId) {
    if (this.runCounts.has(stepId)) {
      const currentRunCount = this.runCounts.get(stepId);
      const nextRunCount = currentRunCount + 1;
      this.runCounts.set(stepId, nextRunCount);
      return nextRunCount;
    }
    const runCount = 0;
    this.runCounts.set(stepId, runCount);
    return runCount;
  }
  async fmtReturnValue(executionSpan, emitter, stepResults, lastOutput, error) {
    const base = {
      status: lastOutput.status,
      steps: stepResults
    };
    if (lastOutput.status === "success") {
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          workflowState: {
            status: lastOutput.status,
            steps: stepResults,
            result: lastOutput.output
          }
        },
        eventTimestamp: Date.now()
      });
      base.result = lastOutput.output;
    } else if (lastOutput.status === "failed") {
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          workflowState: {
            status: lastOutput.status,
            steps: stepResults,
            result: null,
            error: lastOutput.error
          }
        },
        eventTimestamp: Date.now()
      });
      base.error = error instanceof Error ? error?.stack ?? error : lastOutput.error ?? (typeof error === "string" ? error : new Error("Unknown error: " + error)?.stack ?? new Error("Unknown error: " + error));
    } else if (lastOutput.status === "suspended") {
      const suspendedStepIds = Object.entries(stepResults).flatMap(([stepId, stepResult]) => {
        if (stepResult?.status === "suspended") {
          const nestedPath = stepResult?.suspendPayload?.__workflow_meta?.path;
          return nestedPath ? [[stepId, ...nestedPath]] : [[stepId]];
        }
        return [];
      });
      base.suspended = suspendedStepIds;
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          workflowState: {
            status: lastOutput.status,
            steps: stepResults,
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
    }
    executionSpan?.end();
    return base;
  }
  /**
   * Executes a workflow run with the provided execution graph and input
   * @param graph The execution graph to execute
   * @param input The input data for the workflow
   * @returns A promise that resolves to the workflow output
   */
  async execute(params) {
    const { workflowId, runId, graph, input, resume, retryConfig } = params;
    const { attempts = 0, delay = 0 } = retryConfig ?? {};
    const steps = graph.steps;
    if (steps.length === 0) {
      throw new MastraError({
        id: "WORKFLOW_EXECUTE_EMPTY_GRAPH",
        text: "Workflow must have at least one step",
        domain: "MASTRA_WORKFLOW" /* MASTRA_WORKFLOW */,
        category: "USER" /* USER */
      });
    }
    const executionSpan = this.mastra?.getTelemetry()?.tracer.startSpan(`workflow.${workflowId}.execute`, {
      attributes: { componentName: workflowId, runId }
    });
    let startIdx = 0;
    if (resume?.resumePath) {
      startIdx = resume.resumePath[0];
      resume.resumePath.shift();
    }
    const stepResults = resume?.stepResults || { input };
    let lastOutput;
    for (let i = startIdx; i < steps.length; i++) {
      const entry = steps[i];
      try {
        lastOutput = await this.executeEntry({
          workflowId,
          runId,
          entry,
          serializedStepGraph: params.serializedStepGraph,
          prevStep: steps[i - 1],
          stepResults,
          resume,
          executionContext: {
            workflowId,
            runId,
            executionPath: [i],
            suspendedPaths: {},
            retryConfig: { attempts, delay },
            executionSpan
          },
          abortController: params.abortController,
          emitter: params.emitter,
          runtimeContext: params.runtimeContext
        });
        if (lastOutput.result.status !== "success") {
          if (lastOutput.result.status === "bailed") {
            lastOutput.result.status = "success";
          }
          const result2 = await this.fmtReturnValue(
            executionSpan,
            params.emitter,
            stepResults,
            lastOutput.result
          );
          await this.persistStepUpdate({
            workflowId,
            runId,
            stepResults: lastOutput.stepResults,
            serializedStepGraph: params.serializedStepGraph,
            executionContext: lastOutput.executionContext,
            workflowStatus: result2.status,
            result: result2.result,
            error: result2.error
          });
          return result2;
        }
      } catch (e) {
        const error = e instanceof MastraError ? e : new MastraError(
          {
            id: "WORKFLOW_ENGINE_STEP_EXECUTION_FAILED",
            domain: "MASTRA_WORKFLOW" /* MASTRA_WORKFLOW */,
            category: "USER" /* USER */,
            details: { workflowId, runId }
          },
          e
        );
        this.logger?.trackException(error);
        this.logger?.error(`Error executing step: ${error?.stack}`);
        const result2 = await this.fmtReturnValue(
          executionSpan,
          params.emitter,
          stepResults,
          lastOutput.result,
          e
        );
        await this.persistStepUpdate({
          workflowId,
          runId,
          stepResults: lastOutput.stepResults,
          serializedStepGraph: params.serializedStepGraph,
          executionContext: lastOutput.executionContext,
          workflowStatus: result2.status,
          result: result2.result,
          error: result2.error
        });
        return result2;
      }
    }
    const result = await this.fmtReturnValue(executionSpan, params.emitter, stepResults, lastOutput.result);
    await this.persistStepUpdate({
      workflowId,
      runId,
      stepResults: lastOutput.stepResults,
      serializedStepGraph: params.serializedStepGraph,
      executionContext: lastOutput.executionContext,
      workflowStatus: result.status,
      result: result.result,
      error: result.error
    });
    return result;
  }
  getStepOutput(stepResults, step) {
    if (!step) {
      return stepResults.input;
    } else if (step.type === "step" || step.type === "waitForEvent") {
      return stepResults[step.step.id]?.output;
    } else if (step.type === "sleep" || step.type === "sleepUntil") {
      return stepResults[step.id]?.output;
    } else if (step.type === "parallel" || step.type === "conditional") {
      return step.steps.reduce(
        (acc, entry) => {
          if (entry.type === "step" || entry.type === "waitForEvent") {
            acc[entry.step.id] = stepResults[entry.step.id]?.output;
          } else if (entry.type === "parallel" || entry.type === "conditional") {
            const parallelResult = this.getStepOutput(stepResults, entry)?.output;
            acc = { ...acc, ...parallelResult };
          } else if (entry.type === "loop") {
            acc[entry.step.id] = stepResults[entry.step.id]?.output;
          } else if (entry.type === "foreach") {
            acc[entry.step.id] = stepResults[entry.step.id]?.output;
          } else if (entry.type === "sleep" || entry.type === "sleepUntil") {
            acc[entry.id] = stepResults[entry.id]?.output;
          }
          return acc;
        },
        {}
      );
    } else if (step.type === "loop") {
      return stepResults[step.step.id]?.output;
    } else if (step.type === "foreach") {
      return stepResults[step.step.id]?.output;
    }
  }
  async executeSleep({ duration }) {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }
  async executeWaitForEvent({
    event,
    emitter,
    timeout
  }) {
    return new Promise((resolve, reject) => {
      const cb = (eventData) => {
        resolve(eventData);
      };
      if (timeout) {
        setTimeout(() => {
          emitter.off(`user-event-${event}`, cb);
          reject(new Error("Timeout waiting for event"));
        }, timeout);
      }
      emitter.once(`user-event-${event}`, cb);
    });
  }
  async executeStep({
    workflowId,
    runId,
    step,
    stepResults,
    executionContext,
    resume,
    prevOutput,
    emitter,
    abortController,
    runtimeContext
  }) {
    const startTime = resume?.steps[0] === step.id ? void 0 : Date.now();
    const resumeTime = resume?.steps[0] === step.id ? Date.now() : void 0;
    const stepInfo = {
      ...stepResults[step.id],
      ...resume?.steps[0] === step.id ? { resumePayload: resume?.resumePayload } : { payload: prevOutput },
      ...startTime ? { startedAt: startTime } : {},
      ...resumeTime ? { resumedAt: resumeTime } : {}
    };
    await emitter.emit("watch", {
      type: "watch",
      payload: {
        currentStep: {
          id: step.id,
          status: "running",
          ...stepInfo
        },
        workflowState: {
          status: "running",
          steps: {
            ...stepResults,
            [step.id]: {
              status: "running",
              ...stepInfo
            }
          },
          result: null,
          error: null
        }
      },
      eventTimestamp: Date.now()
    });
    await emitter.emit("watch-v2", {
      type: "step-start",
      payload: {
        id: step.id,
        ...stepInfo,
        status: "running"
      }
    });
    const _runStep = (step2, spanName, attributes) => {
      return async (data) => {
        const telemetry = this.mastra?.getTelemetry();
        const span = executionContext.executionSpan;
        if (!telemetry || !span) {
          return step2.execute(data);
        }
        return context.with(trace.setSpan(context.active(), span), async () => {
          return telemetry.traceMethod(step2.execute.bind(step2), {
            spanName,
            attributes
          })(data);
        });
      };
    };
    const runStep = _runStep(step, `workflow.${workflowId}.step.${step.id}`, {
      componentName: workflowId,
      runId
    });
    let execResults;
    const retries = step.retries ?? executionContext.retryConfig.attempts ?? 0;
    for (let i = 0; i < retries + 1; i++) {
      try {
        let suspended;
        let bailed;
        const result = await runStep({
          runId,
          mastra: this.mastra,
          runtimeContext,
          inputData: prevOutput,
          runCount: this.getOrGenerateRunCount(step.id),
          resumeData: resume?.steps[0] === step.id ? resume?.resumePayload : void 0,
          getInitData: () => stepResults?.input,
          getStepResult: (step2) => {
            if (!step2?.id) {
              return null;
            }
            const result2 = stepResults[step2.id];
            if (result2?.status === "success") {
              return result2.output;
            }
            return null;
          },
          suspend: async (suspendPayload) => {
            executionContext.suspendedPaths[step.id] = executionContext.executionPath;
            suspended = { payload: suspendPayload };
          },
          bail: (result2) => {
            bailed = { payload: result2 };
          },
          abort: () => {
            abortController?.abort();
          },
          resume: {
            steps: resume?.steps?.slice(1) || [],
            resumePayload: resume?.resumePayload,
            // @ts-ignore
            runId: stepResults[step.id]?.suspendPayload?.__workflow_meta?.runId
          },
          [EMITTER_SYMBOL]: emitter,
          engine: {},
          abortSignal: abortController?.signal
        });
        if (suspended) {
          execResults = { status: "suspended", suspendPayload: suspended.payload, suspendedAt: Date.now() };
        } else if (bailed) {
          execResults = { status: "bailed", output: bailed.payload, endedAt: Date.now() };
        } else {
          execResults = { status: "success", output: result, endedAt: Date.now() };
        }
        break;
      } catch (e) {
        const error = e instanceof MastraError ? e : new MastraError(
          {
            id: "WORKFLOW_STEP_INVOKE_FAILED",
            domain: "MASTRA_WORKFLOW" /* MASTRA_WORKFLOW */,
            category: "USER" /* USER */,
            details: { workflowId, runId, stepId: step.id }
          },
          e
        );
        this.logger.trackException(error);
        this.logger.error("Error executing step: " + error?.stack);
        execResults = {
          status: "failed",
          error: error?.stack,
          endedAt: Date.now()
        };
      }
    }
    await emitter.emit("watch", {
      type: "watch",
      payload: {
        currentStep: {
          id: step.id,
          ...stepInfo,
          ...execResults
        },
        workflowState: {
          status: "running",
          steps: {
            ...stepResults,
            [step.id]: {
              ...stepInfo,
              ...execResults
            }
          },
          result: null,
          error: null
        }
      },
      eventTimestamp: Date.now()
    });
    if (execResults.status === "suspended") {
      await emitter.emit("watch-v2", {
        type: "step-suspended",
        payload: {
          id: step.id,
          ...execResults
        }
      });
    } else {
      await emitter.emit("watch-v2", {
        type: "step-result",
        payload: {
          id: step.id,
          ...execResults
        }
      });
      await emitter.emit("watch-v2", {
        type: "step-finish",
        payload: {
          id: step.id,
          metadata: {}
        }
      });
    }
    return { ...stepInfo, ...execResults };
  }
  async executeParallel({
    workflowId,
    runId,
    entry,
    prevStep,
    serializedStepGraph,
    stepResults,
    resume,
    executionContext,
    emitter,
    abortController,
    runtimeContext
  }) {
    let execResults;
    const results = await Promise.all(
      entry.steps.map(
        (step, i) => this.executeEntry({
          workflowId,
          runId,
          entry: step,
          prevStep,
          stepResults,
          serializedStepGraph,
          resume,
          executionContext: {
            workflowId,
            runId,
            executionPath: [...executionContext.executionPath, i],
            suspendedPaths: executionContext.suspendedPaths,
            retryConfig: executionContext.retryConfig,
            executionSpan: executionContext.executionSpan
          },
          emitter,
          abortController,
          runtimeContext
        })
      )
    );
    const hasFailed = results.find((result) => result.result.status === "failed");
    const hasSuspended = results.find((result) => result.result.status === "suspended");
    if (hasFailed) {
      execResults = { status: "failed", error: hasFailed.result.error };
    } else if (hasSuspended) {
      execResults = { status: "suspended", payload: hasSuspended.result.suspendPayload };
    } else if (abortController?.signal?.aborted) {
      execResults = { status: "canceled" };
    } else {
      execResults = {
        status: "success",
        output: results.reduce((acc, result, index) => {
          if (result.result.status === "success") {
            acc[entry.steps[index].step.id] = result.result.output;
          }
          return acc;
        }, {})
      };
    }
    return execResults;
  }
  async executeConditional({
    workflowId,
    runId,
    entry,
    prevOutput,
    prevStep,
    serializedStepGraph,
    stepResults,
    resume,
    executionContext,
    emitter,
    abortController,
    runtimeContext
  }) {
    let execResults;
    const truthyIndexes = (await Promise.all(
      entry.conditions.map(async (cond, index) => {
        try {
          const result = await cond({
            runId,
            mastra: this.mastra,
            runtimeContext,
            inputData: prevOutput,
            runCount: -1,
            getInitData: () => stepResults?.input,
            getStepResult: (step) => {
              if (!step?.id) {
                return null;
              }
              const result2 = stepResults[step.id];
              if (result2?.status === "success") {
                return result2.output;
              }
              return null;
            },
            // TODO: this function shouldn't have suspend probably?
            suspend: async (_suspendPayload) => {
            },
            bail: () => {
            },
            abort: () => {
              abortController?.abort();
            },
            [EMITTER_SYMBOL]: emitter,
            engine: {},
            abortSignal: abortController?.signal
          });
          return result ? index : null;
        } catch (e) {
          const error = e instanceof MastraError ? e : new MastraError(
            {
              id: "WORKFLOW_CONDITION_EVALUATION_FAILED",
              domain: "MASTRA_WORKFLOW" /* MASTRA_WORKFLOW */,
              category: "USER" /* USER */,
              details: { workflowId, runId }
            },
            e
          );
          this.logger.trackException(error);
          this.logger.error("Error evaluating condition: " + error?.stack);
          return null;
        }
      })
    )).filter((index) => index !== null);
    const stepsToRun = entry.steps.filter((_, index) => truthyIndexes.includes(index));
    const results = await Promise.all(
      stepsToRun.map(
        (step, index) => this.executeEntry({
          workflowId,
          runId,
          entry: step,
          prevStep,
          stepResults,
          serializedStepGraph,
          resume,
          executionContext: {
            workflowId,
            runId,
            executionPath: [...executionContext.executionPath, index],
            suspendedPaths: executionContext.suspendedPaths,
            retryConfig: executionContext.retryConfig,
            executionSpan: executionContext.executionSpan
          },
          emitter,
          abortController,
          runtimeContext
        })
      )
    );
    const hasFailed = results.find((result) => result.result.status === "failed");
    const hasSuspended = results.find((result) => result.result.status === "suspended");
    if (hasFailed) {
      execResults = { status: "failed", error: hasFailed.result.error };
    } else if (hasSuspended) {
      execResults = { status: "suspended", payload: hasSuspended.result.suspendPayload };
    } else if (abortController?.signal?.aborted) {
      execResults = { status: "canceled" };
    } else {
      execResults = {
        status: "success",
        output: results.reduce((acc, result, index) => {
          if (result.result.status === "success") {
            acc[stepsToRun[index].step.id] = result.result.output;
          }
          return acc;
        }, {})
      };
    }
    return execResults;
  }
  async executeLoop({
    workflowId,
    runId,
    entry,
    prevOutput,
    stepResults,
    resume,
    executionContext,
    emitter,
    abortController,
    runtimeContext
  }) {
    const { step, condition } = entry;
    let isTrue = true;
    let result = { status: "success", output: prevOutput };
    do {
      result = await this.executeStep({
        workflowId,
        runId,
        step,
        stepResults,
        executionContext,
        resume,
        prevOutput: result.output,
        emitter,
        abortController,
        runtimeContext
      });
      if (result.status !== "success") {
        return result;
      }
      isTrue = await condition({
        runId,
        mastra: this.mastra,
        runtimeContext,
        inputData: result.output,
        runCount: -1,
        getInitData: () => stepResults?.input,
        getStepResult: (step2) => {
          if (!step2?.id) {
            return null;
          }
          const result2 = stepResults[step2.id];
          return result2?.status === "success" ? result2.output : null;
        },
        suspend: async (_suspendPayload) => {
        },
        bail: () => {
        },
        abort: () => {
          abortController?.abort();
        },
        [EMITTER_SYMBOL]: emitter,
        engine: {},
        abortSignal: abortController?.signal
      });
    } while (entry.loopType === "dowhile" ? isTrue : !isTrue);
    return result;
  }
  async executeForeach({
    workflowId,
    runId,
    entry,
    prevOutput,
    stepResults,
    resume,
    executionContext,
    emitter,
    abortController,
    runtimeContext
  }) {
    const { step, opts } = entry;
    const results = [];
    const concurrency = opts.concurrency;
    const startTime = resume?.steps[0] === step.id ? void 0 : Date.now();
    const resumeTime = resume?.steps[0] === step.id ? Date.now() : void 0;
    for (let i = 0; i < prevOutput.length; i += concurrency) {
      const items = prevOutput.slice(i, i + concurrency);
      const itemsResults = await Promise.all(
        items.map((item) => {
          return this.executeStep({
            workflowId,
            runId,
            step,
            stepResults,
            executionContext,
            resume,
            prevOutput: item,
            emitter,
            abortController,
            runtimeContext
          });
        })
      );
      for (const result of itemsResults) {
        if (result.status !== "success") {
          return result;
        }
        results.push(result?.output);
      }
    }
    return {
      ...stepResults[step.id],
      status: "success",
      payload: prevOutput,
      ...resume?.steps[0] === step.id ? { resumePayload: resume?.resumePayload } : {},
      output: results,
      //@ts-ignore
      endedAt: Date.now(),
      ...startTime ? { startedAt: startTime } : {},
      ...resumeTime ? { resumedAt: resumeTime } : {}
    };
  }
  async persistStepUpdate({
    workflowId,
    runId,
    stepResults,
    serializedStepGraph,
    executionContext,
    workflowStatus,
    result,
    error
  }) {
    await this.mastra?.getStorage()?.persistWorkflowSnapshot({
      workflowName: workflowId,
      runId,
      snapshot: {
        runId,
        status: workflowStatus,
        value: {},
        context: stepResults,
        activePaths: [],
        serializedStepGraph,
        suspendedPaths: executionContext.suspendedPaths,
        result,
        error,
        // @ts-ignore
        timestamp: Date.now()
      }
    });
  }
  async executeEntry({
    workflowId,
    runId,
    entry,
    prevStep,
    serializedStepGraph,
    stepResults,
    resume,
    executionContext,
    emitter,
    abortController,
    runtimeContext
  }) {
    const prevOutput = this.getStepOutput(stepResults, prevStep);
    let execResults;
    if (entry.type === "step") {
      const { step } = entry;
      execResults = await this.executeStep({
        workflowId,
        runId,
        step,
        stepResults,
        executionContext,
        resume,
        prevOutput,
        emitter,
        abortController,
        runtimeContext
      });
    } else if (resume?.resumePath?.length && (entry.type === "parallel" || entry.type === "conditional")) {
      const idx = resume.resumePath.shift();
      return this.executeEntry({
        workflowId,
        runId,
        entry: entry.steps[idx],
        prevStep,
        serializedStepGraph,
        stepResults,
        resume,
        executionContext: {
          workflowId,
          runId,
          executionPath: [...executionContext.executionPath, idx],
          suspendedPaths: executionContext.suspendedPaths,
          retryConfig: executionContext.retryConfig,
          executionSpan: executionContext.executionSpan
        },
        emitter,
        abortController,
        runtimeContext
      });
    } else if (entry.type === "parallel") {
      execResults = await this.executeParallel({
        workflowId,
        runId,
        entry,
        prevStep,
        stepResults,
        serializedStepGraph,
        resume,
        executionContext,
        emitter,
        abortController,
        runtimeContext
      });
    } else if (entry.type === "conditional") {
      execResults = await this.executeConditional({
        workflowId,
        runId,
        entry,
        prevStep,
        prevOutput,
        stepResults,
        serializedStepGraph,
        resume,
        executionContext,
        emitter,
        abortController,
        runtimeContext
      });
    } else if (entry.type === "loop") {
      execResults = await this.executeLoop({
        workflowId,
        runId,
        entry,
        prevStep,
        prevOutput,
        stepResults,
        resume,
        executionContext,
        emitter,
        abortController,
        runtimeContext
      });
    } else if (entry.type === "foreach") {
      execResults = await this.executeForeach({
        workflowId,
        runId,
        entry,
        prevStep,
        prevOutput,
        stepResults,
        resume,
        executionContext,
        emitter,
        abortController,
        runtimeContext
      });
    } else if (entry.type === "sleep") {
      const startedAt = Date.now();
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          currentStep: {
            id: entry.id,
            status: "waiting",
            payload: prevOutput,
            startedAt
          },
          workflowState: {
            status: "waiting",
            steps: {
              ...stepResults,
              [entry.id]: {
                status: "waiting",
                payload: prevOutput,
                startedAt
              }
            },
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
      await emitter.emit("watch-v2", {
        type: "step-waiting",
        payload: {
          id: entry.id,
          payload: prevOutput,
          startedAt,
          status: "waiting"
        }
      });
      await this.persistStepUpdate({
        workflowId,
        runId,
        serializedStepGraph,
        stepResults,
        executionContext,
        workflowStatus: "waiting"
      });
      await this.executeSleep({ id: entry.id, duration: entry.duration });
      await this.persistStepUpdate({
        workflowId,
        runId,
        serializedStepGraph,
        stepResults,
        executionContext,
        workflowStatus: "running"
      });
      const endedAt = Date.now();
      const stepInfo = {
        payload: prevOutput,
        startedAt,
        endedAt
      };
      execResults = { ...stepInfo, status: "success", output: prevOutput };
      stepResults[entry.id] = { ...stepInfo, status: "success", output: prevOutput };
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          currentStep: {
            id: entry.id,
            ...execResults
          },
          workflowState: {
            status: "running",
            steps: {
              ...stepResults,
              [entry.id]: {
                ...execResults
              }
            },
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
      await emitter.emit("watch-v2", {
        type: "step-result",
        payload: {
          id: entry.id,
          ...execResults
        }
      });
      await emitter.emit("watch-v2", {
        type: "step-finish",
        payload: {
          id: entry.id,
          metadata: {}
        }
      });
    } else if (entry.type === "sleepUntil") {
      const startedAt = Date.now();
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          currentStep: {
            id: entry.id,
            status: "waiting",
            payload: prevOutput,
            startedAt
          },
          workflowState: {
            status: "waiting",
            steps: {
              ...stepResults,
              [entry.id]: {
                status: "waiting",
                payload: prevOutput,
                startedAt
              }
            },
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
      await emitter.emit("watch-v2", {
        type: "step-waiting",
        payload: {
          id: entry.id,
          payload: prevOutput,
          startedAt,
          status: "waiting"
        }
      });
      await this.persistStepUpdate({
        workflowId,
        runId,
        serializedStepGraph,
        stepResults,
        executionContext,
        workflowStatus: "waiting"
      });
      await this.executeSleep({ id: entry.id, duration: entry.date.getTime() - Date.now() });
      await this.persistStepUpdate({
        workflowId,
        runId,
        serializedStepGraph,
        stepResults,
        executionContext,
        workflowStatus: "running"
      });
      const endedAt = Date.now();
      const stepInfo = {
        payload: prevOutput,
        startedAt,
        endedAt
      };
      execResults = { ...stepInfo, status: "success", output: prevOutput };
      stepResults[entry.id] = { ...stepInfo, status: "success", output: prevOutput };
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          currentStep: {
            id: entry.id,
            ...execResults
          },
          workflowState: {
            status: "running",
            steps: {
              ...stepResults,
              [entry.id]: {
                ...execResults
              }
            },
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
      await emitter.emit("watch-v2", {
        type: "step-result",
        payload: {
          id: entry.id,
          ...execResults
        }
      });
      await emitter.emit("watch-v2", {
        type: "step-finish",
        payload: {
          id: entry.id,
          metadata: {}
        }
      });
    } else if (entry.type === "waitForEvent") {
      const startedAt = Date.now();
      let eventData;
      await emitter.emit("watch", {
        type: "watch",
        payload: {
          currentStep: {
            id: entry.step.id,
            status: "waiting",
            payload: prevOutput,
            startedAt
          },
          workflowState: {
            status: "waiting",
            steps: {
              ...stepResults,
              [entry.step.id]: {
                status: "waiting",
                payload: prevOutput,
                startedAt
              }
            },
            result: null,
            error: null
          }
        },
        eventTimestamp: Date.now()
      });
      await emitter.emit("watch-v2", {
        type: "step-waiting",
        payload: {
          id: entry.step.id,
          payload: prevOutput,
          startedAt,
          status: "waiting"
        }
      });
      await this.persistStepUpdate({
        workflowId,
        runId,
        serializedStepGraph,
        stepResults,
        executionContext,
        workflowStatus: "waiting"
      });
      try {
        eventData = await this.executeWaitForEvent({ event: entry.event, emitter, timeout: entry.timeout });
        await this.persistStepUpdate({
          workflowId,
          runId,
          serializedStepGraph,
          stepResults,
          executionContext,
          workflowStatus: "running"
        });
        const { step } = entry;
        execResults = await this.executeStep({
          workflowId,
          runId,
          step,
          stepResults,
          executionContext,
          resume: {
            resumePayload: eventData,
            steps: [entry.step.id]
          },
          prevOutput,
          emitter,
          abortController,
          runtimeContext
        });
      } catch (error) {
        execResults = {
          status: "failed",
          error
        };
      }
      const endedAt = Date.now();
      const stepInfo = {
        payload: prevOutput,
        startedAt,
        endedAt
      };
      execResults = { ...execResults, ...stepInfo };
    }
    if (entry.type === "step" || entry.type === "waitForEvent" || entry.type === "loop" || entry.type === "foreach") {
      stepResults[entry.step.id] = execResults;
    }
    if (abortController?.signal?.aborted) {
      execResults = { ...execResults, status: "canceled" };
    }
    await this.persistStepUpdate({
      workflowId,
      runId,
      serializedStepGraph,
      stepResults,
      executionContext,
      workflowStatus: "running"
    });
    return { result: execResults, stepResults, executionContext };
  }
};
function createStep(params) {
  if (params instanceof Agent) {
    return {
      id: params.name,
      // @ts-ignore
      inputSchema: objectType({
        prompt: stringType()
        // resourceId: z.string().optional(),
        // threadId: z.string().optional(),
      }),
      // @ts-ignore
      outputSchema: objectType({
        text: stringType()
      }),
      execute: async ({ inputData, [EMITTER_SYMBOL]: emitter, runtimeContext, abortSignal, abort }) => {
        let streamPromise = {};
        streamPromise.promise = new Promise((resolve, reject) => {
          streamPromise.resolve = resolve;
          streamPromise.reject = reject;
        });
        const toolData = {
          name: params.name,
          args: inputData
        };
        await emitter.emit("watch-v2", {
          type: "tool-call-streaming-start",
          ...toolData
        });
        const { fullStream } = await params.stream(inputData.prompt, {
          // resourceId: inputData.resourceId,
          // threadId: inputData.threadId,
          runtimeContext,
          onFinish: (result) => {
            streamPromise.resolve(result.text);
          },
          abortSignal
        });
        if (abortSignal.aborted) {
          return abort();
        }
        for await (const chunk of fullStream) {
          switch (chunk.type) {
            case "text-delta":
              await emitter.emit("watch-v2", {
                type: "tool-call-delta",
                ...toolData,
                argsTextDelta: chunk.textDelta
              });
              break;
            case "step-start":
            case "step-finish":
            case "finish":
              break;
            case "tool-call":
            case "tool-result":
            case "tool-call-streaming-start":
            case "tool-call-delta":
            case "source":
            case "file":
            default:
              await emitter.emit("watch-v2", chunk);
              break;
          }
        }
        return {
          text: await streamPromise.promise
        };
      }
    };
  }
  if (params instanceof Tool) {
    if (!params.inputSchema || !params.outputSchema) {
      throw new Error("Tool must have input and output schemas defined");
    }
    return {
      // TODO: tool probably should have strong id type
      // @ts-ignore
      id: params.id,
      inputSchema: params.inputSchema,
      outputSchema: params.outputSchema,
      execute: async ({ inputData, mastra, runtimeContext }) => {
        return params.execute({
          context: inputData,
          mastra,
          runtimeContext
        });
      }
    };
  }
  return {
    id: params.id,
    description: params.description,
    inputSchema: params.inputSchema,
    outputSchema: params.outputSchema,
    resumeSchema: params.resumeSchema,
    suspendSchema: params.suspendSchema,
    execute: params.execute
  };
}
function createWorkflow(params) {
  return new Workflow(params);
}
var Workflow = class extends MastraBase {
  id;
  description;
  inputSchema;
  outputSchema;
  steps;
  stepDefs;
  stepFlow;
  serializedStepFlow;
  executionEngine;
  executionGraph;
  retryConfig;
  #mastra;
  #runs = /* @__PURE__ */ new Map();
  constructor({
    mastra,
    id,
    inputSchema,
    outputSchema,
    description,
    executionEngine,
    retryConfig,
    steps
  }) {
    super({ name: id, component: RegisteredLogger.WORKFLOW });
    this.id = id;
    this.description = description;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
    this.retryConfig = retryConfig ?? { attempts: 0, delay: 0 };
    this.executionGraph = this.buildExecutionGraph();
    this.stepFlow = [];
    this.serializedStepFlow = [];
    this.#mastra = mastra;
    this.steps = {};
    this.stepDefs = steps;
    if (!executionEngine) {
      this.executionEngine = new DefaultExecutionEngine({ mastra: this.#mastra });
    } else {
      this.executionEngine = executionEngine;
    }
    this.#runs = /* @__PURE__ */ new Map();
  }
  get runs() {
    return this.#runs;
  }
  get mastra() {
    return this.#mastra;
  }
  __registerMastra(mastra) {
    this.#mastra = mastra;
    this.executionEngine.__registerMastra(mastra);
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  setStepFlow(stepFlow) {
    this.stepFlow = stepFlow;
  }
  /**
   * Adds a step to the workflow
   * @param step The step to add to the workflow
   * @returns The workflow instance for chaining
   */
  then(step) {
    this.stepFlow.push({ type: "step", step });
    this.serializedStepFlow.push({
      type: "step",
      step: {
        id: step.id,
        description: step.description,
        component: step.component,
        serializedStepFlow: step.serializedStepFlow
      }
    });
    this.steps[step.id] = step;
    return this;
  }
  /**
   * Adds a sleep step to the workflow
   * @param duration The duration to sleep for
   * @returns The workflow instance for chaining
   */
  sleep(duration) {
    const id = `sleep_${randomUUID()}`;
    this.stepFlow.push({ type: "sleep", id, duration });
    this.serializedStepFlow.push({
      type: "sleep",
      id,
      duration
    });
    this.steps[id] = createStep({
      id,
      inputSchema: objectType({}),
      outputSchema: objectType({}),
      execute: async () => {
        return {};
      }
    });
    return this;
  }
  /**
   * Adds a sleep until step to the workflow
   * @param date The date to sleep until
   * @returns The workflow instance for chaining
   */
  sleepUntil(date) {
    const id = `sleep_${randomUUID()}`;
    this.stepFlow.push({ type: "sleepUntil", id, date });
    this.serializedStepFlow.push({
      type: "sleepUntil",
      id,
      date
    });
    this.steps[id] = createStep({
      id,
      inputSchema: objectType({}),
      outputSchema: objectType({}),
      execute: async () => {
        return {};
      }
    });
    return this;
  }
  waitForEvent(event, step, opts) {
    this.stepFlow.push({ type: "waitForEvent", event, step, timeout: opts?.timeout });
    this.serializedStepFlow.push({
      type: "waitForEvent",
      event,
      step: {
        id: step.id,
        description: step.description,
        component: step.component,
        serializedStepFlow: step.serializedStepFlow
      },
      timeout: opts?.timeout
    });
    this.steps[step.id] = step;
    return this;
  }
  map(mappingConfig) {
    if (typeof mappingConfig === "function") {
      const mappingStep2 = createStep({
        id: `mapping_${randomUUID()}`,
        inputSchema: objectType({}),
        outputSchema: objectType({}),
        execute: mappingConfig
      });
      this.stepFlow.push({ type: "step", step: mappingStep2 });
      this.serializedStepFlow.push({
        type: "step",
        step: {
          id: mappingStep2.id,
          mapConfig: mappingConfig.toString()
        }
      });
      return this;
    }
    const newMappingConfig = Object.entries(mappingConfig).reduce(
      (a, [key, mapping]) => {
        const m = mapping;
        if (m.value !== void 0) {
          a[key] = m;
        } else if (m.fn !== void 0) {
          a[key] = {
            fn: m.fn.toString(),
            schema: m.schema
          };
        } else if (m.runtimeContextPath) {
          a[key] = {
            runtimeContextPath: m.runtimeContextPath,
            schema: m.schema
          };
        } else {
          a[key] = m;
        }
        return a;
      },
      {}
    );
    const mappingStep = createStep({
      id: `mapping_${randomUUID()}`,
      inputSchema: objectType({}),
      outputSchema: objectType({}),
      execute: async (ctx) => {
        const { getStepResult, getInitData, runtimeContext } = ctx;
        const result = {};
        for (const [key, mapping] of Object.entries(mappingConfig)) {
          const m = mapping;
          if (m.value !== void 0) {
            result[key] = m.value;
            continue;
          }
          if (m.fn !== void 0) {
            result[key] = await m.fn(ctx);
            continue;
          }
          if (m.runtimeContextPath) {
            result[key] = runtimeContext.get(m.runtimeContextPath);
            continue;
          }
          const stepResult = m.initData ? getInitData() : getStepResult(Array.isArray(m.step) ? m.step.find((s) => getStepResult(s)) : m.step);
          if (m.path === ".") {
            result[key] = stepResult;
            continue;
          }
          const pathParts = m.path.split(".");
          let value = stepResult;
          for (const part of pathParts) {
            if (typeof value === "object" && value !== null) {
              value = value[part];
            } else {
              throw new Error(`Invalid path ${m.path} in step ${m.step.id}`);
            }
          }
          result[key] = value;
        }
        return result;
      }
    });
    this.stepFlow.push({ type: "step", step: mappingStep });
    this.serializedStepFlow.push({
      type: "step",
      step: {
        id: mappingStep.id,
        mapConfig: JSON.stringify(newMappingConfig, null, 2)
      }
    });
    return this;
  }
  // TODO: make typing better here
  parallel(steps) {
    this.stepFlow.push({ type: "parallel", steps: steps.map((step) => ({ type: "step", step })) });
    this.serializedStepFlow.push({
      type: "parallel",
      steps: steps.map((step) => ({
        type: "step",
        step: {
          id: step.id,
          description: step.description,
          component: step.component,
          serializedStepFlow: step.serializedStepFlow
        }
      }))
    });
    steps.forEach((step) => {
      this.steps[step.id] = step;
    });
    return this;
  }
  // TODO: make typing better here
  branch(steps) {
    this.stepFlow.push({
      type: "conditional",
      steps: steps.map(([_cond, step]) => ({ type: "step", step })),
      // @ts-ignore
      conditions: steps.map(([cond]) => cond),
      serializedConditions: steps.map(([cond, _step]) => ({ id: `${_step.id}-condition`, fn: cond.toString() }))
    });
    this.serializedStepFlow.push({
      type: "conditional",
      steps: steps.map(([_cond, step]) => ({
        type: "step",
        step: {
          id: step.id,
          description: step.description,
          component: step.component,
          serializedStepFlow: step.serializedStepFlow
        }
      })),
      serializedConditions: steps.map(([cond, _step]) => ({ id: `${_step.id}-condition`, fn: cond.toString() }))
    });
    steps.forEach(([_, step]) => {
      this.steps[step.id] = step;
    });
    return this;
  }
  dowhile(step, condition) {
    this.stepFlow.push({
      type: "loop",
      step,
      // @ts-ignore
      condition,
      loopType: "dowhile",
      serializedCondition: { id: `${step.id}-condition`, fn: condition.toString() }
    });
    this.serializedStepFlow.push({
      type: "loop",
      step: {
        id: step.id,
        description: step.description,
        component: step.component,
        serializedStepFlow: step.serializedStepFlow
      },
      serializedCondition: { id: `${step.id}-condition`, fn: condition.toString() },
      loopType: "dowhile"
    });
    this.steps[step.id] = step;
    return this;
  }
  dountil(step, condition) {
    this.stepFlow.push({
      type: "loop",
      step,
      // @ts-ignore
      condition,
      loopType: "dountil",
      serializedCondition: { id: `${step.id}-condition`, fn: condition.toString() }
    });
    this.serializedStepFlow.push({
      type: "loop",
      step: {
        id: step.id,
        description: step.description,
        component: step.component,
        serializedStepFlow: step.serializedStepFlow
      },
      serializedCondition: { id: `${step.id}-condition`, fn: condition.toString() },
      loopType: "dountil"
    });
    this.steps[step.id] = step;
    return this;
  }
  foreach(step, opts) {
    this.stepFlow.push({ type: "foreach", step, opts: opts ?? { concurrency: 1 } });
    this.serializedStepFlow.push({
      type: "foreach",
      step: {
        id: step.id,
        description: step.description,
        component: step.component,
        serializedStepFlow: step.serializedStepFlow
      },
      opts: opts ?? { concurrency: 1 }
    });
    this.steps[step.id] = step;
    return this;
  }
  /**
   * Builds the execution graph for this workflow
   * @returns The execution graph that can be used to execute the workflow
   */
  buildExecutionGraph() {
    return {
      id: this.id,
      steps: this.stepFlow
    };
  }
  /**
   * Finalizes the workflow definition and prepares it for execution
   * This method should be called after all steps have been added to the workflow
   * @returns A built workflow instance ready for execution
   */
  commit() {
    this.executionGraph = this.buildExecutionGraph();
    return this;
  }
  get stepGraph() {
    return this.stepFlow;
  }
  get serializedStepGraph() {
    return this.serializedStepFlow;
  }
  /**
   * Creates a new workflow run instance
   * @param options Optional configuration for the run
   * @returns A Run instance that can be used to execute the workflow
   */
  createRun(options) {
    if (this.stepFlow.length === 0) {
      throw new Error(
        "Execution flow of workflow is not defined. Add steps to the workflow via .then(), .branch(), etc."
      );
    }
    if (!this.executionGraph.steps) {
      throw new Error("Uncommitted step flow changes detected. Call .commit() to register the steps.");
    }
    const runIdToUse = options?.runId || randomUUID();
    const run = this.#runs.get(runIdToUse) ?? new Run({
      workflowId: this.id,
      runId: runIdToUse,
      executionEngine: this.executionEngine,
      executionGraph: this.executionGraph,
      mastra: this.#mastra,
      retryConfig: this.retryConfig,
      serializedStepGraph: this.serializedStepGraph,
      cleanup: () => this.#runs.delete(runIdToUse)
    });
    this.#runs.set(runIdToUse, run);
    this.mastra?.getLogger().warn("createRun() is deprecated. Use createRunAsync() instead.");
    return run;
  }
  /**
   * Creates a new workflow run instance and stores a snapshot of the workflow in the storage
   * @param options Optional configuration for the run
   * @returns A Run instance that can be used to execute the workflow
   */
  async createRunAsync(options) {
    if (this.stepFlow.length === 0) {
      throw new Error(
        "Execution flow of workflow is not defined. Add steps to the workflow via .then(), .branch(), etc."
      );
    }
    if (!this.executionGraph.steps) {
      throw new Error("Uncommitted step flow changes detected. Call .commit() to register the steps.");
    }
    const runIdToUse = options?.runId || randomUUID();
    const run = this.#runs.get(runIdToUse) ?? new Run({
      workflowId: this.id,
      runId: runIdToUse,
      executionEngine: this.executionEngine,
      executionGraph: this.executionGraph,
      mastra: this.#mastra,
      retryConfig: this.retryConfig,
      serializedStepGraph: this.serializedStepGraph,
      cleanup: () => this.#runs.delete(runIdToUse)
    });
    this.#runs.set(runIdToUse, run);
    const workflowSnapshotInStorage = await this.getWorkflowRunExecutionResult(runIdToUse);
    if (!workflowSnapshotInStorage) {
      await this.mastra?.getStorage()?.persistWorkflowSnapshot({
        workflowName: this.id,
        runId: runIdToUse,
        snapshot: {
          runId: runIdToUse,
          status: "pending",
          value: {},
          context: {},
          activePaths: [],
          serializedStepGraph: this.serializedStepGraph,
          suspendedPaths: {},
          result: void 0,
          error: void 0,
          // @ts-ignore
          timestamp: Date.now()
        }
      });
    }
    return run;
  }
  async execute({
    inputData,
    resumeData,
    suspend,
    resume,
    [EMITTER_SYMBOL]: emitter,
    mastra,
    runtimeContext,
    abort,
    abortSignal
  }) {
    this.__registerMastra(mastra);
    const run = resume?.steps?.length ? this.createRun({ runId: resume.runId }) : this.createRun();
    const nestedAbortCb = () => {
      abort();
    };
    run.abortController?.signal.addEventListener("abort", nestedAbortCb);
    abortSignal.addEventListener("abort", async () => {
      run.abortController.signal.removeEventListener("abort", nestedAbortCb);
      await run.cancel();
    });
    const unwatchV2 = run.watch((event) => {
      emitter.emit("nested-watch-v2", { event, workflowId: this.id });
    }, "watch-v2");
    const unwatch = run.watch((event) => {
      emitter.emit("nested-watch", { event, workflowId: this.id, runId: run.runId, isResume: !!resume?.steps?.length });
    }, "watch");
    const res = resume?.steps?.length ? await run.resume({ resumeData, step: resume.steps, runtimeContext }) : await run.start({ inputData, runtimeContext });
    unwatch();
    unwatchV2();
    const suspendedSteps = Object.entries(res.steps).filter(([_stepName, stepResult]) => {
      const stepRes = stepResult;
      return stepRes?.status === "suspended";
    });
    if (suspendedSteps?.length) {
      for (const [stepName, stepResult] of suspendedSteps) {
        const suspendPath = [stepName, ...stepResult?.suspendPayload?.__workflow_meta?.path ?? []];
        await suspend({
          ...stepResult?.suspendPayload,
          __workflow_meta: { runId: run.runId, path: suspendPath }
        });
      }
    }
    if (res.status === "failed") {
      throw res.error;
    }
    return res.status === "success" ? res.result : void 0;
  }
  async getWorkflowRuns(args) {
    const storage = this.#mastra?.getStorage();
    if (!storage) {
      this.logger.debug("Cannot get workflow runs. Mastra storage is not initialized");
      return { runs: [], total: 0 };
    }
    return storage.getWorkflowRuns({ workflowName: this.id, ...args ?? {} });
  }
  async getWorkflowRunById(runId) {
    const storage = this.#mastra?.getStorage();
    if (!storage) {
      this.logger.debug("Cannot get workflow runs from storage. Mastra storage is not initialized");
      return this.#runs.get(runId) ? { ...this.#runs.get(runId), workflowName: this.id } : null;
    }
    const run = await storage.getWorkflowRunById({ runId, workflowName: this.id });
    return run ?? (this.#runs.get(runId) ? { ...this.#runs.get(runId), workflowName: this.id } : null);
  }
  async getWorkflowRunExecutionResult(runId) {
    const storage = this.#mastra?.getStorage();
    if (!storage) {
      this.logger.debug("Cannot get workflow run execution result. Mastra storage is not initialized");
      return null;
    }
    const run = await storage.getWorkflowRunById({ runId, workflowName: this.id });
    let snapshot = run?.snapshot;
    if (!snapshot) {
      return null;
    }
    if (typeof snapshot === "string") {
      try {
        snapshot = JSON.parse(snapshot);
      } catch (e) {
        this.logger.debug("Cannot get workflow run execution result. Snapshot is not a valid JSON string", e);
        return null;
      }
    }
    return {
      status: snapshot.status,
      result: snapshot.result,
      error: snapshot.error,
      payload: snapshot.context?.input,
      steps: snapshot.context
    };
  }
};
var Run = class {
  abortController;
  emitter;
  /**
   * Unique identifier for this workflow
   */
  workflowId;
  /**
   * Unique identifier for this run
   */
  runId;
  /**
   * Internal state of the workflow run
   */
  state = {};
  /**
   * The execution engine for this run
   */
  executionEngine;
  /**
   * The execution graph for this run
   */
  executionGraph;
  /**
   * The serialized step graph for this run
   */
  serializedStepGraph;
  /**
   * The storage for this run
   */
  #mastra;
  closeStreamAction;
  executionResults;
  cleanup;
  retryConfig;
  constructor(params) {
    this.workflowId = params.workflowId;
    this.runId = params.runId;
    this.serializedStepGraph = params.serializedStepGraph;
    this.executionEngine = params.executionEngine;
    this.executionGraph = params.executionGraph;
    this.#mastra = params.mastra;
    this.emitter = new EventEmitter();
    this.retryConfig = params.retryConfig;
    this.cleanup = params.cleanup;
    this.abortController = new AbortController();
  }
  /**
   * Cancels the workflow execution
   */
  async cancel() {
    this.abortController?.abort();
  }
  async sendEvent(event, data) {
    this.emitter.emit(`user-event-${event}`, data);
  }
  /**
   * Starts the workflow execution with the provided input
   * @param input The input data for the workflow
   * @returns A promise that resolves to the workflow output
   */
  async start({
    inputData,
    runtimeContext
  }) {
    const result = await this.executionEngine.execute({
      workflowId: this.workflowId,
      runId: this.runId,
      graph: this.executionGraph,
      serializedStepGraph: this.serializedStepGraph,
      input: inputData,
      emitter: {
        emit: async (event, data) => {
          this.emitter.emit(event, data);
        },
        on: (event, callback) => {
          this.emitter.on(event, callback);
        },
        off: (event, callback) => {
          this.emitter.off(event, callback);
        },
        once: (event, callback) => {
          this.emitter.once(event, callback);
        }
      },
      retryConfig: this.retryConfig,
      runtimeContext: runtimeContext ?? new RuntimeContext(),
      abortController: this.abortController
    });
    if (result.status !== "suspended") {
      this.cleanup?.();
    }
    return result;
  }
  /**
   * Starts the workflow execution with the provided input as a stream
   * @param input The input data for the workflow
   * @returns A promise that resolves to the workflow output
   */
  stream({ inputData, runtimeContext } = {}) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const unwatch = this.watch(async (event) => {
      try {
        await writer.write(event);
      } catch {
      }
    }, "watch-v2");
    this.closeStreamAction = async () => {
      this.emitter.emit("watch-v2", {
        type: "finish",
        payload: { runId: this.runId }
      });
      unwatch();
      try {
        await writer.close();
      } catch (err) {
        console.error("Error closing stream:", err);
      } finally {
        writer.releaseLock();
      }
    };
    this.emitter.emit("watch-v2", {
      type: "start",
      payload: { runId: this.runId }
    });
    this.executionResults = this.start({ inputData, runtimeContext }).then((result) => {
      if (result.status !== "suspended") {
        this.closeStreamAction?.().catch(() => {
        });
      }
      return result;
    });
    return {
      stream: readable,
      getWorkflowState: () => this.executionResults
    };
  }
  watch(cb, type = "watch") {
    const watchCb = (event) => {
      this.updateState(event.payload);
      cb({ type: event.type, payload: this.getState(), eventTimestamp: event.eventTimestamp });
    };
    const nestedWatchCb = ({ event, workflowId }) => {
      try {
        const { type: type2, payload, eventTimestamp } = event;
        const prefixedSteps = Object.fromEntries(
          Object.entries(payload?.workflowState?.steps ?? {}).map(([stepId, step]) => [
            `${workflowId}.${stepId}`,
            step
          ])
        );
        const newPayload = {
          currentStep: {
            ...payload?.currentStep,
            id: `${workflowId}.${payload?.currentStep?.id}`
          },
          workflowState: {
            steps: prefixedSteps
          }
        };
        this.updateState(newPayload);
        cb({ type: type2, payload: this.getState(), eventTimestamp });
      } catch (e) {
        console.error(e);
      }
    };
    const nestedWatchV2Cb = ({
      event,
      workflowId
    }) => {
      this.emitter.emit("watch-v2", {
        ...event,
        ...event.payload?.id ? { payload: { ...event.payload, id: `${workflowId}.${event.payload.id}` } } : {}
      });
    };
    if (type === "watch") {
      this.emitter.on("watch", watchCb);
      this.emitter.on("nested-watch", nestedWatchCb);
    } else if (type === "watch-v2") {
      this.emitter.on("watch-v2", cb);
      this.emitter.on("nested-watch-v2", nestedWatchV2Cb);
    }
    return () => {
      if (type === "watch-v2") {
        this.emitter.off("watch-v2", cb);
        this.emitter.off("nested-watch-v2", nestedWatchV2Cb);
      } else {
        this.emitter.off("watch", watchCb);
        this.emitter.off("nested-watch", nestedWatchCb);
      }
    };
  }
  async resume(params) {
    const steps = (Array.isArray(params.step) ? params.step : [params.step]).map(
      (step) => typeof step === "string" ? step : step?.id
    );
    const snapshot = await this.#mastra?.getStorage()?.loadWorkflowSnapshot({
      workflowName: this.workflowId,
      runId: this.runId
    });
    const executionResultPromise = this.executionEngine.execute({
      workflowId: this.workflowId,
      runId: this.runId,
      graph: this.executionGraph,
      serializedStepGraph: this.serializedStepGraph,
      input: params.resumeData,
      resume: {
        steps,
        stepResults: snapshot?.context,
        resumePayload: params.resumeData,
        // @ts-ignore
        resumePath: snapshot?.suspendedPaths?.[steps?.[0]]
      },
      emitter: {
        emit: (event, data) => {
          this.emitter.emit(event, data);
          return Promise.resolve();
        },
        on: (event, callback) => {
          this.emitter.on(event, callback);
        },
        off: (event, callback) => {
          this.emitter.off(event, callback);
        },
        once: (event, callback) => {
          this.emitter.once(event, callback);
        }
      },
      runtimeContext: params.runtimeContext ?? new RuntimeContext(),
      abortController: this.abortController
    }).then((result) => {
      if (result.status !== "suspended") {
        this.closeStreamAction?.().catch(() => {
        });
      }
      return result;
    });
    this.executionResults = executionResultPromise;
    return executionResultPromise;
  }
  /**
   * Returns the current state of the workflow run
   * @returns The current state of the workflow run
   */
  getState() {
    return this.state;
  }
  updateState(state) {
    if (state.currentStep) {
      this.state.currentStep = state.currentStep;
    } else if (state.workflowState?.status !== "running") {
      delete this.state.currentStep;
    }
    if (state.workflowState) {
      this.state.workflowState = deepMergeWorkflowState(this.state.workflowState ?? {}, state.workflowState ?? {});
    }
  }
};
function deepMergeWorkflowState(a, b) {
  if (!a || typeof a !== "object") return b;
  if (!b || typeof b !== "object") return a;
  const result = { ...a };
  for (const key in b) {
    if (b[key] === void 0) continue;
    if (b[key] !== null && typeof b[key] === "object") {
      const aVal = result[key];
      const bVal = b[key];
      if (Array.isArray(bVal)) {
        result[key] = bVal.filter((item) => item !== void 0);
      } else if (typeof aVal === "object" && aVal !== null) {
        result[key] = deepMergeWorkflowState(aVal, bVal);
      } else {
        result[key] = bVal;
      }
    } else {
      result[key] = b[key];
    }
  }
  return result;
}

export { createStep, createWorkflow };
