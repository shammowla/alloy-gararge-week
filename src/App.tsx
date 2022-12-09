import React, { useState } from "react";
import { Form, Formik } from "formik";
import { CheckboxGroup, TextField, Checkbox } from "@adobe/react-spectrum";
import { AlloyBuildConfig, BundlerResult } from "../sharedTypes/";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import atomDark from "react-syntax-highlighter/dist/esm/styles/prism/atom-dark";
import JSZip from "jszip";
import FileSaver from "file-saver";

SyntaxHighlighter.registerLanguage("javascript", js);
const JS_ENTRY_POINT_FILENAME = "index.js";

async function downloadBundlerResults(
  results: BundlerSuccessResult
): Promise<void> {
  const zip = new JSZip();
  results.chunks.forEach((chunk, index) => {
    const filePath =
      index === 0 && chunk.name === JS_ENTRY_POINT_FILENAME
        ? chunk.name
        : "alloy/" + chunk.name;
    zip.file(filePath, chunk.code);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(zipBlob, "alloy-build.zip");
}

function writeAlloyConfigScript(configuration: AlloyBuildConfig): BundlerChunk {
  const code = `import { createInstance } from "./alloy/src/index.js"

const alloy = createInstance();
alloy.configure({
  orgId: "${configuration.orgId}",
  edgeConfigId: "${configuration.edgeConfigId}",
  components: ${JSON.stringify(configuration.includedComponents, null, 4)}
});
export default alloy;
`;

  return {
    name: JS_ENTRY_POINT_FILENAME,
    code,
  };
}

function App() {
  const initialValues: AlloyBuildConfig = {
    orgId: "",
    edgeConfigId: "",
    includedComponents: [],
    minify: false,
  };
  const [serverResponse, setServerResponse] = useState<BundlerResult | null>();
  const onSubmit = async (values: AlloyBuildConfig, { setSubmitting }: any) => {
    const response = await fetch("/build", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    setSubmitting(false);
    const result = (await response.json()) as BundlerResult;
    if (result.success) {
      result.chunks = [writeAlloyConfigScript(values), ...result.chunks];
    }
    setServerResponse(result);
  };

  const onDownloadClicked = () => {
    if (serverResponse?.success) {
      downloadBundlerResults(serverResponse);
    } else {
      // do nothing, not a successfully generated bundle
    }
  };

  let ServerResponse;
  if (serverResponse != null) {
    if (!serverResponse.success) {
      ServerResponse = (
        <>
          <p>Failed to Alloy. Took {serverResponse.elapsedTime}ms.</p>
          <p>{serverResponse.message}</p>
        </>
      );
    } else {
      ServerResponse = (
        <>
          <p>Succeeded building Alloy. Took {serverResponse.elapsedTime}ms.</p>
          {serverResponse.chunks.map((c) => (
            <>
              <h3>{c.name}</h3>
              <SyntaxHighlighter
                language="javascript"
                showLineNumbers={true}
                style={atomDark}
                customStyle={{ maxWidth: "90ch", maxHeight: "600px" }}
              >
                {c.code}
              </SyntaxHighlighter>
            </>
          ))}
        </>
      );
    }
  }

  return (
    <div>
      <header>
        <h1>⚒ The Alloy Forge</h1>
        <p>
          For Adobe Garage Week 2022. Create custom ES Module builds of Alloy.
        </p>
      </header>
      <main>
        <section>
          <h2>Configure</h2>
          <Formik initialValues={{ ...initialValues }} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <div>
                  <label htmlFor="orgId">Organization ID</label>
                  <TextField
                    type="text"
                    name="orgId"
                    id="orgId"
                    placeholder="ADB3LETTERSANDNUMBERS@AdobeOrg"
                  />
                </div>
                <div>
                  <label htmlFor="edgeConfigId">Edge Configuration ID</label>
                  <TextField
                    type="text"
                    name="edgeConfigId"
                    id="edgeConfigId"
                    placeholder="ebebf826-a01f-4458-8cec-ef61de241c93"
                  />
                </div>
                <div id="checkbox-group">Included Components</div>
                <CheckboxGroup label="Included Components">
                  <Checkbox value="ActivityCollector">
                    ActivityCollector
                  </Checkbox>
                  <Checkbox value="Audiences">Audiences</Checkbox>
                  <Checkbox value="Context">Context</Checkbox>
                  <Checkbox value="DataCollector">DataCollector</Checkbox>
                  <Checkbox value="EventMerge">EventMerge</Checkbox>
                  <Checkbox value="Identity">Identity</Checkbox>
                  <Checkbox value="Context">LibraryInfo</Checkbox>
                  <Checkbox value="DataCollector">MachineLearning</Checkbox>
                  <Checkbox value="EventMerge">Personalization</Checkbox>
                  <Checkbox value="Identity">Privacy</Checkbox>
                </CheckboxGroup>
                <div>
                  <label htmlFor="minify">Minify?</label>
                  <TextField
                    type="checkbox"
                    name="minify"
                    id="minify"
                  ></TextField>
                </div>
                <div>
                  <button type="submit" disabled={isSubmitting}>
                    ⚒ Build
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
        {serverResponse != null && (
          <>
            <p>
              <button onClick={onDownloadClicked}>💾 Download</button>
            </p>
            <section>
              <h2>Result</h2>
              {ServerResponse}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
