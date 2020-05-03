// @flow weak

const zmq = require("zeromq")
const fs = require("fs")
const path = require("path")

const clientServiceSock = new zmq.Dealer()
clientServiceSock.connect("tcp://127.0.0.1:2900")
;(async () => {
  await clientServiceSock.send([
    null,
    "client_service_heartbeat",
    "exampleclient",
  ])
  setInterval(async () => {
    await clientServiceSock.send([
      null,
      "client_service_heartbeat",
      "exampleclient",
    ])
  }, 5000)
  for await (const [blank, header, clientId, fileId] of clientServiceSock) {
    clientServiceSock.send([
      null,
      "file",
      "exampleclient",
      fileId,
      fs.readFileSync(path.join(__dirname, fileId.toString())),
    ])
  }
})()
