import zmq
from os import path
import threading
import time

basepath = path.dirname(__file__)

context = zmq.Context()
socket = context.socket(zmq.DEALER)

socket.connect("tcp://127.0.0.1:2900")
running = True


def send_heartbeat():
    socket.send_multipart([b"", b"client_service_heartbeat", b"exampleclient"])


def send_heartbeat_every_5s():
    global running
    while running:
        send_heartbeat()
        time.sleep(5)


def send_file(file_id):
    socket.send_multipart(
        [
            b"",
            b"file",
            b"exampleclient",
            file_id.encode("ascii"),
            open(path.join(basepath, file_id), "rb").read(),
        ]
    )


heartbeat_thread = threading.Thread(
    name="poll_heartbeat", target=send_heartbeat_every_5s
)

heartbeat_thread.start()

send_heartbeat()

packet = []
while True:
    request = socket.recv()
    packet.append(request)
    if socket.get(zmq.RCVMORE) == 0:
        (header, client_id, file_id) = packet[1:]
        if client_id == b"exampleclient":
            send_file(file_id.decode("ascii"))
        packet = []
running = False
