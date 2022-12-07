import React, { useState } from "react";
import { Form, Formik, Field } from "formik";
import { AlloyBuildConfig } from "../sharedTypes/";

function App() {
  const initialValues: AlloyBuildConfig = {
    orgId: "",
    edgeConfigId: "",
    includedComponents: [],
  };
  const [serverResponse, setServerResponse] = useState("{}");
  const onSubmit = async (values: AlloyBuildConfig, { setSubmitting }: any) => {
    const response = await fetch("/build", {
      method: "POST",
      body: values as any,
    });

    setSubmitting(false);
    // format the server response
    const result = await response.json();
    setServerResponse(JSON.stringify(result, null, 2));
  };

  return (
    <div>
      <header>
        <h1>Alloy Garage Week: Alloy Custom Builds</h1>
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
                  <button type="submit" disabled={isSubmitting}>
                    Build
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
        <section>
          <h2>Result</h2>
          <div>
            <pre>
              <code>{serverResponse}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
