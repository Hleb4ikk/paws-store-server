import { pino } from "pino";

export const logger = pino({
  level: "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: { target: "pino-pretty", options: { colorize: true } },
});
