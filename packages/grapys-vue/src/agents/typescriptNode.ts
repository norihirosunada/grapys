import { AgentFunction, AgentFunctionInfo } from "graphai";
import ts from "typescript";

const sanitizeParams = (params: Record<string, unknown> | undefined) => {
  if (!params) return {} as Record<string, unknown>;
  return Object.keys(params).reduce<Record<string, unknown>>((clean, key) => {
    const value = params[key];
    if (typeof value === "function") return clean;
    clean[key] = value;
    return clean;
  }, {});
};

const transpile = (source: string) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  });
  return transpiled.outputText;
};

type SandboxResult = { result: unknown; logs: unknown[] };

const executeInSandbox = async (code: string, inputs: Record<string, unknown>, params: Record<string, unknown>) => {
  const consoleLogs: unknown[] = [];
  const sandboxConsole = {
    log: (...args: unknown[]) => {
      consoleLogs.push(args.length === 1 ? args[0] : args);
    },
  };

  const sandbox = {
    console: sandboxConsole,
    inputs,
    params,
    exports: {} as Record<string, unknown>,
    module: { exports: {} as unknown },
  } as const;

  const AsyncFunction = Object.getPrototypeOf(async function () {
    /* empty */
  }).constructor as new (arg1: string, arg2: string) => (...args: unknown[]) => Promise<unknown>;

  const runner = new AsyncFunction(
    "sandbox",
    "\"use strict\";" +
      "const globalThis = undefined;" +
      "const window = undefined;" +
      "const document = undefined;" +
      "const process = undefined;" +
      "const require = undefined;" +
      "const Function = undefined;" +
      "const { console, inputs, params, exports, module } = sandbox;" +
      code +
      "\nconst defaultExport = (module && (module as any).exports && (module as any).exports.default) || (exports as any).default;" +
      "if (typeof (module as any).exports === 'function') { return await (module as any).exports(inputs, params); }" +
      "if (typeof defaultExport === 'function') { return await defaultExport(inputs, params); }" +
      "if (typeof (module as any).exports !== 'undefined') { return (module as any).exports; }" +
      "return (exports as any).default;",
  );

  const result = await runner(sandbox);

  return { result, logs: consoleLogs } as SandboxResult;
};

export const typescriptNodeAgent: AgentFunction = async ({ params, namedInputs }) => {
  const code = (params?.code as string | undefined)?.trim();
  if (!code) {
    throw new Error("Parameter 'code' is required for typescriptNodeAgent.");
  }

  if (/\bimport\s+|\brequire\s*\(/.test(code)) {
    throw new Error("Module imports are not allowed inside the TypeScript node.");
  }

  const compiled = transpile(code);
  const safeParams = sanitizeParams(params as Record<string, unknown> | undefined);
  const resolvedInputs = (namedInputs as Record<string, unknown>) ?? {};

  return executeInSandbox(compiled, resolvedInputs, safeParams);
};

const typescriptNodeAgentInfo: AgentFunctionInfo = {
  name: "typescriptNodeAgent",
  agent: typescriptNodeAgent,
  mock: typescriptNodeAgent,
  inputs: {},
  output: {},
  params: {},
  outputFormat: {},
  samples: [],
  description: "Executes user-provided TypeScript in an isolated sandbox.",
  category: ["utility"],
  author: "Receptron team",
  repository: "https://github.com/receptron/graphai",
  license: "MIT",
};

export default typescriptNodeAgentInfo;
