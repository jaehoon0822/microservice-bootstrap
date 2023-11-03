import path from "path";
import fs from "fs";
import express, { Request, Response } from "express";

const app = express();
const port = 8080;

app.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});

app.get("/video", (req: Request, res: Response) => {
  const filePath = path.resolve(
    __dirname,
    "./videos/SampleVideo_1280x720_1mb.mp4"
  );

  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("An error occurred");
      res.sendStatus(500);
      return;
    }
    res.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

app.listen(port, () => console.log(`Example app listening on port${port}!`));
