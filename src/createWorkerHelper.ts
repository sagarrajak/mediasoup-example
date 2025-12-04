import { createWorker } from 'mediasoup';
import os from 'os';

const cpus = os.cpus.length; //maxium number of allowed workers

type WorkerType = ReturnType<typeof createWorker>;

const createWorkerHelper =  async () => {
    const workers: WorkerType[] = []
    return new Promise((resolve, reject) => {
        for (let i=0; i<(cpus/2); i++) {
            let worker =  createWorker()
            workers.push(worker);
        }
        resolve(Promise.all(workers));
    });
};

export default createWorkerHelper;