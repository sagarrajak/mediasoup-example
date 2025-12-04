import fs from 'fs'
import https from 'https'

import express from 'express';
import * as socketio from 'socket.io'
import mediasoup from 'mediasoup'

const app = express()
app.use(express.static('public'))


const key = fs.readFileSync('config/cert.key')
const cert = fs.readFileSync('config/cert.crt')

const options = {key, cert};

const httpsServer = https.createServer(options, app)

const io = socketio(httpsServer, {
    cors: ["https://localhost:3030"]
});

httpsServer.listen(3030)