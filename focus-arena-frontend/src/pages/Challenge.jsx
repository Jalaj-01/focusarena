// import { useEffect, useState, useMemo, useCallback } from "react";
// import { useNavigate } from "react-router-dom"; // Added for redirection
// import { getChallenges, deleteChallenge } from "../api/challenge.api"; 
// import { getSocket } from "../socket/socket";
// import CreateChallengeForm from "../components/CreateChallengeForm";
// import ChallengeCard from "../components/ChallengeCard";
// import toast from "react-hot-toast";

// export default function Challenge() {
//   const [challenges, setChallenges] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const socket = getSocket();
//   const navigate = useNavigate(); // Initialize navigate

//   // Get Current User ID safely
//   const token = localStorage.getItem("token");
//   const currentUserId = useMemo(() => {
//     try {
//       return token ? JSON.parse(atob(token.split(".")[1])).userId : null;
//     } catch (e) {
//       return null;
//     }
//   }, [token]);

//   const fetchChallenges = useCallback(async () => {
//     try {
//       const res = await getChallenges();
//       setChallenges(res.data.filter(c => !c.is_archived));
//     } catch (err) {
//       console.error("Error fetching challenges", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const handleDeleteChallenge = async (id) => {
//     try {
//       await deleteChallenge(id);
//       toast.success("Arena Cancelled. Coins Refunded.");
//       fetchChallenges(); 
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Could not delete");
//     }
//   };

//   useEffect(() => {
//     fetchChallenges();

//     if (socket) {
//       socket.on("challenge_created", fetchChallenges); 
//       socket.on("challenge_finalized", fetchChallenges);
//       socket.on("user_joined", fetchChallenges);
      
//       // 🔥 FIX: Redirect participants to the live session when it starts
//       socket.on("challenge_started", (data) => {
//         // Find the challenge in our current state to see if we are a participant
//         const challengeToStart = challenges.find(c => c.id === data.challengeId);
//         const isParticipant = challengeToStart?.participants?.some(p => p.user.id === currentUserId);

//         if (isParticipant) {
//           toast.success("Battle Starting! Focus now.");
//           navigate(`/live/${data.challengeId}`); // Adjust path if your live route is different
//         } else {
//           fetchChallenges(); // Just refresh list for non-participants
//         }
//       });
//     }

//     return () => {
//       if (socket) {
//         socket.off("challenge_finalized");
//         socket.off("user_joined");
//         socket.off("challenge_started");
//       }
//     };
//   }, [fetchChallenges, socket, challenges, currentUserId, navigate]);

//   // Filter Logic
//   const openArenas = useMemo(() => 
//     challenges.filter(c => {
//       const isPending = c.status === 'pending';
//       const isMySolo = c.type === 'solo' && c.participants?.some(p => p.user.id === currentUserId);
//       const isPublicGroup = c.type === 'group';
      
//       return isPending && (isMySolo || isPublicGroup);
//     }), [challenges, currentUserId]
//   );

//   const activeChallenges = useMemo(() => 
//     challenges.filter(c => c.status === 'active' && c.participants?.some(p => p.user.id === currentUserId)), 
//     [challenges, currentUserId]
//   );

//   const historyChallenges = useMemo(() => 
//     challenges.filter(c => c.status === 'completed' || c.status === 'failed'), 
//     [challenges]
//   );

//   if (loading) return <div className="min-h-screen bg-[#070816] flex items-center justify-center font-bold uppercase tracking-widest text-[10px] text-gray-500">Loading Arenas...</div>;

//   return (
//     <div className="min-h-screen text-white px-6 py-8 bg-[#070816]">
//       <div className="max-w-6xl mx-auto">
//         <header className="flex justify-between items-center mb-10">
//             <div>
//               <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent italic tracking-tighter">ARENA FEED</h1>
//               <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">Real-time focus monitoring active</p>
//             </div>
//             <button onClick={fetchChallenges} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition border border-white/10 font-bold text-xs uppercase">↻ Refresh</button>
//         </header>

//         <section className="mb-12">
//             <CreateChallengeForm onCreated={fetchChallenges} />
//         </section>

//         {/* --- OPEN ARENAS --- */}
//         <section className="mb-12">
//             <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-green-500">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
//                 Open Arenas
//             </h2>
//             {openArenas.length === 0 ? (
//                 <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-gray-500 font-bold uppercase text-[10px]">
//                     No joinable battles found. Create one to begin.
//                 </div>
//             ) : (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {openArenas.map((c) => (
//                         <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} onDelete={handleDeleteChallenge} />
//                     ))}
//                 </div>
//             )}
//         </section>

//         {/* --- ACTIVE SESSIONS --- */}
//         {activeChallenges.length > 0 && (
//           <section className="mb-12">
//               <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-blue-400">
//                   <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
//                   My Active Battle
//               </h2>
//               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {activeChallenges.map((c) => (
//                       <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} />
//                   ))}
//               </div>
//           </section>
//         )}

//         {/* --- HISTORY --- */}
//         {historyChallenges.length > 0 && (
//           <section className="pb-20">
//               <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Battle History</h2>
//               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
//                   {historyChallenges.slice(0, 6).map((c) => (
//                       <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} />
//                   ))}
//               </div>
//           </section>
//         )}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getChallenges, deleteChallenge } from "../api/challenge.api"; 
import { getSocket } from "../socket/socket";
import CreateChallengeForm from "../components/CreateChallengeForm";
import ChallengeCard from "../components/ChallengeCard";
import toast from "react-hot-toast";

export default function Challenge() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = getSocket();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = useMemo(() => {
    try {
      return token ? JSON.parse(atob(token.split(".")[1])).userId : null;
    } catch (e) { return null; }
  }, [token]);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await getChallenges();
      // Ensure we get latest data and ignore archived items
      setChallenges(res.data.filter(c => !c.is_archived));
    } catch (err) {
      console.error("Error fetching challenges", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();

    if (socket) {
      // 🔥 MASTER FIX: Listen for the global refresh signal
      // This ensures User B sees User A's challenge immediately
      socket.on("arena_list_updated", fetchChallenges);
      
      // Existing listeners for granular updates
      socket.on("challenge_created", fetchChallenges); 
      socket.on("challenge_finalized", fetchChallenges);
      socket.on("user_joined", fetchChallenges);
      socket.on("user_kicked", fetchChallenges);
      
      socket.on("challenge_started", (data) => {
        // We use the latest state via fetchChallenges or by finding in current state
        const challengeToStart = challenges.find(c => c.id === data.challengeId);
        const isParticipant = challengeToStart?.participants?.some(p => p.user.id === currentUserId);
        
        if (isParticipant) {
          toast.success("Battle Starting! Focus now.");
          navigate(`/live/${data.challengeId}`);
        } else {
          fetchChallenges();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("arena_list_updated");
        socket.off("challenge_created");
        socket.off("challenge_finalized");
        socket.off("user_joined");
        socket.off("user_kicked");
        socket.off("challenge_started");
      }
    };
    // Note: 'challenges' is included so the 'challenge_started' logic has access to the latest list
  }, [fetchChallenges, socket, challenges, currentUserId, navigate]);

  // 🔥 Case-Insensitive Filter Logic: Ensures nothing is hidden due to "Pending" vs "pending"
  const openArenas = useMemo(() => 
    challenges.filter(c => {
      const status = c.status?.toLowerCase();
      const type = c.type?.toLowerCase();
      
      const isPending = status === 'pending';
      // Solo arenas are private to the creator. Group arenas are public to everyone.
      const isMySolo = type === 'solo' && c.participants?.some(p => p.user.id === currentUserId);
      const isPublicGroup = type === 'group';
      
      return isPending && (isMySolo || isPublicGroup);
    }), [challenges, currentUserId]
  );

  const activeChallenges = useMemo(() => 
    challenges.filter(c => {
        const status = c.status?.toLowerCase();
        return status === 'active' && c.participants?.some(p => p.user.id === currentUserId);
    }), [challenges, currentUserId]
  );

  const historyChallenges = useMemo(() => 
    challenges.filter(c => {
        const status = c.status?.toLowerCase();
        return status === 'completed' || status === 'failed';
    }), [challenges]
  );

  const handleDeleteChallenge = async (id) => {
    try {
      await deleteChallenge(id);
      toast.success("Arena Cancelled. Coins Refunded.");
      fetchChallenges(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#070816] flex items-center justify-center font-bold uppercase tracking-widest text-[10px] text-gray-500">Loading Arenas...</div>;

  return (
    <div className="min-h-screen text-white px-6 py-8 bg-[#070816]">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent italic tracking-tighter">ARENA FEED</h1>
              <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">Real-time focus monitoring active</p>
            </div>
            <button onClick={fetchChallenges} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition border border-white/10 font-bold text-xs uppercase">↻ Refresh</button>
        </header>

        <section className="mb-12">
            <CreateChallengeForm onCreated={fetchChallenges} />
        </section>

        {/* --- OPEN ARENAS --- */}
        <section className="mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                Open Arenas
            </h2>
            {openArenas.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-gray-500 font-bold uppercase text-[10px]">
                    No joinable battles found. Create one to begin.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {openArenas.map((c) => (
                        <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} onDelete={handleDeleteChallenge} />
                    ))}
                </div>
            )}
        </section>

        {/* --- ACTIVE SESSIONS --- */}
        {activeChallenges.length > 0 && (
          <section className="mb-12">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-blue-400">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  My Active Battle
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChallenges.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} />
                  ))}
              </div>
          </section>
        )}

        {/* --- HISTORY --- */}
        {historyChallenges.length > 0 && (
          <section className="pb-20">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-6 text-gray-500">Battle History</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {historyChallenges.slice(0, 6).map((c) => (
                      <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} />
                  ))}
              </div>
          </section>
        )}
      </div>
    </div>
  );
}