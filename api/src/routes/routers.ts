import express from "express";
import matchesRouter from "./matches/index";
import mediaRouter from "./media/index";

const app = express();

app.use(express.json());
app.use("/matches", matchesRouter);
app.use("/", mediaRouter);

export default app;
