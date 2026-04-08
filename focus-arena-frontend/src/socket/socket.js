import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");

    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      auth: {
        token, // ✅ SEND TOKEN
      },
    });

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};