import express from "express";
import fs from "fs";
import https from "https";
import { AppData, Consumer, Router, Worker } from "mediasoup/types";
import { Server } from "socket.io";
import Config from "./config.js";
import createWorkerHelper from "./createWorkerHelper.js";
import { createWebrtcTransport } from "./createTransport.js";

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
    mimeType: "video/VP8", // <--- ADD THIS SAFEST CODEC
    clockRate: 90000,
  }
];

type TransportTypeWithUndifined = Awaited<ReturnType<typeof createWebrtcTransport>>
type TransportType = Exclude<TransportTypeWithUndifined, undefined>;


let workers: Worker<AppData>[] | null = null;
let router: Router<AppData> | undefined = undefined;

io.on("connect", (socket) => {
  let clientProducerTransport: any = null,
    clientProducer: any = null,
    clientConsumerTransport: TransportTypeWithUndifined = undefined,
    clientConsumer: Consumer<AppData> | undefined = undefined;


  console.log("socket just connected");

  socket.on("getRtpCap", (cb) => {
    // cb is callack to send data
    console.log(router);
    cb(router?.rtpCapabilities);
  });

  socket.on("create-producer-transport", async (ack) => {
    // create transportt
    clientProducerTransport = await createWebrtcTransport(router);
    if (clientProducerTransport == undefined) {
      ack({});
      return;
    }
    const config = {
      id: clientProducerTransport.id,
      iceParameters: clientProducerTransport.iceParameters,
      iceCandidate: clientProducerTransport.iceCandidates,
      dtlcParameter: clientProducerTransport.dtlsParameters,
    };
    ack(config);
  });

   socket.on("create-consumer-transport", async (ack) => {
     // create transportt
     clientConsumerTransport = await createWebrtcTransport(router);
     if (clientConsumerTransport == undefined) {
       ack({});
       return;
     }
     const config = {
       id: clientConsumerTransport.id,
       iceParameters: clientConsumerTransport.iceParameters,
       iceCandidate: clientConsumerTransport.iceCandidates,
       dtlcParameter: clientConsumerTransport.dtlsParameters,
     };
     ack(config);
   });

  socket.on("connect-transport-producer-event", async (dltsParameter, ack) => {
    console.log("conection transport event");
    console.log(dltsParameter);
    console.log("get the dtls info from client and finish the transport");
    try {
      console.log(JSON.parse(JSON.stringify(dltsParameter.dtlsParameters)));
      await clientProducerTransport?.connect({
        dtlsParameters: dltsParameter.dtlsParameters,
      });
      ack("success");
    } catch (err) {
      ack("error");
      console.log(err);
    }
  });

 socket.on("connect-transport-receiver-event", async (dltsParameter, ack) => {
    console.log("conection transport event");
    console.log(dltsParameter);
    console.log("get the dtls info from client and finish the transport");
    try {
      console.log(JSON.parse(JSON.stringify(dltsParameter.dtlsParameters)));
      await clientConsumerTransport?.connect({
        dtlsParameters: dltsParameter.dtlsParameters,
      });
      ack("success");
    } catch (err) {
      ack("error");
      console.log(err);
    }
  });

  socket.on("producer-event", async (payload, ack) => {
    const { kind, rtpParameters, transportId } = payload;
    console.log("got producer event", payload);
    try {
      clientProducer = await clientProducerTransport?.produce({
        kind,
        rtpParameters,
      });
      console.log(clientProducer);
      ack({ id: clientProducer.id, type: "success" });
    } catch (err) {
      ack({ type: "error" });
      console.error(err);
    }
  });

  socket.on("consume-media",async (payload, ack) => {
    if (!clientProducerTransport) return ack("noTransport");
    if (
      !router?.canConsume({
        rtpCapabilities: payload.rtpCapabilities,
        producerId: clientProducer.id,
      })
    ) {
      return ack("cantConsume");
    }
    clientConsumer = await clientConsumerTransport?.consume({
      producerId: clientProducer.id,
      rtpCapabilities: payload.rtpCapabilities,
      paused: true,
    });
    const consumerParams = {
      producerId: clientProducer.id,
      id: clientConsumer?.id,
      rtpParameters: clientConsumer?.rtpParameters,
      kind: clientConsumer?.kind,
    };
    ack(consumerParams);
  });


  socket.on("unpuaseConsumer", async (ack) => {
      console.log("unpaused consumer");
      await  clientConsumer?.resume();
      return ack();
  })
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
