import { ObjectId } from "mongodb";
import express, { Request, Response } from "express";
import http from "http";
import "./utils/env";
import getClient from "./utils/getClient";

const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT;
const DBNAME = process.env.DBNAME || "";
const app = express();

const videoHandler = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    // req.query 에서 id 가져오기
    const queryId = req.query.id as string;
    // videoCollection 가져오기
    const db = client!.db(DBNAME);
    const videosCollection = db.collection("videos");
    // req.query.id 를 ObjectId 화 시켜 저장
    if (!videosCollection) {
      res.sendStatus(404);
      return;
    }
    const videoId = new ObjectId(queryId);

    const video = await videosCollection.findOne({ _id: videoId });

    if (!video) {
      res.sendStatus(404);
      return;
    }

    const requestOption: http.RequestOptions = {
      host: VIDEO_STORAGE_HOST,
      port: VIDEO_STORAGE_PORT,
      path: `/video?path=${video.videoPath}`,
      method: "GET",
      headers: req.headers,
    };
    const forwardRequest = http.request(requestOption, (forwardRes) => {
      res.writeHead(forwardRes.statusCode as number, forwardRes.headers);
      forwardRes.pipe(res);
      client?.close();
    });

    req.pipe(forwardRequest);
  } catch (error) {
    if (error instanceof Error) {
      console.error((error && error.stack) || error);
    }
  }
};

app.get("/video", videoHandler);

export default app;
