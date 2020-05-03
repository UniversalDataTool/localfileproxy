# localfileproxy

Proxy local files to an online url.

Very useful in web services that uses files on a user's computer but don't want
to require the user to upload anything.

- supports many clients
- simple api for programmatic usage
- supports client machines that don't have exposed ports (e.g. a laptop)

## Web Server, Local Client, Browser Client

It can be a bit confusing to follow how this works because there are multiple
clients involved. Here are the three roles:

- **web server**: AKA the localfileproxy server, this is a server on the
  internet that has an exposed port
- **local client**: The client application that has the files
- **browser client**: This is a service that has URLs to the web server, but
  because it's a browser (or a different computer than the local client) it
  can't access the files directly. It will request the files from the web server.

### Old Process

1. Start the localfileproxy server on a Web Server
2. Local Client registers itself itself with the server, establishing a socket
   connection
3. Browser Client makes request to Web Server
4. Web Server sends a request to the Local Client over the socket
5. Local Client answers the socket request with data from a file
6. Web Server receives data from Local Client, and passes it to the Browser
   Client

Some additional technical details

- Step 1 server starts an http server to accept file requests from Browser Client as
  well as a bound tcp zeromq "dealer-reply" socket on port 2900
- Step 2 Registration is done by connecting to a zeromq pub socket.
- The client can disconnect or reconnect at anytime. If they're not registered
  when the Browser Client makes a request the request will fail.
