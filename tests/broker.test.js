// @flow weak

const test = require("ava")
const zmq = require("zeromq")
const createBroker = require("../src/broker")
const path = require("path")
const fs = require("fs")
const requestFile = require("./request-file")

test("send file over broker", async (t) => {
  const broker = await createBroker()
  t.assert(broker.address)

  const clientServiceSock = new zmq.Dealer()
  clientServiceSock.connect(broker.address)

  await Promise.race([
    broker.start(),
    (async () => {
      // LOCAL CLIENT SERVICE CODE
      await clientServiceSock.send([
        null,
        "client_service_heartbeat",
        "test_local_client_id",
      ])
      for await (const [blank, header, clientId, fileId] of clientServiceSock) {
        clientServiceSock.send([
          null,
          "file",
          "test_local_client_id",
          fileId,
          fs.readFileSync(path.join(__dirname, "./testfile.txt")),
        ])
      }
    })(),
    (async () => {
      // REQUESTER CODE
      await new Promise((resolve) => setTimeout(resolve, 10))
      const result = await broker.getFile(
        "test_local_client_id",
        "testfile.txt"
      )
      if (
        result.compare(
          fs.readFileSync(path.join(__dirname, "./testfile.txt"))
        ) === 0
      ) {
        t.pass("successfully returned file")
      }
    })(),
  ])

  await broker.close()
})
