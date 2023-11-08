import fs from "fs";
import path from "path";
import { Request, Response, Router } from "express";
import createChannel from "../utils/createChannel";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const filePath = path.resolve(
    __dirname,
    "../../videos/SampleVideo_1280x720_1mb.mp4"
  );
  const messageChannel = await createChannel();

  fs.stat(filePath, async (err, stats) => {
    if (err) {
      console.error("An error occurred");
      res.sendStatus(500);
      return;
    }
    const msg = {
      videoPath: filePath,
    };
    const jsonMsg = JSON.stringify(msg);
    res.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": "video/mp4",
    });
    fs.createReadStream(filePath).pipe(res);
    // messageChannel 에 등록되어있는 `viewed queue` 에
    // filePath Buffer message 를 전달한다.
    // 첫번째 인자값이 "" 인 이유는 `default exchange` 로
    // `message` 를 보내기 때문이다.
    //
    // https://amqp-node.github.io/amqplib/channel_api.html#channel_publish
    //
    messageChannel.publish("", "viewed", Buffer.from(jsonMsg));
  });
});

export { router as VideoRouter };
