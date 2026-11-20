import * as dotenv from "dotenv";

dotenv.config();

export const configuration = {
  server: {
    port: process.env.PORT || 3000,
  },
  token: {
    secret: process.env.TOKEN_SECRET,
    expires: process.env.TOKEN_EXPIRES || "7d",
  },
  frontend: {
    url: (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, ""),
    dir: process.env.FRONT_DIR,
  },
  whatsapp: {
    countryCode: process.env.COUNTRY_CODE || "57",
  },
};
