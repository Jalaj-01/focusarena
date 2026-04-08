// import { useNavigate } from "react-router-dom";
// import { startChallenge } from "../api/challenge.api";
// import toast from "react-hot-toast";

// export default function ChallengeCard({ challenge, refresh, onDelete }) {
//   const navigate = useNavigate();
//   const isPending = challenge.status === "pending";
//   const isActive = challenge.status === "active";

//   const handleStartAction = async (e) => {
//     e.stopPropagation();
//     try {
//       await startChallenge(challenge.id);
//       if (refresh) refresh();
//       navigate(`/challenge/${challenge.id}`);
//     } catch (err) {
//       toast.error("Failed to start session.");
//     }
//   };

//   return (
//     <div className={`relative p-6 rounded-3xl border transition-all ${
//       isActive ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-white/10 bg-white/5"
//     }`}>
//       {isPending && onDelete && (
//         <button 
//           onClick={(e) => { e.stopPropagation(); onDelete(challenge.id); }}
//           className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors p-1 z-10"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//           </svg>
//         </button>
//       )}

//       <div className="flex justify-between items-start mb-4">
//         <div>
//           <h3 className="text-lg font-bold text-white">{challenge.title}</h3>
//           <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
//             {challenge.type} • {challenge.duration_minutes}M • {challenge.stake} 🪙
//           </p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
//           isActive ? "bg-blue-600 text-white" : isPending ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"
//         }`}>
//           {challenge.status}
//         </span>
//       </div>

//       {isActive ? (
//         <button onClick={() => navigate(`/challenge/${challenge.id}`)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-white">Open</button>
//       ) : isPending ? (
//         <button onClick={handleStartAction} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition text-white">Start</button>
//       ) : (
//         <div className="text-center py-2 text-xs text-gray-500 border border-white/5 rounded-xl">Finalized</div>
//       )}
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";
import { startChallenge } from "../api/challenge.api";
import toast from "react-hot-toast";

export default function ChallengeCard({ challenge, refresh, onDelete }) {
  const navigate = useNavigate();
  const isPending = challenge.status === "pending";
  const isActive = challenge.status === "active";
  const isCompleted = challenge.status === "completed";

  // Identify if the user failed this challenge
  const token = localStorage.getItem("token");
  let currentUserId = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.userId;
    }
  } catch (e) { console.error("Token error"); }

  // Check current user's warnings to determine success/fail for history
  const myParticipant = challenge.participants?.find(p => String(p.user?.id) === String(currentUserId));
  const hasFailed = myParticipant && myParticipant.warnings >= 4;

  const handleStartAction = async (e) => {
    e.stopPropagation();
    try {
      await startChallenge(challenge.id);
      if (refresh) refresh();
      navigate(`/challenge/${challenge.id}`);
    } catch (err) {
      toast.error("Failed to start session.");
    }
  };

  return (
    <div className={`relative p-6 rounded-3xl border transition-all ${
      isActive ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-white/10 bg-white/5"
    }`}>
      {isPending && onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(challenge.id); }}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors p-1 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{challenge.title}</h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
            {challenge.type} • {challenge.duration_minutes}M • {challenge.stake} 🪙
          </p>
        </div>

        {/* 🔥 DYNAMIC STATUS BADGE */}
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
          isActive 
            ? "bg-blue-600 text-white" 
            : isPending 
              ? "bg-yellow-500/20 text-yellow-500" 
              : hasFailed 
                ? "bg-red-500/20 text-red-500" // Red for Failed in History
                : "bg-green-500/20 text-green-500" // Green for Completed in History
        }`}>
          {isCompleted ? (hasFailed ? "Failed" : "Completed") : challenge.status}
        </span>
      </div>

      {isActive ? (
        <button onClick={() => navigate(`/challenge/${challenge.id}`)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-white">Open</button>
      ) : isPending ? (
        <button onClick={handleStartAction} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition text-white">Start</button>
      ) : (
        <div className={`text-center py-2 text-xs border rounded-xl font-bold ${hasFailed ? "text-red-500/50 border-red-500/10" : "text-gray-500 border-white/5"}`}>
          {hasFailed ? "Focus Terminated" : "Challenge Finalized"}
        </div>
      )}
    </div>
  );
}