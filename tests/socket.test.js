const test = require("ava")
const zmq = require("zeromq")
const createBroker = require("../src/broker")
const path = require("path")
const fs = require("fs")

test("send file over socket", async (t) => {
  const socket = await createBroker()
  t.assert(socket.tcpAddr)

  const localClientSock = new zmq.Dealer({
    // routingId: "test_local_client_id",
  })
  await localClientSock.connect(socket.tcpAddr)

  async function listenOnLocalClientSock() {
    console.log("listening on local client sock")
    let k = 0
    for await (const [
      idk,
      channel,
      blank,
      localClientMsgFileId,
      ...other
    ] of localClientSock) {
      console.log({
        idk,
        blank,
        channel: channel.toString(),
        localClientMsgFileId: localClientMsgFileId.toString(),
        other: other.map((a) => a.toString()),
      })
      if (localClientMsgFileId.toString() !== "testfile.txt") {
        throw new Error(`Wrong message to client "${localClientMsgFileId}"`)
      }
      k += 1
      console.log("sending file content")
      await localClientSock.send([
        localClientMsgFileId,
        "",
        fs.readFileSync(path.join(__dirname, "./testfile.txt")),
      ])
    }
    console.log("done listening on local client sock")
  }

  await Promise.race([
    listenOnLocalClientSock(),
    (async () => {
      await socket.getFile("test_local_client_id", "testfile.txt")
    })(),
  ])

  await socket.close()
})
