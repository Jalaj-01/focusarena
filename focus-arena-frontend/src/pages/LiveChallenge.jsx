// import { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "../api/axios";
// import Badge from "../components/Badge";
// import { getSocket } from "../socket/socket";
// import { playWarning } from "../utils/sound";
// import toast from "react-hot-toast";

// export default function LiveChallenge() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const socket = getSocket();

//   const [challenge, setChallenge] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [violationCount, setViolationCount] = useState(0);
//   const [isFailed, setIsFailed] = useState(false);
//   const [lastViolationReason, setLastViolationReason] = useState("");
//   const [currentUserId, setCurrentUserId] = useState(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);

//   const lastViolationTimeRef = useRef(0);
//   const MAX_VIOLATIONS = 4;

//   const fetchState = useCallback(async () => {
//     try {
//       const res = await axios.get(`/challenges/${id}`);
//       const data = res.data;

//       if (data.status === 'completed') {
//         navigate("/dashboard", { replace: true });
//         return;
//       }

//       setChallenge(data);

//       const token = localStorage.getItem("token");
//       if (token) {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         setCurrentUserId(payload.userId);
//         const me = data.participants?.find(p => String(p.user?.id) === String(payload.userId));
//         if (me) {
//           setViolationCount(Number(me.warnings) || 0);
//           if (Number(me.warnings) >= MAX_VIOLATIONS) setIsFailed(true);
//         }
//       }

//       if (data.status === 'active' && data.end_time) {
//         const serverEndTime = new Date(data.end_time).getTime();
//         const calculateTimeLeft = () => Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
//         setTimeLeft(calculateTimeLeft());
//       } else {
//         setTimeLeft(Number(data.duration_minutes || 0) * 60);
//       }
//     } catch (err) {
//       console.error("Sync Error", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [id, navigate]);

//   useEffect(() => { 
//     fetchState(); 
//   }, [fetchState]);

//   useEffect(() => {
//     if (!challenge || challenge.status !== 'active' || isFailed || timeLeft <= 0) return;
//     const interval = setInterval(() => {
//         setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [challenge, isFailed, timeLeft]);

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen not supported"));
//       setIsFullscreen(true);
//     } else {
//       document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   };

//   const handleViolation = useCallback(async (reason) => {
//     if (isFailed || !challenge || challenge.status !== 'active' || timeLeft <= 0) return;
//     const now = Date.now();
//     if (now - lastViolationTimeRef.current < 2000) return;
//     lastViolationTimeRef.current = now;

//     try {
//       const res = await axios.patch(`/challenges/${id}/warning`);
//       setViolationCount(res.data.warnings);
//       setLastViolationReason(reason); 
//       playWarning();
//       setTimeout(() => setLastViolationReason(""), 4000);
//       if (res.data.status === 'failed' || res.data.warnings >= MAX_VIOLATIONS) setIsFailed(true);
//     } catch (e) { console.error("Warning update failed", e); }
//   }, [id, challenge, isFailed, timeLeft]);

//   useEffect(() => {
//     if (!challenge || challenge.status !== 'active' || isFailed) return;
//     const onVisibilityChange = () => { if (document.hidden) handleViolation("Tab Switched"); };
//     const onBlur = () => { if (!document.hidden) handleViolation("Window Focus Lost"); };
//     document.addEventListener("visibilitychange", onVisibilityChange);
//     window.addEventListener("blur", onBlur);
//     return () => {
//       document.removeEventListener("visibilitychange", onVisibilityChange);
//       window.removeEventListener("blur", onBlur);
//     };
//   }, [handleViolation, challenge, isFailed]);

//   const handleComplete = async () => {
//     try {
//       await axios.patch(`/challenges/${id}/complete`);
//       toast.success("Focus Session Finalized!");
//       navigate("/dashboard", { replace: true });
//     } catch (err) { toast.error("Error finalizing challenge."); }
//   };

//   const formatTime = (s) => {
//     const h = String(Math.floor(s / 3600)).padStart(2, "0");
//     const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
//     const sec = String(s % 60).padStart(2, "0");
//     return `${h}:${m}:${sec}`;
//   };

//   const getTaxMessage = () => {
//       if (violationCount === 1) return "10% Distraction Tax Applied";
//       if (violationCount === 2) return "30% Distraction Tax Applied";
//       if (violationCount === 3) return "50% Distraction Tax Applied";
//       return null;
//   }

//   if (loading) return <div className="fixed inset-0 bg-[#0a0b1e] flex items-center justify-center text-white z-[200]">Syncing Arena...</div>;

//   const meUser = challenge?.participants?.find(p => String(p.user?.id) === String(currentUserId))?.user || challenge?.participants?.[0]?.user;

//   return (
//     <div className="fixed inset-0 bg-[#0a0b1e] text-white flex flex-col items-center justify-center z-[150] overflow-hidden select-none p-4">
      
//       <button onClick={toggleFullscreen} className="absolute top-4 right-4 z-[160] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all">
//         {isFullscreen ? "Exit Fullscreen" : "🖥️ Full Screen"}
//       </button>

//       {lastViolationReason && !isFailed && (
//         <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-[#d4a017] text-black px-6 py-2.5 rounded-full font-black shadow-2xl animate-bounce border-2 border-black/10 whitespace-nowrap">
//           <span className="text-lg">⚠️</span>
//           <span className="uppercase text-[10px] md:text-xs tracking-tight">{lastViolationReason}! ({violationCount}/3)</span>
//         </div>
//       )}

//       {isFailed && (
//         <div className="fixed inset-0 bg-[#7f1d1d] flex flex-col items-center justify-center z-[300] p-6 text-center">
//           <h2 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter text-white uppercase italic">FAILED</h2>
//           <p className="text-lg md:text-xl mb-10 text-white/80 max-w-xl font-medium tracking-widest uppercase">Session Terminated due to Violations.</p>
//           <button onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); navigate("/dashboard"); }} className="bg-white text-[#7f1d1d] px-10 py-4 rounded-xl font-black text-lg hover:bg-red-50 transition-all shadow-2xl active:scale-95">RETURN TO DASHBOARD</button>
//         </div>
//       )}

//       <div className="flex flex-col items-center w-full max-w-4xl space-y-6 md:space-y-10">
//         <div className="text-center space-y-2">
//             <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic opacity-95 leading-none">{challenge?.title}</h1>
//             <div className="flex justify-center"><Badge status={isFailed ? "failed" : challenge?.status} /></div>
//             {!isFailed && violationCount > 0 && (<p className="text-orange-500 font-black text-[10px] uppercase tracking-widest animate-pulse">{getTaxMessage()}</p>)}
//         </div>

//         <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">{meUser?.name?.charAt(0)}</div>
//             <div className="text-left">
//               <p className="font-black text-base leading-none text-white tracking-tight">{meUser?.name}</p>
//               <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mt-1">Challenger</p>
//             </div>
//         </div>

//         <div className={`text-[6rem] md:text-[10rem] font-mono font-bold leading-none tracking-tighter transition-all duration-700 ${violationCount > 0 ? 'text-orange-500' : 'text-white'}`}>
//             {formatTime(timeLeft)}
//         </div>

//         <div className="flex flex-col items-center w-full space-y-8">
//           <div className="flex gap-6">
//               {[1, 2, 3].map((s) => (
//               <div key={s} className={`w-5 h-5 rounded-full transition-all duration-700 border-2 ${violationCount >= s ? 'bg-red-500 border-red-400 shadow-[0_0_25px_rgba(239,68,68,1)] scale-110' : 'bg-white/5 border-white/10'}`} />
//               ))}
//           </div>

//           <div className="w-full max-w-xs md:max-w-sm">
//               <button onClick={handleComplete} disabled={timeLeft > 0 || isFailed} className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-500 shadow-2xl ${timeLeft > 0 ? "bg-white/5 text-white/10 cursor-not-allowed border border-white/5" : "bg-green-600 text-white hover:bg-green-500 hover:-translate-y-0.5 active:translate-y-0"}`}>
//                   {timeLeft > 0 ? "Focusing..." : "Finish Challenge"}
//               </button>
//           </div>

//           {/* 🔥 RESTORED LINE BELOW */}
//           <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.6em] animate-pulse">
//               ANTI-CHEAT ENGINE ACTIVE
//           </p>
//         </div>
//       </div>
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
  const MAX_VIOLATIONS = 4;

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
          setViolationCount(Number(me.warnings) || 0);
          if (Number(me.warnings) >= MAX_VIOLATIONS) setIsFailed(true);
        }
      }

      // Initial Time Calculation
      if (data.status === 'active' && data.end_time) {
        const serverEndTime = new Date(data.end_time).getTime();
        const diff = Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
        setTimeLeft(diff);
      } else {
        setTimeLeft(Number(data.duration_minutes || 0) * 60);
      }
    } catch (err) {
      console.error("Sync Error", err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { 
    fetchState(); 
  }, [fetchState]);

  // HARDENED TIMER: Uses Server End Time to prevent drift between users
  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || isFailed || !challenge.end_time) return;

    const serverEndTime = new Date(challenge.end_time).getTime();

    const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((serverEndTime - now) / 1000));
        
        setTimeLeft(diff);

        if (diff <= 0) {
            clearInterval(interval);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge, isFailed]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen not supported"));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
      if (res.data.status === 'failed' || res.data.warnings >= MAX_VIOLATIONS) setIsFailed(true);
    } catch (e) { console.error("Warning update failed", e); }
  }, [id, challenge, isFailed, timeLeft]);

  useEffect(() => {
    if (!challenge || challenge.status !== 'active' || isFailed) return;
    const onVisibilityChange = () => { if (document.hidden) handleViolation("Tab Switched"); };
    const onBlur = () => { if (!document.hidden) handleViolation("Window Focus Lost"); };
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

  const getTaxMessage = () => {
      if (violationCount === 1) return "10% Distraction Tax Applied";
      if (violationCount === 2) return "30% Distraction Tax Applied";
      if (violationCount === 3) return "50% Distraction Tax Applied";
      return null;
  }

  if (loading) return <div className="fixed inset-0 bg-[#0a0b1e] flex items-center justify-center text-white z-[200]">Syncing Arena...</div>;

  const meUser = challenge?.participants?.find(p => String(p.user?.id) === String(currentUserId))?.user || challenge?.participants?.[0]?.user;

  return (
    <div className="fixed inset-0 bg-[#0a0b1e] text-white flex flex-col items-center justify-center z-[150] overflow-hidden select-none p-4">
      
      <button onClick={toggleFullscreen} className="absolute top-4 right-4 z-[160] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all">
        {isFullscreen ? "Exit Fullscreen" : "🖥️ Full Screen"}
      </button>

      {lastViolationReason && !isFailed && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-[#d4a017] text-black px-6 py-2.5 rounded-full font-black shadow-2xl animate-bounce border-2 border-black/10 whitespace-nowrap">
          <span className="text-lg">⚠️</span>
          <span className="uppercase text-[10px] md:text-xs tracking-tight">{lastViolationReason}! ({violationCount}/3)</span>
        </div>
      )}

      {isFailed && (
        <div className="fixed inset-0 bg-[#7f1d1d] flex flex-col items-center justify-center z-[300] p-6 text-center">
          <h2 className="text-5xl md:text-8xl font-black mb-4 tracking-tighter text-white uppercase italic">FAILED</h2>
          <p className="text-lg md:text-xl mb-10 text-white/80 max-w-xl font-medium tracking-widest uppercase">Session Terminated due to Violations.</p>
          <button onClick={() => { if(document.fullscreenElement) document.exitFullscreen(); navigate("/dashboard"); }} className="bg-white text-[#7f1d1d] px-10 py-4 rounded-xl font-black text-lg hover:bg-red-50 transition-all shadow-2xl active:scale-95">RETURN TO DASHBOARD</button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-4xl space-y-6 md:space-y-10">
        <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic opacity-95 leading-none">{challenge?.title}</h1>
            <div className="flex justify-center"><Badge status={isFailed ? "failed" : challenge?.status} /></div>
            {!isFailed && violationCount > 0 && (<p className="text-orange-500 font-black text-[10px] uppercase tracking-widest animate-pulse">{getTaxMessage()}</p>)}
        </div>

        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-lg">{meUser?.name?.charAt(0)}</div>
            <div className="text-left">
              <p className="font-black text-base leading-none text-white tracking-tight">{meUser?.name}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mt-1">Challenger</p>
            </div>
        </div>

        <div className={`text-[6rem] md:text-[10rem] font-mono font-bold leading-none tracking-tighter transition-all duration-700 ${violationCount > 0 ? 'text-orange-500' : 'text-white'}`}>
            {formatTime(timeLeft)}
        </div>

        <div className="flex flex-col items-center w-full space-y-8">
          <div className="flex gap-6">
              {[1, 2, 3].map((s) => (
              <div key={s} className={`w-5 h-5 rounded-full transition-all duration-700 border-2 ${violationCount >= s ? 'bg-red-500 border-red-400 shadow-[0_0_25px_rgba(239,68,68,1)] scale-110' : 'bg-white/5 border-white/10'}`} />
              ))}
          </div>

          <div className="w-full max-w-xs md:max-w-sm">
              <button onClick={handleComplete} disabled={timeLeft > 0 || isFailed} className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all duration-500 shadow-2xl ${timeLeft > 0 ? "bg-white/5 text-white/10 cursor-not-allowed border border-white/5" : "bg-green-600 text-white hover:bg-green-500 hover:-translate-y-0.5 active:translate-y-0"}`}>
                  {timeLeft > 0 ? "Focusing..." : "Finish Challenge"}
              </button>
          </div>

          <p className="text-white/10 text-[9px] font-black uppercase tracking-[0.6em] animate-pulse">
              ANTI-CHEAT ENGINE ACTIVE
          </p>
        </div>
      </div>
    </div>
  );
}