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
   let transport: any = null,
   producer: any = null;

  console.log("socket just connected");
  
  socket.on("getRtpCap", (cb) => {
      // cb is callack to send data
      console.log(router)
      cb(router?.rtpCapabilities);
  });

   socket.on("create-producer-transport", async (ack) => {
    // create transportt
    transport = await router?.createWebRtcTransport({
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      listenInfos: [
        {
          protocol: "udp",
          ip: "127.0.0.1",
        },
        {
          protocol: "tcp",
          ip: "127.0.0.1",
        },
      ],
    });

    if (transport == undefined) {
      ack({});
      return
    }

    const config = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidate: transport.iceCandidates,
      dtlcParameter: transport.dtlsParameters
    };
    ack(config)
  });

  socket.on("connect-transport-event",async (dltsParameter, ack) => {
    console.log("conection transport event")
    console.log(dltsParameter);
    console.log("get the dtls info from client and finish the transport");
    try {
      console.log(JSON.parse(JSON.stringify(dltsParameter.dtlsParameters)))
      await transport?.connect({dtlsParameters: dltsParameter.dtlsParameters})
      ack("success");
    } catch(err) {
      ack("error");
      console.log(err);
    }
  });


  socket.on("producer-event", async (payload, ack) => {
    const { kind, rtpParameters, transportId } = payload;
    console.log("got producer event", payload);
    try {
      producer = await  transport?.produce({
        kind,
        rtpParameters,
      });
      console.log(producer);
      ack({ id: producer.id, type: "success" });
    } catch (err) {
      ack({ type: "error" });
      console.error(err);
    }
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
