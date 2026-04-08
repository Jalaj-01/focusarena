// import { useEffect, useState, useMemo, useCallback } from "react";
// import { getChallenges } from "../api/challenge.api";
// import { useLocation } from "react-router-dom";
// import { getSocket } from "../socket/socket";
// import CreateChallengeForm from "../components/CreateChallengeForm";
// import ChallengeCard from "../components/ChallengeCard";

// export default function Challenge() {
//   const [challenges, setChallenges] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const location = useLocation();
//   const socket = getSocket();

//   const prefill = useMemo(() => {
//     const params = new URLSearchParams(location.search);
//     const mode = params.get("type") || params.get("mode");
//     return {
//       type: mode === "solo" ? "solo" : (mode === "group" ? "group" : undefined),
//       duration_minutes: params.get("duration") ? Number(params.get("duration")) : undefined,
//       stake: params.get("stake") ? Number(params.get("stake")) : undefined,
//     };
//   }, [location.search]);

//   const fetchChallenges = useCallback(async () => {
//     try {
//       const res = await getChallenges();
//       // Show everything that isn't specifically archived (deleted)
//       const list = res.data.filter(c => !c.is_archived);
//       setChallenges(list);
//     } catch (err) {
//       console.error("Error fetching challenges", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchChallenges();

//     if (socket) {
//       socket.on("challenge_finalized", (data) => {
//           // Instead of removing, we refresh to update the status to 'completed'
//           fetchChallenges(); 
//       });
//     }

//     const interval = setInterval(fetchChallenges, 10000); // Poll every 10s as fallback
//     return () => {
//       if (socket) socket.off("challenge_finalized");
//       clearInterval(interval);
//     };
//   }, [fetchChallenges, socket]);

//   return (
//     <div className="min-h-screen text-white px-6 py-8 bg-[#070816]">
//       <div className="max-w-6xl mx-auto">
//         <header className="flex justify-between items-center mb-8">
//             <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">🔥 Arena</h1>
//             <button onClick={fetchChallenges} className="text-xs text-gray-500 hover:text-white transition">↻ Refresh</button>
//         </header>

//         <section className="mb-12">
//             <CreateChallengeForm onCreated={fetchChallenges} prefill={prefill} />
//         </section>

//         <section>
//             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
//                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                 Battles & History
//             </h2>

//             {loading ? (
//                 <div className="flex justify-center py-20 animate-pulse text-blue-400">Loading arena...</div>
//             ) : challenges.length === 0 ? (
//                 <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center text-gray-400">No sessions found.</div>
//             ) : (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {challenges.map((c) => (
//                         <ChallengeCard key={c.id} challenge={c} refresh={fetchChallenges} />
//                     ))}
//                 </div>
//             )}
//         </section>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useMemo, useCallback } from "react";
import { getChallenges, deleteChallenge } from "../api/challenge.api"; 
import { useLocation } from "react-router-dom";
import { getSocket } from "../socket/socket";
import CreateChallengeForm from "../components/CreateChallengeForm";
import ChallengeCard from "../components/ChallengeCard";
import toast from "react-hot-toast";

export default function Challenge() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const socket = getSocket();

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await getChallenges();
      // Keep all non-archived challenges (both live and completed)
      const allChallenges = res.data.filter(c => !c.is_archived);
      setChallenges(allChallenges);
    } catch (err) {
      console.error("Error fetching challenges", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler for deleting a pending challenge
  const handleDeleteChallenge = async (id) => {
    try {
      await deleteChallenge(id);
      toast.success("Challenge deleted and stake refunded");
      fetchChallenges(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete challenge");
    }
  };

  useEffect(() => {
    fetchChallenges();

    if (socket) {
      socket.on("challenge_finalized", () => fetchChallenges());
      socket.on("user_joined", () => fetchChallenges());
    }

    const interval = setInterval(fetchChallenges, 10000);
    return () => {
      if (socket) {
        socket.off("challenge_finalized");
        socket.off("user_joined");
      }
      clearInterval(interval);
    };
  }, [fetchChallenges, socket]);

  // Split challenges into Live and History categories
  const liveChallenges = useMemo(() => 
    challenges.filter(c => c.status === 'active' || c.status === 'pending'),
    [challenges]
  );

  const historyChallenges = useMemo(() => 
    challenges.filter(c => c.status === 'completed'),
    [challenges]
  );

  return (
    <div className="min-h-screen text-white px-6 py-8 bg-[#070816]">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">🔥 Arena</h1>
            <button onClick={fetchChallenges} className="text-xs text-gray-500 hover:text-white transition">↻ Refresh</button>
        </header>

        <section className="mb-12">
            <CreateChallengeForm onCreated={fetchChallenges} />
        </section>

        {/* --- LIVE CHALLENGES SECTION --- */}
        <section className="mb-16">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Live Challenges
            </h2>

            {loading ? (
                <div className="flex justify-center py-20 animate-pulse text-blue-400">Loading arena...</div>
            ) : liveChallenges.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center text-gray-400">No active sessions found. Start one above!</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveChallenges.map((c) => (
                        <ChallengeCard 
                          key={c.id} 
                          challenge={c} 
                          refresh={fetchChallenges} 
                          onDelete={handleDeleteChallenge} 
                        />
                    ))}
                </div>
            )}
        </section>

        {/* --- BATTLE HISTORY SECTION --- */}
        {historyChallenges.length > 0 && (
          <section className="pb-20">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Battle History
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                  {historyChallenges.map((c) => (
                      <ChallengeCard 
                        key={c.id} 
                        challenge={c} 
                        refresh={fetchChallenges} 
                      />
                  ))}
              </div>
          </section>
        )}
      </div>
    </div>
  );
}