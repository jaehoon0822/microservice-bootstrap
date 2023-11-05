import app from "./app";
import getClient from "./utils/getClient";
import setTryCatch from "./utils/setTryCatch";

const PORT = process.env.PORT;

const main = async () => {
  await getClient();
  app.listen(PORT, () => {
    console.log(`이 서버는 포트 ${PORT} 에서 작동합니다!`);
  });
};

setTryCatch({ fn: main });
