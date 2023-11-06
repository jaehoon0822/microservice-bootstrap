import app from "./app";

const main = () => {
  const port = app.get("PORT");
  app.listen(port, () => {
    console.log(`${port} 에서 작동중입니다.`);
  });
};

main();
