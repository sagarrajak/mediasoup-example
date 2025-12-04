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

let socket = null, device = null;
// socket is connect
function addSocketEventListener() {
  if (!socket) {
    console.error("You fucked up, socket not connected!");
    return;
  }
  socket.on("connect", () => {
    console.log("connected to the socket");
    // not we can moved to next step
    connectButton.innerHTML = "connected"
    connectButton.disabled = false
    
    // enabled the device button 
    deviceButton.disabled = false;
    device = new mediasoupClient.Device({ handlerName: "Chrome67" });
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

function deviceSetup() {
  console.log("deviceSetup called");
  // your code here
  
}

function createProducer() {
  console.log("createProducer called");
  // your code here

}

function publish() {
  console.log("publish called");
  // your code here
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
