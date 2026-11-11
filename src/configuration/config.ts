import dotenv from "dotenv";

dotenv.config();

export const config = {
  APP_PORT: Number(process.env.APP_PORT),
  APP_HOST: String(process.env.APP_HOST),

  DATABASE_URL: String(process.env.DATABASE_URL),
};
