const zmq = require("zeromq")
// const sock =

module.exports = async () => {
  const zmqSocket = new zmq.Request()
  const tcpAddr = "tcp://127.0.0.1:2900"
  await zmqSocket.bind(tcpAddr)
  console.log(`ZMQ Req bound to ${tcpAddr}`)

  return {
    zmqSocket,
    tcpAddr,
    port: 1234,
    getFile: async (localClientId, fileId) => {
      console.log("sending request for file", [localClientId, fileId])
      // const response = await zmqSocket.send([localClientId, "", fileId])
      console.log("sending...", await zmqSocket.send([fileId]))
      const [fileContent] = (
        await zmqSocket[Symbol.asyncIterator]().next()
      ).value
      console.log({ fileContent: fileContent.toString() })
      // for await (const [fileContent] of zmqSocket) {
      //   console.log({ fileContent: fileContent.toString() })
      // }
    },
    close: async () => {
      await zmqSocket.close()
    },
  }
}
