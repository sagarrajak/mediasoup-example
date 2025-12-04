import express from "express";
import fs from "fs";
import https from "https";
import { AppData, Router, Worker } from "mediasoup/types";
import { Server } from "socket.io";
import Config from "./config.js";
import createWorkerHelper from "./createWorkerHelper.js";

const app = express();
app.use(express.static("public"));

const key = fs.readFileSync("config/cert.key");
const cert = fs.readFileSync("config/cert.crt");

const options = { key, cert };

const httpsServer = https.createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: `https://localhost:${Config.port}`,
    credentials: true,
  },
});

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/H264",
    clockRate: 90000,
    parameters: {
      "packetization-mode": 1,
      "profile-level-id": "42e01f",
      "level-asymmetry-allowed": 1,
    },
  },
];



let workers: Worker<AppData>[] | null = null;
let router: Router<AppData> | undefined = undefined;


io.on("connect", (socket) => {
  console.log("socket just connected");
  socket.on("getRtpCap", (cb) => {
    // cb is callack to send data
    console.log(router)
    cb(router?.rtpCapabilities);
  });
});


// Make mediusoup configuration ready
const initMediaSoup = async () => {
  workers = await createWorkerHelper();
  router = await workers[0]?.createRouter({ mediaCodecs: mediaCodecs as any });
};

initMediaSoup().then(() => {
  httpsServer.listen(Config.port, () => {
    console.log("server started...");
  });
});
