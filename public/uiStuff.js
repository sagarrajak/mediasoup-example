// UI buttons
const connectButton = document.getElementById("connect");
const deviceButton = document.getElementById("device");
const createProdButton = document.getElementById("create-producer");
const publishButton = document.getElementById("publish");
const createConsButton = document.getElementById("create-consumer");
const consumeButton = document.getElementById("consume");
const disconnectButton = document.getElementById("disconnect");
// other elements
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

let socket = null,
  device = null,
  localStream = null,
  producerTransport = null,
  producer = null;

// socket is connect
function addSocketEventListener() {
  if (!socket) {
    console.error("You fucked up, socket not connected!");
    return;
  }
  socket.on("connect", () => {
    console.log("connected to the socket");
    // not we can moved to next step
    connectButton.innerHTML = "connected";
    connectButton.disabled = false;

    // enabled the device button
    deviceButton.disabled = false;
  });
}

function initConnect() {
  console.log("initConnect called");
  socket = io("https://localhost:3030");
  connectButton.innerHTML = "Conneting....";
  connectButton.disabled = true;
  // your code here
  addSocketEventListener();
}

async function deviceSetup() {
  console.log("deviceSetup called");
  // your code here
  device = new mediasoupClient.Device();
  const routerRtp = await socket.emitWithAck("getRtpCap");
  console.log("router rtp capability", routerRtp);
  await device.load({ routerRtpCapabilities: routerRtp });
  console.log(device.loaded);
  if (device.loaded) {
    deviceButton.disabled = true;
    createProdButton.disabled = false;
  } else {
    alert("rtp handshake failed");
  }
}

async function createProducer() {
  console.log("createProducer called");
  // get live audio and video feed
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
    const data = await socket.emitWithAck("create-producer-transport");
    // ASK for singnaling part for transport interfomation
    console.log(data);
    if (!data || Object.keys(data).length <= 0) {
      console.log(data);
      console.log("server tranport failed");
      return;
    }

    const transport = device.createSendTransport({
      id: data.id,
      iceParameters: data.iceParameters,
      iceCandidates: data.iceCandidate,
      dtlsParameters: data.dtlcParameter,
    });
    producerTransport = transport;
  } catch (err) {
    console.log("some error");
    console.log(err);
  }

  producerTransport.on(
    "connect",
    async ({ dtlsParameters }, callback, errback) => {
      // connect come with dtls paramer , we need to send this to backend
        const resposne = await socket.emitWithAck("connect-transport-event", {
          dtlsParameters
        });
        //calling callback simply lets the app know that the server successd in connecting 
        //so trigger the producer event
        console.log(resposne)
        if (resposne === 'success') {
          callback();
        } else {
           //calling callback simply lets the app know that the server successd in connecting 
          //so trigger the producer event
          errback();
        }
    }
  );

  producerTransport.on("produce", async (parameters, callback, errback) => {
    try {
      const { id, type } = await socket.emitWithAck("producer-event", {
        kind: parameters.kind,
        rtpParameters: parameters.rtpParameters,
        transportId: producerTransport.id, // Optional, but good practice
      });

      console.log("client producer id", id);
      if (type === "success") {
        // The callback must be called with the server-side Producer ID
        callback({ id });
        publishButton.disabled = true
        createConsButton.disabled = false
      }
    } catch (error) {
      console.error("Error during 'produce' signaling:", error);
      errback();
    }
  });
  createProdButton.disabled = true;
  publishButton.disabled = false;
}

async function publish() {
  console.log("publish called");
  const track = localStream.getTracks()[0];
  console.log(track);
  try {
    const producer = await producerTransport.produce({
      track
    });
  } catch (err) {
    console.error(err);
  }
}

function createConsume() {
  console.log("createConsume called");
  // your code here
}

function consume() {
  console.log("consume called");
  // your code here
}

function disconnect() {
  console.log("disconnect called");
  // your code here
}

// button listeners
connectButton.addEventListener("click", initConnect);
deviceButton.addEventListener("click", deviceSetup);
createProdButton.addEventListener("click", createProducer);
publishButton.addEventListener("click", publish);
createConsButton.addEventListener("click", createConsume);
consumeButton.addEventListener("click", consume);
disconnectButton.addEventListener("click", disconnect);
