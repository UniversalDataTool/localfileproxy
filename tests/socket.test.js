const test = require("ava")
const zmq = require("zeromq")
const createSocket = require("../src/socket")
const path = require("path")
const fs = require("fs")

test("send file over socket", async (t) => {
  const socket = await createSocket()
  t.assert(socket.tcpAddr)

  const localClientSock = new zmq.Reply({
    // routingId: "test_local_client_id",
  })
  await localClientSock.connect(socket.tcpAddr)

  async function listenOnLocalClientSock() {
    console.log("listening on local client sock")
    let k = 0
    for await (const [localClientMsgFileId] of localClientSock) {
      if (localClientMsgFileId.toString() !== "testfile.txt") {
        throw new Error(`Wrong message to client "${localClientMsgFileId}"`)
      }
      console.log({ localClientMsgFileId: localClientMsgFileId.toString() })
      k += 1
      await localClientSock.send(
        fs.readFileSync(path.join(__dirname, "./testfile.txt"))
      )
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
