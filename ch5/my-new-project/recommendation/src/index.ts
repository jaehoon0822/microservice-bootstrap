import app from "./app";
import bootstrap from "./utils/bootstrap";

const main = () => {
  try {
    const port = app.get("PORT");
    bootstrap(app);
    app.listen(port, () => {
      console.log(`${port} 에서 작동중입니다.`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error((error && error.stack) || error);
    }
  }
};

main();
