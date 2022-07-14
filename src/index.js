import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import routes from "./core/routes.js";
import createSocket from "./core/socket.js";

const app = express();
const server = createServer(app);
const io = createSocket(server);

dotenv.config();

mongoose.connect("mongodb://localhost:27017/chat");

routes(app, io);

server.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
