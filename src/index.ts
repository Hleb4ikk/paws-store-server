import express from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";

const app = express();

app.listen(config.APP_PORT, config.APP_HOST, (err) => {
  if (!err) {
    logger.info(`Server was started on port - ${config.APP_PORT}`);
  } else {
    logger.error(`Error while starting the server - ${err}`);
    process.exit(1);
  }
});
