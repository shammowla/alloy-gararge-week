/// <reference types="express">
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import express, { Request, Response } from "express";
import {
  rollup,
  RollupBuild,
  InputOptions,
  OutputOptions,
  OutputChunk,
} from "rollup";
import { AlloyBuildConfig, BundlerChunk, BundlerResult } from "./sharedTypes";
const app = express();
const port = 3001;
app.use(express.static("build"));
app.use(express.json());

const logError = (message: string, ...args: any[]) => {
  console.error(`[🚨] ${message}`, ...args);
  return [...args];
};

const logInfo = (message: string, ...args: any[]) => {
  console.log(`[✅] ${message}`, ...args);
  return [...args];
};

async function makeCustomBuild(
  configuration: AlloyBuildConfig
): Promise<BundlerResult> {
  let bundle: RollupBuild | null = null;
  const start = performance.now();
  const rollupInputOptions: InputOptions = {
    input: "./alloy/src/index.js",
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        // Support the browser field in dependencies' package.json.
        // Useful for the uuid package.
        mainFields: ["module", "main", "browser"],
      }),
      commonjs(),
    ],
  };
  try {
    bundle = await rollup(rollupInputOptions);
    const chunks = await generateOutputs(configuration, bundle);
    return {
      success: true,
      elapsedTime: performance.now() - start,
      chunks,
    };
  } catch (err) {
    const message = `Failed rollup build: ${err}`;
    logError(message, err);
    return {
      success: false,
      elapsedTime: performance.now() - start,
      message,
    };
  } finally {
    await bundle?.close();
  }
}

async function generateOutputs(
  configuration: AlloyBuildConfig,
  bundle: RollupBuild
): Promise<BundlerChunk[]> {
  const rollupOutputOptions: OutputOptions = {
    plugins: [],
    format: "es",
    compact: true,
    generatedCode: "es2015",
    preserveModules: true,
  };
  if (configuration.minify) {
    rollupOutputOptions.plugins = [
      ...(rollupOutputOptions.plugins ?? []),
      terser(),
    ];
  }
  const start = performance.now();
  const { output } = await bundle.generate(rollupOutputOptions);
  const chunks = output
    .filter((c): c is OutputChunk => c.type === "chunk")
    .map((c) => ({
      name: `${c.fileName}`,
      code: `${c.code}`,
    }));
  logInfo(
    `Generated outputs: ${output.length} results (${chunks.length} chunks, ${
      output.length - chunks.length
    } assets) in ${performance.now() - start}ms.`
  );
  return chunks;
}

app.get("/", (req: Request, res: Response) => {
  res.redirect("/index.html");
});

app.post("/build", async (req: Request, res: Response) => {
  const configuration = req.body;
  const result = await makeCustomBuild(configuration);
  res.send(result);
});

app.listen(port, () => {
  logInfo(`Started server on http://localhost:${port}`);
});
