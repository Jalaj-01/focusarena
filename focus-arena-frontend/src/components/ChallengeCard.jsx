// import { Users, Timer, Coins, Play, XCircle, LogIn, Crown } from "lucide-react";
// import axios from "../api/axios";
// import toast from "react-hot-toast";
// import { useState } from "react";

// export default function ChallengeCard({ challenge, refresh, onDelete }) {
//   const [loading, setLoading] = useState(false);

//   // Get Current User ID from token
//   const token = localStorage.getItem("token");
//   const currentUserId = token ? JSON.parse(atob(token.split(".")[1])).userId : null;

//   // Logic Helpers
//   const participants = challenge.participants || [];
//   const creator = participants[0]?.user;
//   const isCreator = creator?.id === currentUserId;
//   const isJoined = participants.some((p) => p.user.id === currentUserId);
//   const isPending = challenge.status === "pending";

//   const handleJoin = async () => {
//     try {
//       setLoading(true);
//       await axios.post(`/challenges/${challenge.id}/join`);
//       toast.success("Joined Arena!");
//       refresh();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Join failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStart = async () => {
//     try {
//       setLoading(true);
//       await axios.patch(`/challenges/${challenge.id}/start`);
//       toast.success("Battle Started!");
//       refresh();
//     } catch (err) {
//       toast.error("Only creator can start.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKick = async (participantId) => {
//     try {
//       await axios.delete(`/challenges/${challenge.id}/participants/${participantId}`);
//       toast.success("User removed and refunded.");
//       refresh();
//     } catch (err) {
//       toast.error("Failed to remove user.");
//     }
//   };

//   return (
//     <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-blue-500/50 transition-all flex flex-col h-full backdrop-blur-md">
//       {/* Header */}
//       <div className="flex justify-between items-start mb-4">
//         <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
//           {challenge.type} arena
//         </div>
//         {isCreator && isPending && (
//           <button onClick={() => onDelete(challenge.id)} className="text-gray-500 hover:text-red-400 transition">
//             <XCircle size={18} />
//           </button>
//         )}
//       </div>

//       <h3 className="text-xl font-bold mb-4 line-clamp-1">{challenge.title}</h3>

//       {/* Stats */}
//       <div className="grid grid-cols-2 gap-3 mb-6">
//         <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
//           <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold mb-1">
//             <Coins size={12} className="text-yellow-500" /> Stake
//           </div>
//           <div className="font-bold text-lg">{challenge.stake}</div>
//         </div>
//         <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
//           <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold mb-1">
//             <Timer size={12} className="text-blue-400" /> Time
//           </div>
//           <div className="font-bold text-lg">{challenge.duration_minutes}m</div>
//         </div>
//       </div>

//       {/* Participant List (The "Lobby") */}
//       <div className="mb-6 flex-grow">
//         <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 flex items-center gap-2">
//           <Users size={12} /> Lobby ({participants.length})
//         </p>
//         <div className="space-y-2">
//           {participants.map((p, idx) => (
//             <div key={p.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
//               <div className="flex items-center gap-2">
//                 <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
//                   {p.user.name.charAt(0)}
//                 </div>
//                 <span className="text-sm font-medium truncate max-w-[100px]">{p.user.name}</span>
//                 {idx === 0 && <Crown size={12} className="text-yellow-500" />}
//               </div>
              
//               {/* Kick authority for Creator */}
//               {isCreator && idx !== 0 && isPending && (
//                 <button 
//                   onClick={() => handleKick(p.id)}
//                   className="text-gray-500 hover:text-red-500 transition px-2"
//                   title="Reject Request"
//                 >
//                   <XCircle size={14} />
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="mt-auto">
//         {isPending ? (
//           isCreator ? (
//             <button
//               onClick={handleStart}
//               disabled={loading || (challenge.type === 'group' && participants.length < 2)}
//               className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 transition font-black uppercase text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
//             >
//               <Play size={16} fill="currentColor" />
//               {participants.length < 2 && challenge.type === 'group' ? "Waiting for Opponents" : "Start Battle"}
//             </button>
//           ) : isJoined ? (
//             <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-center text-sm font-bold animate-pulse">
//               Waiting for Host...
//             </div>
//           ) : (
//             <button
//               onClick={handleJoin}
//               disabled={loading}
//               className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 transition font-black uppercase text-sm flex items-center justify-center gap-2 shadow-xl shadow-green-900/20"
//             >
//               <LogIn size={16} />
//               Join Arena
//             </button>
//           )
//         ) : (
//           <div className="w-full py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-center text-sm font-black uppercase tracking-widest">
//             {challenge.status}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { Users, Timer, Coins, Play, XCircle, LogIn, Crown, Rocket, CheckCircle, AlertTriangle, Trash2, X } from "lucide-react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ChallengeCard({ challenge, refresh, onDelete }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = token ? JSON.parse(atob(token.split(".")[1])).userId : null;

  const participants = challenge.participants || [];
  
  // Logic Fix: Ensure creator check is robust
  const creator = participants[0]?.user;
  const isCreator = String(creator?.id) === String(currentUserId);
  const isJoined = participants.some((p) => String(p.user?.id) === String(currentUserId));
  
  // Logic Fix: Only Launch if participants > 1 for Group, or always for Solo
  const canLaunch = challenge.type === 'solo' || participants.length > 1;

  useEffect(() => {
    if (challenge.status === 'active' && isJoined) {
        navigate(`/live/${challenge.id}`);
    }
  }, [challenge.status, isJoined, navigate, challenge.id]);

  const handleJoin = async () => {
    try {
      setLoading(true);
      await axios.post(`/challenges/${challenge.id}/join`);
      toast.success("Arena Joined!");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Join failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (participantId) => {
    if (!window.confirm("Remove this player from the arena?")) return;
    try {
      setLoading(true);
      // Endpoint assumes backend logic for removing a participant
      await axios.post(`/challenges/${challenge.id}/kick/${participantId}`);
      toast.success("Participant removed");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to kick player");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      await axios.patch(`/challenges/${challenge.id}/start`);
      toast.success("Battle Initiated!");
      navigate(`/live/${challenge.id}`);
    } catch (err) {
      toast.error("Launch Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative bg-white/5 border ${challenge.status === 'active' ? 'border-blue-500 shadow-2xl' : 'border-white/10'} rounded-[2rem] p-6 transition-all flex flex-col h-full min-h-[350px] backdrop-blur-xl group overflow-hidden`}>
      
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>

      <div className="flex justify-between items-center mb-6">
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
          challenge.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          challenge.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          {challenge.type} Arena
        </div>

        {isCreator && challenge.status === 'pending' && (
          <button 
            onClick={() => onDelete(challenge.id)}
            className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-full transition-colors"
            title="Cancel Arena"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <h3 className="text-2xl font-black mb-6 italic uppercase tracking-tighter leading-tight line-clamp-2">
        {challenge.title}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-black/30 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
            <p className="text-[10px] uppercase font-black text-gray-500 mb-1 flex items-center gap-1"><Coins size={12}/> Stake</p>
            <p className="text-xl font-black text-yellow-400">{challenge.stake}</p>
        </div>
        <div className="bg-black/30 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
            <p className="text-[10px] uppercase font-black text-gray-500 mb-1 flex items-center gap-1"><Timer size={12}/> Time</p>
            <p className="text-xl font-black text-blue-400">{challenge.duration_minutes}m</p>
        </div>
      </div>

      <div className="mb-8 flex-grow">
        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
          {participants.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 group/player">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-black shadow-lg uppercase">{p.user?.name?.charAt(0) || '?'}</div>
                <span className="text-[11px] font-black uppercase tracking-tight truncate flex-1">{p.user?.name || 'Unknown User'}</span>
                
                {/* Crown for Creator */}
                {idx === 0 && <Crown size={14} className="text-yellow-500" />}

                {/* Kick button: Only for Host, and cannot kick self */}
                {isCreator && String(p.user?.id) !== String(currentUserId) && challenge.status === 'pending' && (
                  <button 
                    onClick={() => handleKick(p.user.id)}
                    className="opacity-0 group-hover/player:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        {challenge.status === "pending" ? (
          isCreator ? (
            <button 
              onClick={handleStart} 
              disabled={loading || !canLaunch} 
              className="w-full py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 transition-all font-black uppercase text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-950/40"
            >
              <Play size={18} fill="currentColor" /> 
              {challenge.type === 'group' && !canLaunch ? "Waiting for players..." : "Launch Battle"}
            </button>
          ) : isJoined ? (
            <div className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-gray-500 text-center text-xs font-black tracking-widest animate-pulse">Lobby Ready</div>
          ) : (
            <button 
              onClick={handleJoin} 
              disabled={loading} 
              className="w-full py-5 rounded-[1.5rem] bg-green-600 hover:bg-green-500 transition-all font-black uppercase text-sm flex items-center justify-center gap-3 shadow-xl shadow-green-950/40"
            >
              <LogIn size={18} /> Join Arena
            </button>
          )
        ) : challenge.status === 'active' ? (
          <button 
            onClick={() => navigate(`/live/${challenge.id}`)} 
            className="w-full py-5 rounded-[1.5rem] bg-white text-black hover:bg-blue-400 hover:text-white transition-all font-black uppercase text-sm flex items-center justify-center gap-3 shadow-2xl animate-bounce"
          >
            <Rocket size={18} /> Enter Arena
          </button>
        ) : (
          <div className={`w-full py-5 rounded-[1.5rem] text-center text-xs font-black uppercase flex items-center justify-center gap-2 border ${
            challenge.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {challenge.status === 'completed' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            Battle {challenge.status}
          </div>
        )}
      </div>
    </div>
  );
}