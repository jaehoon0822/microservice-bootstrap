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

    // Exchange 생성
    await messageChannel.assertExchange("viewed", "fanout");

    // queue 의 이름을 지정하지 않으면 `anonymous queue` 라 부른다.
    // 이때 `anonymous queue` 는 `rabbitMQ`의 고유의 이름을 받는다.
    // 이런 `random` 한 이름을 받은 `queue` 에 `exclusive` 를
    // 사용하면, 해당 서비스가 종료될때, `queue` 역시 사라진다.
    // 메모리 누수없이 사용할때 좋다고 한다.
    //
    // 이는 `notifications` 특성상, 사용할때만 값이 할당될때
    // 좋을 듯 싶다.
    // 즉, 매번 존재할 필요없이 필요할때만 생성해서 쓰면 되는
    // queue 이다.
    //
    // 해당 `queue` 에 `router key` 가 없으니,
    // `queue` 를 받아서, channel  에 bind 해야 한다.
    const { queue } = await messageChannel.assertQueue("", { exclusive: true });

    // `queue` 를 `channel` 에 bind 한다.
    // bindQueue(queue, channel, pattern) 형식이다.
    // viewed channel 은 fanout 형식이므로, 브로드캐스트처럼
    // 연결된 모든 `queue` 에 message 를 보낸다.
    await messageChannel.bindQueue(queue, "viewed", "");
    console.log("bind 되었음");

    // `viwed` 메시지 소비 함수
    await messageChannel.consume(queue, async (msg) => {
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
