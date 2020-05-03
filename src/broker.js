// @flow weak

const zmq = require("zeromq")
const EventEmitter = require("events")
// const sock =

module.exports = async () => {
  const zmqSocket = new zmq.Router()
  const address = "tcp://127.0.0.1:2900"
  await zmqSocket.bind(address)
  console.log(`ZMQ Req bound to ${address}`)

  const events = new EventEmitter()

  const services = {}

  return {
    zmqSocket,
    address,
    services,
    start: async () => {
      for await (const [sender, blank, header, ...rest] of zmqSocket) {
        switch (header.toString()) {
          case "client_service_heartbeat": {
            const [clientId] = rest
            console.log("heartbeat", clientId.toString())
            if (services[clientId]) {
              clearTimeout(services[clientId].timeout)
            }
            services[clientId] = {
              socketId: sender,
              timeout: setTimeout(() => {
                delete services[clientId]
              }, 10000),
            }
            break
          }
          case "file": {
            const [clientId, fileId, content] = rest
            events.emit(
              "file_received",
              clientId.toString(),
              fileId.toString(),
              content
            )
            break
          }
        }
      }
    },
    getFile: async (localClientId, fileId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const onFileReceived = (resClientId, resFileId, resContent) => {
            if (resClientId === localClientId && resFileId === fileId) {
              events.removeListener("file_received", onFileReceived)
              resolve(resContent)
            }
          }
          events.on("file_received", onFileReceived)
          setTimeout(() => {
            events.removeListener("file_received", onFileReceived)
            reject(new Error("timeout"))
          }, 5000)

          const service = services[localClientId]
          if (!service)
            throw new Error(
              `"${localClientId}" client service not found. Your url might be wrong or the client service might have gone offline.`
            )

          await zmqSocket.send([
            service.socketId,
            null,
            "file_request",
            localClientId,
            fileId,
          ])
        } catch (e) {
          reject(e)
        }
      })
    },
    close: async () => {
      await zmqSocket.close()
    },
  }
}
