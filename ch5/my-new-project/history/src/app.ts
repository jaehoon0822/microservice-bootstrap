import express from "express";

const app = express();

app.set("PORT", process.env.PORT || 3000);
app.use(express.json());
app.get("/", (req, res) => {
  res.send("history");
});

export default app;
