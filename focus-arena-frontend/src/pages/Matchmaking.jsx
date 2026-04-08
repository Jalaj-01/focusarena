import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket/socket";
import toast from "react-hot-toast";

export default function Matchmaking() {
  const [searching, setSearching] = useState(false);
  const [stake, setStake] = useState(10);
  const [duration, setDuration] = useState(30);
  const [timer, setTimer] = useState(0);
  
  const navigate = useNavigate();
  const socket = getSocket();
  const intervalRef = useRef(null);
  const hasTimedOut = useRef(false); // 🔥 Prevent double redirect

  useEffect(() => {
    if (timer >= 15 && searching && !hasTimedOut.current) {
      hasTimedOut.current = true;
      clearInterval(intervalRef.current);
      setSearching(false);
      socket.emit("leave_queue");
      
      toast.error("No rival found. Switching to Solo mode.");
      
      navigate(`/challenge/auto?type=solo&stake=${stake}&duration=${duration}`, { replace: true });
    }
  }, [timer, searching, navigate, socket, stake, duration]);

  const handleFindMatch = () => {
    if (!socket) return toast.error("Offline");
    hasTimedOut.current = false;
    setSearching(true);
    setTimer(0);
    
    socket.emit("join_queue", { 
        stake: Number(stake), 
        duration_minutes: Number(duration), 
        type: "group" 
    });

    intervalRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (!socket) return;
    const handleMatch = (data) => {
      clearInterval(intervalRef.current);
      toast.success("Rival Found!");
      navigate(`/challenge/${data.challengeId}`);
    };
    socket.on("match_found", handleMatch);
    return () => {
      socket.off("match_found", handleMatch);
      clearInterval(intervalRef.current);
    };
  }, [socket, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b1e] p-6 text-white">
      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl text-center">
        {!searching ? (
          <>
            <h1 className="text-3xl font-bold mb-6">Battle Arena ⚔️</h1>
            <div className="space-y-4 mb-6">
                <div className="text-left">
                    <label className="text-xs text-gray-400 ml-1">Stake Amount</label>
                    <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} className="w-full p-4 mt-1 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500" />
                </div>
                <div className="text-left">
                    <label className="text-xs text-gray-400 ml-1">Focus Time (Mins)</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-4 mt-1 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-blue-500" />
                </div>
            </div>
            <button onClick={handleFindMatch} className="w-full bg-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-500 transition active:scale-95">Find Opponent</button>
          </>
        ) : (
          <div className="py-10 space-y-6">
             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <p className="text-xl font-medium">Searching for rivals... {timer}s</p>
             <button onClick={() => { clearInterval(intervalRef.current); setSearching(false); socket.emit("leave_queue"); }} className="text-red-400 text-sm hover:underline">Cancel Search</button>
          </div>
        )}
      </div>
    </div>
  );
}