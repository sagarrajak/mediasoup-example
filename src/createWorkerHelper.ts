import { createWorker } from "mediasoup";
import os from "os";
import Config from "./config.js";

const cpus = os.cpus.length; //maxium number of allowed workers

export type WorkerType = Awaited<ReturnType<typeof createWorker>>;

const createWorkerHelper = () => {
  const workers = Array.from({ length: cpus / 2 }, async () => {
    let worker = await createWorker({
      logLevel: Config.workerSettings.logLevel,
      logTags: Config.workerSettings.logTags,
    });
    worker.on("died", () => {
      console.error("worker diet with unknow reason");
      process.exit(1);
    });
    return worker;
  });

  return Promise.all(workers);
};

export default createWorkerHelper;
