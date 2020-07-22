const micro = require("micro")
const zmq = require("zeromq")
const createBroker = require("./broker")

let broker

createBroker()
  .then((newBroker) => {
    broker = newBroker
    return broker.start()
  })
  .catch((e) => {
    console.log("Couldn't start broker")
    process.exit(1)
  })

module.exports = async (req, res) => {
  if (!broker) return micro.send(res, 500, "server still initializing")

  if (req.url === "/") {
    return micro.send(
      res,
      200,
      "This is a local file proxy. It makes files on a computer accessible over the internet without storing the files on a server. Learn more at https://github.com/UniversalDataTool/localfileproxy"
    )
  }

  const [clientId, ...fileIdParts] = req.url.slice(1).split("/")
  const fileId = fileIdParts.join("/")
  if (!clientId || !fileId)
    return micro.send(
      res,
      400,
      "invalid url: should have client id and a file path"
    )

  try {
    res.end(await broker.getFile(clientId, fileId), "binary")
  } catch (e) {
    const stringErr = e.toString()
    if (stringErr.includes("timeout") || stringErr.includes("file not found")) {
      return micro.send(res, 404)
    } else {
      return micro.send(res, 500, e.toString())
    }
  }
}
