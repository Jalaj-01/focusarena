// import { useEffect, useState } from "react";
// import axios from "../api/axios";
// import Badge from "../components/Badge";
// import StreakCounter from "../components/StreakCounter";
// import { Coins, Flame, Trophy, Star } from "lucide-react";

// export default function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await axios.get("/users/profile");

//         // ✅ HANDLE BOTH CASES (safe)
//         const userData = res.data?.user || res.data;

//         console.log("DASHBOARD USER:", userData); // debug

//         setUser(userData);
//       } catch (err) {
//         console.error("Failed to fetch user:", err);
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, []);

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center text-gray-400">
//         <div className="animate-pulse space-y-4 w-64">
//           <div className="h-6 bg-white/10 rounded"></div>
//           <div className="h-40 bg-white/10 rounded"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="h-screen flex items-center justify-center text-red-500">
//         Failed to load dashboard
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen px-6 py-10">
//       <div className="max-w-6xl mx-auto space-y-10">

//         {/* HEADER */}
//         <div>
//           <h1 className="text-4xl font-bold">
//             Welcome back 👋
//           </h1>
//           <p className="text-gray-400 mt-2">
//             Let’s dominate your focus today
//           </p>
//         </div>

//         {/* STATS */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

//           <StatCard
//             title="Coins"
//             value={user?.coins ?? 0}
//             icon={<Coins className="text-yellow-400" />}
//           />

//           <StatCard
//             title="XP"
//             value={user?.xp ?? 0}
//             icon={<Star className="text-blue-400" />}
//           />

//           <StatCard
//             title="Level"
//             value={user?.level ?? 1}
//             icon={<Trophy className="text-green-400" />}
//           />

//           <StatCard
//             title="Streak"
//             value={<StreakCounter value={Number(user?.streak || 0)} />}
//             icon={<Flame className="text-red-400" />}
//           />

//         </div>

//         {/* BADGES */}
//         <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
//           <h2 className="text-xl font-semibold mb-6">
//             Your Badges 🏆
//           </h2>

//           {user?.badges && user.badges.length > 0 ? (
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {user.badges.map((b, index) => (
//                 <Badge key={index} badge={b} />
//               ))}
//             </div>
//           ) : (
//             <div className="text-center text-gray-400 py-6">
//               No badges yet. Complete challenges to earn some!
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }

// /* 🔥 STAT CARD COMPONENT */
// function StatCard({ title, value, icon }) {
//   return (
//     <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 
//       hover:border-blue-500 transition group cursor-pointer">

//       <div className="flex justify-between items-center">
//         <p className="text-gray-400 text-sm">{title}</p>
//         {icon}
//       </div>

//       <div className="mt-4 text-3xl font-bold group-hover:scale-105 transition">
//         {value}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import axios from "../api/axios";
import Badge from "../components/Badge";
import StreakCounter from "../components/StreakCounter";
import { Coins, Flame, Trophy, Star, ArrowRight, Timer } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/users/profile");
        const userData = res.data?.user || res.data;
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Find if user has an ongoing challenge
  const activeSession = user?.participants?.find(p => 
    p.challenge?.status === 'active' || p.challenge?.status === 'pending'
  )?.challenge;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        <div className="animate-pulse space-y-4 w-64">
          <div className="h-6 bg-white/10 rounded"></div>
          <div className="h-40 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) return <div className="h-screen flex items-center justify-center text-red-500">Failed to load dashboard</div>;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Welcome back, {user.name} 👋</h1>
            <p className="text-gray-400 mt-2">Let’s dominate your focus today</p>
          </div>
          {activeSession && (
            <Link to={`/live/${activeSession.id}`} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-bold transition animate-pulse">
              <Timer size={20} />
              Resume Active Session
              <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Coins" value={user?.coins ?? 0} icon={<Coins className="text-yellow-400" />} />
          <StatCard title="XP" value={user?.xp ?? 0} icon={<Star className="text-blue-400" />} />
          <StatCard title="Level" value={user?.level ?? 1} icon={<Trophy className="text-green-400" />} />
          <StatCard title="Streak" value={<StreakCounter value={Number(user?.streak || 0)} />} icon={<Flame className="text-red-400" />} />
        </div>

        {/* BADGES SECTION */}
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Achievements
          </h2>

          {user?.badges?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.badges.map((b, index) => (
                <Badge key={index} badge={b} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10 bg-black/20 rounded-2xl border border-dashed border-white/10">
              No badges yet. Start a challenge to prove your focus!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group">
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}