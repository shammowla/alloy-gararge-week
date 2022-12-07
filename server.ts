/// <reference types="express">
import express, { Request, Response } from "express";
import AlloyBuildConfig from "./shared/AlloyBuildConfig";
const app = express();
const port = 3001;
app.use(express.static("build"));
app.use(express.json());

async function makeCustomBuild(
  configuration: AlloyBuildConfig
): Promise<void> {}

app.get("/", (req: Request, res: Response) => {
  res.redirect("/index.html");
});

app.post("/build", async (req: Request, res: Response) => {
  const configuration = req.body as AlloyBuildConfig;
  await makeCustomBuild(configuration);
  res.send("Done making custom build");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
