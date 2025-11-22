import { AgentFunction, AgentFunctionInfo } from "graphai";

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 15000;
const MAX_DEPENDENCIES = 5;

type SandboxLanguage = "js" | "ts";

type SandboxRequest = {
  code: string;
  payload: Record<string, unknown>;
  timeoutMs: number;
  dependencies: string[];
  language: SandboxLanguage;
};

type SandboxResponse = {
  result: unknown;
  logs: { level: string; data: unknown }[];
};

const sandboxWorkerSource = `
self.onmessage = async (event) => {
  const { code, payload, dependencies, language } = event.data || {};
  const send = (message) => self.postMessage(message);

  const safeConsole = {
    log: (...args) => send({ type: "log", data: args }),
    warn: (...args) => send({ type: "log", level: "warn", data: args }),
    error: (...args) => send({ type: "log", level: "error", data: args }),
  };

  try {
    if (Array.isArray(dependencies) && dependencies.length) {
      importScripts(...dependencies);
    }

    let executable = code;
    if (language === "ts") {
      if (self.ts && typeof self.ts.transpileModule === "function") {
        executable = self.ts.transpileModule(code, { compilerOptions: { module: 1, target: 99 } }).outputText;
      } else {
        throw new Error("TypeScript execution requested, but 'typescript' was not provided as a dependency.");
      }
    }

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const userFunction = new AsyncFunction("inputs", "console", `"use strict";\n${executable}`);
    const result = await userFunction(payload, safeConsole);
    send({ type: "result", result });
  } catch (error) {
    send({
      type: "error",
      message: error?.message ?? "Execution failed",
      stack: error?.stack,
    });
  }
};
`;

const createSandboxWorker = () => {
  const url = URL.createObjectURL(new Blob([sandboxWorkerSource], { type: "text/javascript" }));
  return { worker: new Worker(url), url };
};

const runInSandbox = ({ code, payload, timeoutMs, dependencies, language }: SandboxRequest): Promise<SandboxResponse> => {
  return new Promise((resolve, reject) => {
    const { worker, url } = createSandboxWorker();
    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(`Sandbox timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const logs: { level: string; data: unknown }[] = [];

    worker.onmessage = (event: MessageEvent) => {
      const { type, result, message, data } = event.data || {};
      if (type === "log") {
        logs.push({ level: event.data.level ?? "log", data });
        return;
      }

      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);

      if (type === "error") {
        reject(new Error(message ?? "Sandbox execution failed"));
        return;
      }

      resolve({ result, logs });
    };

    worker.onerror = (error) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(error.message));
    };

    worker.postMessage({ code, payload, dependencies, language });
  });
};

const extractInputs = (inputs: Record<string, unknown> | undefined) => {
  if (!inputs) {
    return { payload: undefined, context: undefined, inputs: {} };
  }

  const { payload, context, ...rest } = inputs;

  return {
    payload,
    context,
    inputs: rest,
  };
};

export const sandboxRunnerAgent: AgentFunction = async ({ params, namedInputs }) => {
  const { code, timeoutMs = DEFAULT_TIMEOUT_MS, dependencies = [], language = "js" } = params ?? {};

  if (!code || typeof code !== "string") {
    throw new Error("sandboxRunnerAgent requires a code string to execute.");
  }

  const resolvedTimeout = Math.max(1, Math.min(typeof timeoutMs === "number" ? timeoutMs : DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS));
  const sanitizedDependencies = Array.isArray(dependencies)
    ? dependencies
        .filter((dependency): dependency is string => typeof dependency === "string")
        .filter((dependency) => dependency.startsWith("https://") || dependency.startsWith("http://"))
        .slice(0, MAX_DEPENDENCIES)
    : [];
  const droppedDependencies = Array.isArray(dependencies) ? dependencies.length - sanitizedDependencies.length : 0;
  const sanitizedLanguage: SandboxLanguage = language === "ts" ? "ts" : "js";

  const structuredInputs = extractInputs(namedInputs ?? {});

  const now = typeof performance !== "undefined" ? () => performance.now() : () => Date.now();
  const startedAt = now();

  const { result, logs } = await runInSandbox({
    code,
    payload: structuredInputs,
    timeoutMs: resolvedTimeout,
    dependencies: sanitizedDependencies,
    language: sanitizedLanguage,
  });

  const runtimeMs = Math.round(now() - startedAt);
  const warnings: string[] = [];

  if (droppedDependencies > 0) {
    warnings.push(`${droppedDependencies} dependencies were ignored because they were invalid or exceed the limit of ${MAX_DEPENDENCIES}.`);
  }

  if (structuredInputs.context) {
    warnings.push("Context was provided to the sandbox. Ensure it does not contain secrets or privileged data.");
  }

  return {
    result,
    logs,
    usedDependencies: sanitizedDependencies,
    runtimeMs,
    language: sanitizedLanguage,
    warnings: warnings.length ? warnings : undefined,
  };
};

const sandboxRunnerAgentInfo: AgentFunctionInfo = {
  name: "sandboxRunnerAgent",
  agent: sandboxRunnerAgent,
  mock: sandboxRunnerAgent,
  inputs: {},
  output: {},
  params: {},
  outputFormat: {},
  samples: [],
  description: "Executes user-provided JavaScript/TypeScript inside a sandboxed worker with timeouts and dependency controls.",
  category: ["runtime"],
  author: "Receptron team",
  repository: "https://github.com/receptron/graphai",
  license: "MIT",
  stream: false,
  npms: ["typescript"],
  environmentVariables: [],
};

export default sandboxRunnerAgentInfo;
