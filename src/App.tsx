import React, { useState } from "react";
import { Form, Formik, Field } from "formik";
import {
  AlloyBuildConfig,
  BundlerChunk,
  BundlerResult,
  BundlerSuccessResult,
} from "../sharedTypes/";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import atomDark from "react-syntax-highlighter/dist/esm/styles/prism/atom-dark";
import JSZip from "jszip";
import FileSaver from "file-saver";

SyntaxHighlighter.registerLanguage("javascript", js);

async function downloadBundlerResults(
  results: BundlerSuccessResult
): Promise<void> {
  const zip = new JSZip();
  for (const chunk of results.chunks) {
    zip.file(chunk.name, chunk.code);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(zipBlob, "differential-alloy-build.zip");
}

function writeAlloyConfigScript(configuration: AlloyBuildConfig): BundlerChunk {
  const code = `import { createInstance } from "./src/index.js"

const alloy = createInstance({
  orgId: "${configuration.orgId}",
  edgeConfigId: "${configuration.edgeConfigId}",
  components: ${JSON.stringify(configuration.includedComponents, null, 4)}
});
`;

  return {
    name: "index.js",
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
                  <Field
                    type="text"
                    name="orgId"
                    id="orgId"
                    placeholder="ADB3LETTERSANDNUMBERS@AdobeOrg"
                  />
                </div>
                <div>
                  <label htmlFor="edgeConfigId">Edge Configuration ID</label>
                  <Field
                    type="text"
                    name="edgeConfigId"
                    id="edgeConfigId"
                    placeholder="ebebf826-a01f-4458-8cec-ef61de241c93"
                  />
                </div>
                <div id="checkbox-group">Included Components</div>
                <ul role="group" aria-labelledby="checkbox-group">
                  <li>
                    <label>
                      ActivityCollector
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="ActivityCollector"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      Audiences
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="Audiences"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      Context
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="Context"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      DataCollector
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="DataCollector"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      EventMerge
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="EventMerge"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      Identity
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="Identity"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      LibraryInfo
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="LibraryInfo"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      MachineLearning
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="MachineLearning"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      Personalization
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="Personalization"
                      ></Field>
                    </label>
                  </li>
                  <li>
                    <label>
                      Privacy
                      <Field
                        type="checkbox"
                        name="includedComponents"
                        value="Privacy"
                      ></Field>
                    </label>
                  </li>
                </ul>
                <div>
                  <label htmlFor="minify">Minify?</label>
                  <Field type="checkbox" name="minify" id="minify"></Field>
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
