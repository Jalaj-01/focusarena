import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { connectSocket, disconnectSocket } from "./socket/socket";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import CursorGlow from "./components/CursorGlow";
import Particles from "./components/Particles";

function App() {

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white">

      {/* GLOBAL EFFECTS */}
      <CursorGlow />
      <Particles />

      {/* ✅ NAVBAR FIXED */}
      <Navbar />

      {/* PAGE CONTENT */}
      <div className="pt-24">
        <AppRoutes />
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;