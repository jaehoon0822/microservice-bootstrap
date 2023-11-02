import express, { Request, Response } from "express";

const app = express();
const port = 8080;

app.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});

app.listen(port, () => console.log(`Example app listening on port${port}!`));
