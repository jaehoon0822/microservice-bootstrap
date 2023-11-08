import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { VideoRouter } from "./router/video";

dotenv.config({
  path: ".env.local",
});
const app = express();

if (!process.env.PORT) {
  throw new Error("환경변수를 찾을수 없습니다.");
}

const port = process.env.PORT;

app.get("/", (_req: Request, res: Response) => {
  res.send("hello world");
});

app.use("/video", VideoRouter);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
