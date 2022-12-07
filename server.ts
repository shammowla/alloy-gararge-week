import express from "express";
const app = express();
const port = 3001;
app.use(express.static("build"));
app.use(express.json());

async function makeCustomBuild(configuration: any) {}

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.post("/build", async (req, res) => {
  const configuration = req.body;
  const customBuild = await makeCustomBuild(configuration);
  res.send("Done making custom build");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
