// import { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "../api/axios";
// import Badge from "../components/Badge";
// import { getSocket } from "../socket/socket";
// import { playWarning } from "../utils/sound";

// export default function LiveChallenge() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const socket = getSocket();

//   const [challenge, setChallenge] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [loading, setLoading] = useState(true);

//   // --- ANTI-CHEAT STATE ---
//   const [violationCount, setViolationCount] = useState(0);
//   const [isReady, setIsReady] = useState(false); // 🔥 Safety lock
//   const [lastViolationReason, setLastViolationReason] = useState("");
//   const [isFailed, setIsFailed] = useState(false);
//   const MAX_VIOLATIONS = 3;

//   const lastViolationTimeRef = useRef(0);
//   const interactionRef = useRef(true);

//   const isValidId =
//     typeof id === "string" &&
//     id !== "undefined" &&
//     id.length > 10;

//   // 🔹 Fetch challenge & Restore State
//   useEffect(() => {
//     if (!isValidId) return;

//     const fetchChallenge = async () => {
//       try {
//         const res = await axios.get(`/challenges/${id}`);
//         const data = res.data;
//         setChallenge(data);

//         // 🔥 SYNC VIOLATIONS FROM DATABASE
//         const token = localStorage.getItem("token");
//         if (token) {
//           try {
//             const payload = JSON.parse(atob(token.split(".")[1]));
//             const currentUserId = payload.userId;
            
//             const me = data.participants?.find(p => String(p.user?.id) === String(currentUserId));
            
//             if (me) {
//               const dbWarnings = me.warnings || 0;
//               setViolationCount(dbWarnings);
//               if (dbWarnings > MAX_VIOLATIONS) {
//                 setIsFailed(true);
//               }
//             }
//           } catch (e) {
//             console.error("Auth sync error", e);
//           }
//         }

//         const endTime = new Date(data.end_time).getTime();
//         const now = Date.now();
//         setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)));
        
//         setIsReady(true); // 🔥 Ready to start monitoring
//       } catch (err) {
//         console.error("Error fetching challenge:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChallenge();
//   }, [id, isValidId]);

//   // 🔹 Timer
//   useEffect(() => {
//     if (!challenge || isFailed) return;

//     const interval = setInterval(() => {
//       const endTime = new Date(challenge.end_time).getTime();
//       const now = Date.now();
//       const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      
//       setTimeLeft(diff);

//       if (diff <= 0) {
//         clearInterval(interval);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [challenge, isFailed]);

//   // 🔥 Anti-Cheat Logic
//   const handleViolation = useCallback((reason) => {
//     if (isFailed || !challenge || timeLeft <= 0 || !isReady) return;

//     const now = Date.now();
//     if (now - lastViolationTimeRef.current < 3000) return; 
//     lastViolationTimeRef.current = now;

//     setViolationCount((prev) => {
//       const newCount = prev + 1;
//       if (newCount > MAX_VIOLATIONS) {
//         setIsFailed(true);
//       }
//       return newCount;
//     });

//     setLastViolationReason(reason);
//     playWarning();

//     socket?.emit("violation_detected", { challengeId: id, reason });

//     setTimeout(() => setLastViolationReason(""), 4000);
//   }, [id, socket, isFailed, challenge, timeLeft, isReady]);

//   useEffect(() => {
//     if (!challenge || isFailed || timeLeft <= 0 || !isReady) return;

//     const onVisibilityChange = () => {
//       if (document.hidden) {
//         handleViolation("Tab Switched");
//       }
//     };

//     const onBlur = () => {
//       if (!document.hidden) {
//         handleViolation("Window Focus Lost");
//       }
//     };

//     document.addEventListener("visibilitychange", onVisibilityChange);
//     window.addEventListener("blur", onBlur);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibilityChange);
//       window.removeEventListener("blur", onBlur);
//     };
//   }, [handleViolation, challenge, isFailed, timeLeft, isReady]);

//   // 🔥 Socket events
//   useEffect(() => {
//     if (!socket || !isValidId) return;
//     socket.emit("join_room", { challengeId: id });
//     return () => {
//       socket.emit("leave_room", { challengeId: id });
//     };
//   }, [socket, id, isValidId]);

//   useEffect(() => {
//     if (!socket) return;
//     socket.on("challenge_completed", () => {
//       setChallenge((prev) => ({ ...prev, status: "completed" }));
//     });
//     return () => {
//       socket.off("challenge_completed");
//     };
//   }, [socket]);

//   // 🔥 Activity Ping (FIXED: removed 'violations' to prevent overwrite)
//   useEffect(() => {
//     if (!socket || !isValidId || !challenge || isFailed || !isReady) return;

//     const markInteraction = () => { interactionRef.current = true; };
//     window.addEventListener("mousemove", markInteraction);
//     window.addEventListener("keydown", markInteraction);

//     const interval = setInterval(() => {
//       socket.emit("activity_ping", {
//         challengeId: id,
//         visible: !document.hidden,
//         interaction: interactionRef.current,
//         // We no longer send 'violations' here. Backend keeps its own count.
//       });
//       interactionRef.current = false;
//     }, 5000);

//     return () => {
//       clearInterval(interval);
//       window.removeEventListener("mousemove", markInteraction);
//       window.removeEventListener("keydown", markInteraction);
//     };
//   }, [socket, id, challenge, isValidId, isFailed, isReady]);

//   // 🔹 Helpers
//   const token = localStorage.getItem("token");
//   let currentUserId = null;
//   try {
//     if (token) {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       currentUserId = payload.userId;
//     }
//   } catch { console.error("Invalid token"); }

//   let me = challenge?.participants?.find(p => String(p.user?.id) === String(currentUserId))?.user || challenge?.participants?.[0]?.user;
//   let opponent = challenge?.participants?.find(p => String(p.user?.id) !== String(currentUserId))?.user;

//   const getName = (user) => user?.name || user?.username || "Player";
//   const formatTime = (seconds) => {
//     const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
//     const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
//     const s = String(seconds % 60).padStart(2, "0");
//     return `${h}:${m}:${s}`;
//   };

//   if (loading) return <div className="h-screen flex items-center justify-center text-gray-400 animate-pulse">Loading...</div>;
//   if (!challenge) return <div className="h-screen flex items-center justify-center text-red-500">Challenge not found</div>;

//   return (
//     <div className="min-h-screen text-white flex flex-col items-center justify-center px-4 space-y-8 relative overflow-hidden">
      
//       {lastViolationReason && !isFailed && (
//         <div className="fixed top-10 bg-yellow-500/90 text-black px-6 py-2 rounded-full font-bold animate-bounce shadow-2xl z-50">
//           ⚠️ {lastViolationReason}! Stay on the page ({Math.min(violationCount, MAX_VIOLATIONS)}/{MAX_VIOLATIONS})
//         </div>
//       )}

//       {isFailed && (
//         <div className="fixed inset-0 bg-red-900/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] p-6 text-center">
//           <h2 className="text-4xl font-bold mb-4">CHALLENGE FAILED</h2>
//           <p className="text-xl mb-6">Too many violations. Focus session terminated.</p>
//           <button 
//             onClick={() => navigate("/dashboard")}
//             className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
//           >
//             Back to Dashboard
//           </button>
//         </div>
//       )}

//       <h1 className="text-3xl md:text-5xl font-bold text-center">
//         {challenge.title}
//       </h1>

//       <Badge status={isFailed ? "failed" : challenge.status} />

//       <div className="flex items-center gap-6">
//         <PlayerCard name={getName(me)} label="You" />
//         {opponent ? (
//           <>
//             <span className="text-2xl text-gray-400">VS</span>
//             <PlayerCard name={getName(opponent)} label="Opponent" />
//           </>
//         ) : (
//           <span className="text-gray-400 text-lg">Solo Challenge</span>
//         )}
//       </div>

//       <div className={`text-6xl md:text-8xl font-mono transition-colors ${violationCount > 1 ? 'text-orange-500' : 'text-white'}`}>
//         {formatTime(timeLeft)}
//       </div>

//       <div className="flex gap-2">
//         {[...Array(MAX_VIOLATIONS)].map((_, i) => (
//           <div 
//             key={i} 
//             className={`w-3 h-3 rounded-full transition-colors duration-300 ${i < violationCount ? 'bg-red-500' : 'bg-gray-700'}`}
//           />
//         ))}
//       </div>

//       <button
//         onClick={() => navigate(`/challenge/${id}/complete`)}
//         disabled={timeLeft > 0 || isFailed}
//         className={`px-6 py-3 rounded-xl text-lg transition ${
//           (timeLeft > 0 || isFailed)
//             ? "bg-gray-600 cursor-not-allowed opacity-50"
//             : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
//         }`}
//       >
//         {isFailed ? "Challenge Failed" : "Complete Challenge"}
//       </button>

//       {timeLeft > 0 && !isFailed && (
//         <p className="text-gray-400 text-sm animate-pulse">
//           Stay focused! Do not leave this tab.
//         </p>
//       )}
//     </div>
//   );
// }

// function PlayerCard({ name, label }) {
//   return (
//     <div className="p-5 w-40 text-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
//       <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
//         {name.charAt(0)}
//       </div>
//       <p className="font-semibold truncate px-2">{name}</p>
//       <p className="text-xs text-gray-400">{label}</p>
//     </div>
//   );
// }

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Badge from "../components/Badge";
import { getSocket } from "../socket/socket";
import { playWarning } from "../utils/sound";
import toast from "react-hot-toast";

export default function LiveChallenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = getSocket();

  const [challenge, setChallenge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [lastViolationReason, setLastViolationReason] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lastViolationTimeRef = useRef(0);
  const MAX_VIOLATIONS = 3;

  const fetchState = useCallback(async () => {
    try {
      const res = await axios.get(`/challenges/${id}`);
      const data = res.data;

      if (data.status === 'completed') {
        navigate("/dashboard", { replace: true });
        return;
      }

      setChallenge(data);

      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.userId);
        const me = data.participants?.find(p => String(p.user?.id) === String(payload.userId));
        if (me) {
          setViolationCount(me.warnings || 0);
          if (me.warnings >= 4) setIsFailed(true);
        }
      }

      if (data.status === 'active' && data.end_time) {
        const end = new Date(data.end_time).getTime();
        setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
      } else {
        setTimeLeft(data.duration_minutes * 60);
      }
    } catch (err) {
      console.error("Sync Error", err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchState(); }, [fetchState]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen not supported"));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || isFailed) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Focus active! Leaving will result in failure.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [challenge, isFailed]);

  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || isFailed || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, [challenge, isFailed, timeLeft]);

  const handleViolation = useCallback(async (reason) => {
    if (isFailed || !challenge || challenge.status !== 'active' || timeLeft <= 0) return;
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2000) return;
    lastViolationTimeRef.current = now;

    try {
      const res = await axios.patch(`/challenges/${id}/warning`);
      setViolationCount(res.data.warnings);
      setLastViolationReason(reason); 
      playWarning();
      setTimeout(() => setLastViolationReason(""), 4000);
      if (res.data.status === 'failed') setIsFailed(true);
    } catch (e) { console.error("Warning update failed", e); }
  }, [id, challenge, isFailed, timeLeft]);

  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || isFailed) return;
    const onVisibilityChange = () => { if (document.hidden) handleViolation("Tab Switched"); };
    const onBlur = () => { if (!document.hidden) handleViolation("Window Focus Lost ! Stay on the page"); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleViolation, challenge, isFailed]);

  const handleComplete = async () => {
    try {
      await axios.patch(`/challenges/${id}/complete`);
      toast.success("Focus Session Finalized!");
      navigate("/dashboard", { replace: true });
    } catch (err) { toast.error("Error finalizing challenge."); }
  };

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  if (loading) return <div className="fixed inset-0 bg-[#0a0b1e] flex items-center justify-center text-white z-[200]">Syncing Arena...</div>;

  const meUser = challenge?.participants?.find(p => String(p.user?.id) === String(currentUserId))?.user || challenge?.participants?.[0]?.user;

  return (
    <div className="fixed inset-0 bg-[#0a0b1e] text-white flex flex-col items-center justify-center z-[150] overflow-hidden select-none p-4">
      
      {/* 🔹 Full Screen Toggle (Top Right) */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[160] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all"
      >
        {isFullscreen ? "Exit Fullscreen" : "🖥️ Full Screen"}
      </button>

      {/* 🔹 Alert Banner (Top Center) */}
      {lastViolationReason && !isFailed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-[#d4a017] text-black px-6 py-2.5 rounded-full font-black shadow-2xl animate-bounce border-2 border-black/10 whitespace-nowrap">
          <span className="text-lg">⚠️</span>
          <span className="uppercase text-[10px] md:text-xs tracking-tight">{lastViolationReason}! ({violationCount}/{MAX_VIOLATIONS})</span>
        </div>
      )}

      {/* 🔹 Failure Screen (Solid Red) */}
      {isFailed && (
        <div className="fixed inset-0 bg-[#7f1d1d] flex flex-col items-center justify-center z-[300] p-6 text-center">
          <h2 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter text-white">CHALLENGE FAILED</h2>
          <p className="text-lg md:text-xl mb-10 text-white/80 max-w-xl font-medium tracking-widest uppercase">
            Session Terminated due to Violations and stack will not be fully refunded.
          </p>
          <button 
            onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); navigate("/dashboard"); }} 
            className="bg-white text-[#7f1d1d] px-10 py-4 rounded-xl font-black text-lg hover:bg-red-50 transition-all shadow-2xl active:scale-95"
          >
            RETURN TO ARENA
          </button>
        </div>
      )}

      {/* 🔹 Main Content (Clustered Center) */}
      <div className="flex flex-col items-center w-full max-w-4xl space-y-6 md:space-y-10">
        
        {/* Header Cluster */}
        <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic opacity-95 leading-none">
              {challenge?.title}
            </h1>
            <div className="flex justify-center">
              <Badge status={isFailed ? "failed" : challenge?.status} />
            </div>
        </div>

        {/* User Card (More Compact) */}
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">
                {meUser?.name?.charAt(0)}
            </div>
            <div className="text-left">
              <p className="font-black text-base leading-none text-white tracking-tight">{meUser?.name}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mt-1">Challenger</p>
            </div>
        </div>

        {/* 🔹 Optimized Timer Size (Prevents push-off) */}
        <div className={`text-[6rem] md:text-[10rem] font-mono font-bold leading-none tracking-tighter transition-all duration-700 ${violationCount > 0 ? 'text-orange-500' : 'text-white'}`}>
            {formatTime(timeLeft)}
        </div>

        {/* Status Indicators & Action */}
        <div className="flex flex-col items-center w-full space-y-8">
          
          <div className="flex gap-6">
              {[1, 2, 3].map((s) => (
              <div 
                  key={s} 
                  className={`w-5 h-5 rounded-full transition-all duration-700 border-2 ${violationCount >= s ? 'bg-red-500 border-red-400 shadow-[0_0_25px_rgba(239,68,68,1)] scale-110' : 'bg-white/5 border-white/10'}`} 
              />
              ))}
          </div>

          <div className="w-full max-w-xs md:max-w-sm">
              <button 
                  onClick={handleComplete}
                  disabled={timeLeft > 0 || isFailed}
                  className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-500 shadow-2xl ${
                  timeLeft > 0 
                  ? "bg-white/5 text-white/5 cursor-not-allowed border border-white/5" 
                  : "bg-green-600 text-white hover:bg-green-500 hover:-translate-y-0.5 active:translate-y-0"
                  }`}
              >
                  {timeLeft > 0 ? "Focusing..." : "Finish Challenge"}
              </button>
          </div>

          <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.6em] animate-pulse">
              System Monitoring Active
          </p>
        </div>
      </div>
    </div>
  );
} 