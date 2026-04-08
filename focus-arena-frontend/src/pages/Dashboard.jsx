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

  /** 
   * FIX 1: STRICT ACTIVE SESSION CHECK
   * We only show the button if the challenge is 'active'.
   * If it is 'completed', 'failed', or 'pending' (waiting for launch), 
   * we don't show the "Resume" button on the dashboard header.
   */
  const activeSession = user?.participants?.find(p => 
    p.challenge?.status === 'active'
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
          
          {/* Resume button only appears for truly ACTIVE sessions */}
          {activeSession && (
            <Link to={`/live/${activeSession.id}`} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 animate-pulse border border-blue-400/30">
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

        {/* ACHIEVEMENTS SECTION */}
<div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm">
  <h2 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
    <Trophy size={20} className="text-yellow-500" />
    Achievement Medals
  </h2>

  {user?.badges?.length > 0 ? (
    /* We use 5 columns here to keep them small and looking like medals */
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {user.badges.map((b, index) => {
        // This handles the relationship logic
        const badgeData = b.badge ? b.badge : b;
        return <Badge key={index} badge={badgeData} />;
      })}
    </div>
  ) : (
    <div className="text-center text-gray-500 py-16 bg-black/20 rounded-3xl border border-dashed border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No medals earned yet</p>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition duration-500">{icon}</div>
      </div>
      <div className="text-4xl font-black italic">{value}</div>
    </div>
  );
}