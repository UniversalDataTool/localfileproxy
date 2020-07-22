// @flow weak

const zmq = require("zeromq")
const EventEmitter = require("events")
const killPort = require("kill-port")
// const sock =

const SECRET = process.env.LOCALFILEPROXY_SECRET || "default_secret"
const DEBUG = Boolean(process.env.LOCALFILEPROXY_DEBUG)

if (DEBUG) console.log("Debug Mode is enabled")

module.exports = async () => {
  await killPort(2900, "tcp").catch((e) => {})
  const zmqSocket = new zmq.Router()
  const address = "tcp://0.0.0.0:2900"
  await zmqSocket.bind(address)
  console.log(`ZMQ Broker bound to ${address}`)

  const events = new EventEmitter()

  const services = {}

  return {
    zmqSocket,
    address,
    services,
    start: async () => {
      for await (const [sender, blank, header, ...rest] of zmqSocket) {
        try {
          switch (header.toString()) {
            case "client_service_heartbeat": {
              if (rest.length !== 2) continue
              const [clientId, secret] = rest
              if (secret.toString() !== SECRET) continue
              if (DEBUG) console.log("heartbeat", clientId.toString())
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
        } catch (e) {
          if (DEBUG)
            console.log(
              "Err:",
              e.toString(),
              header,
              JSON.stringify(rest).slice(0, 100)
            )
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
