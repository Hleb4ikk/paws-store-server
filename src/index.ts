import express from "express";
import { config } from "./config.js";

const app = express();

app.listen(config.APP_PORT, config.APP_HOST, (err) => {
  console.log(err);
});
