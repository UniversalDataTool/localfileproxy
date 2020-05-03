# localfileproxy

Proxy local files to an online url.

Very useful in web services that uses files on a user's computer but don't want
to require the user to upload anything.

- supports many clients
- simple api for programmatic usage
- supports client machines that don't have exposed ports (e.g. a laptop)

## Web Server, Client Service, Browser Client

It can be a bit confusing to follow how this works because there are multiple
clients involved. Here are the three roles:

- **web server (Broker)**: AKA the localfileproxy server, this is a server on the
  internet that has an exposed port
- **client service (Service)**: The client application that has access to the files
- **browser client (Requester)**: This is a service that has URLs to the web server, but
  because it's a browser (or a different computer than the local client) it
  can't access the files directly. It will request the files from the web server.

## Technical Details

All of this is facilitated via a ZeroMQ Majordomo-like pattern. Roughly, this is
what happens...

1. Start the Broker (the localfileproxy server on a Web Server)
2. Client Service (Service) registers itself itself with the Web Server (Broker),
   establishing a socket connection
3. Browser Client (Requester) makes request to Web Server (Broker)
4. Web Server (Broker) sends a request to the Client Service (Service) over the socket
5. Client Service (Service) answers the socket request with data from a file
6. Web Server (Broker) receives data from Client Service (Service), and passes it to the Browser
   Client (Requester)

The Broker uses a ZeroMQ Router. The Service uses a ZeroMQ Dealer.
