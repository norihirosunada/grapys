import { AgentFunction, AgentFunctionInfo } from "graphai";
import * as ts from "typescript";

const buildWorkerSource = (dependencies: string[]) => {
  const imports = dependencies.map((dep) => `importScripts(${JSON.stringify(dep)});`).join("\n");

  return `
${imports}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
self.onmessage = async (event) => {
  const { code, inputs } = event.data;
  const logs = [];
  const stringify = (value) => {
    try {
      if (typeof value === "string") {
        return value;
      }
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  };
  const sandboxConsole = {
    log: (...args) => logs.push(args.map(stringify).join(" ")),
    warn: (...args) => logs.push(args.map(stringify).join(" ")),
    error: (...args) => logs.push(args.map(stringify).join(" ")),
  };
  try {
    const runner = new AsyncFunction("inputs", "console", "\"use strict\";" + code);
    const result = await runner(inputs, sandboxConsole);
    self.postMessage({ result, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ error: message, logs });
  }
};
`;
};

const runInSandbox = async (
  code: string,
  inputs: Record<string, unknown>,
  dependencies: string[],
  timeoutMs: number,
): Promise<{ result: unknown; logs: string[] }> => {
  if (typeof Worker === "undefined") {
    throw new Error("Web Worker is not available in this environment");
  }
  const worker = new Worker(
    URL.createObjectURL(new Blob([buildWorkerSource(dependencies)], { type: "text/javascript" })),
    { name: "code-runner-agent" },
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Code execution exceeded ${timeoutMs}ms`));
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent) => {
      const { result, error, logs = [] } = event.data ?? {};
      clearTimeout(timer);
      worker.terminate();
      if (error) {
        reject(new Error(`${error}${logs.length ? `\nlogs:\n${logs.join("\n")}` : ""}`));
      } else {
        resolve({ result, logs });
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(`Sandbox error: ${event.message}`));
    };

    worker.postMessage({ code, inputs });
  });
};

const transpileSafely = (code: string, language: string | undefined) => {
  if (language === "javascript") {
    return code;
  }
  try {
    const { outputText } = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2019 },
    });
    return outputText;
  } catch (_error) {
    return code;
  }
};

export const codeRunnerAgent: AgentFunction = async ({ namedInputs, params }) => {
  const { code, dependencies, timeoutMs = 5000, language = "typescript" } = params ?? {};

  if (!code || typeof code !== "string") {
    throw new Error("A code string is required to run the codeRunnerAgent");
  }

  const sanitizedDependencies = Array.isArray(dependencies)
    ? dependencies.filter((dep) => typeof dep === "string" && /^https?:\/\//.test(dep))
    : [];

  const compiledCode = transpileSafely(code, language);
  const inputs = namedInputs ?? {};

  const { result, logs } = await runInSandbox(compiledCode, inputs, sanitizedDependencies, timeoutMs);
  return { result, logs };
};

const codeRunnerAgentInfo: AgentFunctionInfo = {
  name: "codeRunnerAgent",
  agent: codeRunnerAgent,
  mock: codeRunnerAgent,
  inputs: {},
  output: {},
  params: {},
  outputFormat: {},
  samples: [],
  description: "Runs user supplied JavaScript/TypeScript inside a sandboxed worker",
  category: ["service"],
  author: "Receptron team",
  repository: "https://github.com/receptron/graphai",
  license: "MIT",
};

export default codeRunnerAgentInfo;
