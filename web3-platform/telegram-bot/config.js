import dotenv from "dotenv";
dotenv.config();

export default {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  apiBase: process.env.API_BASE_URL,
  redisUrl: process.env.REDIS_URL
};
