import express from "express";
import dotenv from "dotenv";

import { Endpoints } from "./config";
import { myPostmanRouter, sendRequestRouter } from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use(`/${Endpoints.MY_POSTMAN}`, myPostmanRouter);
app.use(`/${Endpoints.SEND_REQUEST}`, sendRequestRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
