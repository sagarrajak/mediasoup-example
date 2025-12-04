import fs from "fs";
import https from "https";
import express from "express";
import { Server } from "socket.io";
import mediasoup from "mediasoup";
import createWorkerHelper from "./createWorkerHelper";

const app = express();
app.use(express.static("public"));

const key = fs.readFileSync("config/cert.key");
const cert = fs.readFileSync("config/cert.crt");

const options = { key, cert };

const httpsServer = https.createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: "https://localhost:3030",
    credentials: true,
  },
});

let workers = null;

// Make mediusoup configuration ready
const initMediaSoup = async () => {
  workers = await createWorkerHelper();
};

initMediaSoup();

httpsServer.listen(3030);
