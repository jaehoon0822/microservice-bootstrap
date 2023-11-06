import express from "express";
import viewedRouter from "./router/viewed";

const app = express();

app.set("PORT", process.env.PORT || 3000);
app.use(viewedRouter);

export default app;
