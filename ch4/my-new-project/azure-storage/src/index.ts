import express, { Request, Response } from "express";
import "./utils/env";
import createContainerClient from "./utils/createContainerClient";

const PORT = process.env.PORT;
const app = express();

app.get("/video", async (req: Request, res: Response) => {
  const containerName = "videos";
  const videoPath = req.query.path as string;
  const containerClient = createContainerClient({ containerName });
  const blobClient = containerClient.getBlobClient(videoPath);
  const blockBlobClient = blobClient.getBlockBlobClient();

  const blobResponse = await blockBlobClient.download(0);
  res.writeHead(200, {
    "Content-Type": blobResponse.contentType,
    "content-length": blobResponse.contentLength,
  });
  blobResponse.readableStreamBody?.pipe(res);
});

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
