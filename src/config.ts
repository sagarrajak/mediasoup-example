import { WorkerLogLevel, WorkerLogTag } from "mediasoup/types";

type WorkerSettings = {
    logLevel: WorkerLogLevel,
    logTags: WorkerLogTag[],
    rtcMinPort: number,
    rtcMaxPort: number
}

const Config: {
    port: number,
    workerSettings: WorkerSettings
} = {
  port: 3030,
  workerSettings: {
    logLevel: "warn",
    rtcMinPort: 40000,
    rtcMaxPort: 41000,
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      "rtx",
      "bwe",
      "score",
      "simulcast",
      "svc",
      "sctp",
    ],
  },
};

export default Config;

