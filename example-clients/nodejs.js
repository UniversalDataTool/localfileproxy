const zmq = require("zeromq")

const clientServiceSock = new zmq.Dealer()
clientServiceSock.connect("tcp://127.0.0.1:2900")
;(async () => {
  await clientServiceSock.send([
    null,
    "client_service_heartbeat",
    "test_local_client_id",
  ])
  setInterval(async () => {
    await clientServiceSock.send([
      null,
      "client_service_heartbeat",
      "test_local_client_id",
    ])
  }, 5000)
  for await (const [blank, header, clientId, fileId] of clientServiceSock) {
    clientServiceSock.send([
      null,
      "file",
      "test_local_client_id",
      fileId,
      fs.readFileSync(path.join(__dirname, fileId)),
    ])
  }
})()
