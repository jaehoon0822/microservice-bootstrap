import createChannel from "./createChannel";
import { getCollection } from "./getClient";

const bootstrap = async (app: Express.Application) => {
  try {
    // DB 이름
    const dbName = process.env.DBNAME!;
    // rabbitMQ message Channel 생성
    const messageChannel = await createChannel();

    // db 상의 collection 가져옴
    const { client, collection } = await getCollection({
      dbName,
      collectionName: "videos",
    });

    // 해당 Channel 의 `Queue` (assert)확보
    // --> default exchange 사용
    await messageChannel.assertQueue("viewed");

    // `viwed` 메시지 소비 함수
    await messageChannel.consume("viewed", async (msg) => {
      try {
        console.log("Received a 'viewed' message");
        if (!msg) {
          throw new Error("메시지가 없습니다.");
        }
        // 받은 `message` JSON 으로 parse
        const parsedMsg = JSON.parse(msg.content.toString());
        console.log(parsedMsg.videoPath);
        // collection 에 `videoPath` insert
        await collection.insertOne({ videoPath: parsedMsg.videoPath });
        // queue 에 있는 `messgae` Acknowledged
        messageChannel.ack(msg);

        await client.close();
      } catch (error) {
        if (error instanceof Error) console.error(error.message);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
};

export default bootstrap;
