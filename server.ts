/// <reference types="express">
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import express, { Request, Response } from "express";
import { rename, rm, writeFile } from "node:fs/promises";
import { TextEncoder } from "node:util";
import {
  InputOptions,
  OutputChunk,
  OutputOptions,
  rollup,
  RollupBuild,
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

function generateComponentCreatorsJS(configuration: AlloyBuildConfig): string {
  const includedComponents = new Set(configuration.includedComponents);
  const importStatements: string[] = [];
  const exportedVariableNames: string[] = [];

  if (includedComponents.has("ActivityCollector")) {
    importStatements.push(
      `import createDataCollector from "../components/DataCollector";`
    );
    exportedVariableNames.push("createDataCollector");
  }
  if (includedComponents.has("Audiences")) {
    importStatements.push(
      `import createActivityCollector from "../components/ActivityCollector";`
    );
    exportedVariableNames.push("createActivityCollector");
  }
  if (includedComponents.has("Context")) {
    importStatements.push(
      `import createIdentity from "../components/Identity";`
    );
    exportedVariableNames.push("createIdentity");
  }
  if (includedComponents.has("DataCollector")) {
    importStatements.push(
      `import createAudiences from "../components/Audiences";`
    );
    exportedVariableNames.push("createAudiences");
  }
  if (includedComponents.has("EventMerge")) {
    importStatements.push(
      `import createPersonalization from "../components/Personalization";`
    );
    exportedVariableNames.push("createPersonalization");
  }
  if (includedComponents.has("Identity")) {
    importStatements.push(`import createContext from "../components/Context";`);
    exportedVariableNames.push("createContext");
  }
  if (includedComponents.has("LibraryInfo")) {
    importStatements.push(`import createPrivacy from "../components/Privacy";`);
    exportedVariableNames.push("createPrivacy");
  }
  if (includedComponents.has("MachineLearning")) {
    importStatements.push(
      `import createEventMerge from "../components/EventMerge";`
    );
    exportedVariableNames.push("createEventMerge");
  }
  if (includedComponents.has("Personalization")) {
    importStatements.push(
      `import createLibraryInfo from "../components/LibraryInfo";`
    );
    exportedVariableNames.push("createLibraryInfo");
  }
  if (includedComponents.has("Privacy")) {
    importStatements.push(
      `import createMachineLearning from "../components/MachineLearning";`
    );
    exportedVariableNames.push("createMachineLearning");
  }

  return `${importStatements.join("\n")}
export default [${exportedVariableNames.join(", ")}];`;
}

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
  const componentCreatorsFilePath = "./alloy/src/core/componentCreators.js";
  const backupComponentCreatorsFilePath = `${componentCreatorsFilePath}.original`;
  try {
    // Delete alloy/src/core/componentCreators.js
    await rename(componentCreatorsFilePath, backupComponentCreatorsFilePath);
    // generate new one
    // save the file
    await writeFile(
      componentCreatorsFilePath,
      generateComponentCreatorsJS(configuration)
    );
    logInfo(
      `Created ${componentCreatorsFilePath} with components ${configuration.includedComponents
        .sort()
        .join(", ")}`
    );

    bundle = await rollup(rollupInputOptions);
    const chunks = await generateOutputs(configuration, bundle);

    return {
      success: true,
      elapsedTime: performance.now() - start,
      chunks,
    };
  } catch (err) {
    const message = `Failed code generation & rollup build: ${err}`;
    logError(message, err);
    return {
      success: false,
      elapsedTime: performance.now() - start,
      message,
    };
  } finally {
    await rm(componentCreatorsFilePath, { force: true });
    await rename(backupComponentCreatorsFilePath, componentCreatorsFilePath);
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
  };
  if (configuration.minify) {
    rollupOutputOptions.plugins = [
      ...(rollupOutputOptions.plugins ?? []),
      terser(),
    ];
  }
  const start = performance.now();
  const { output } = await bundle.generate(rollupOutputOptions);
  const encoder = new TextEncoder();
  const chunks = output
    .filter((c): c is OutputChunk => c.type === "chunk")
    .map((c) => ({
      name: `${c.fileName}`,
      code: `${c.code}`,
      size: encoder.encode(c.code).byteLength,
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
