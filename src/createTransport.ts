import { AppData, Router } from "mediasoup/types";

const createWebrtcTransport = async (router?: Router<AppData>) => {
  if (!router) return undefined;
  const transport = await router?.createWebRtcTransport({
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
  
  return transport;
};

export { createWebrtcTransport };
