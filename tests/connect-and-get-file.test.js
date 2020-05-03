const test = require("ava")
const micro = require("micro")
const listen = require("test-listen")
const request = require("request-promise")
const main = require("../src/main")

test("should connect and allow user to GET file", (t) => {
  const server = micro(main)
  const service = listen(server)
})
