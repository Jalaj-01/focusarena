import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("token");
    
    // 🔥 Use environment variable for production connection
    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    socket = io(SOCKET_URL, {
      // Added polling as a fallback for better reliability on Render free tier
      transports: ["websocket", "polling"], 
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