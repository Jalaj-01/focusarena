import { useEffect, useState } from "react";
import axios from "../api/axios";
import Badge from "../components/Badge";
import { 
  Trophy, 
  Flame, 
  Coins, 
  Star, 
  History, 
  User as UserIcon, 
  Swords, 
  Timer 
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get("/users/profile");
        const userData = userRes.data?.user || userRes.data?.data || userRes.data;
        setUser(userData);

        try {
          const challengeRes = await axios.get("/challenges");
          // Filter history to show only non-active sessions (completed or failed)
          const history = (challengeRes.data || []).filter(
            (c) => c.status === "completed" || c.status === "failed"
          );
          setChallenges(history);
        } catch {
          setChallenges([]);
        }
      } catch (err) {
        console.error("Profile error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-blue-400 font-black uppercase tracking-widest animate-pulse">
        Syncing Profile Data...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-red-400 font-bold">
        Failed to load profile. Please try logging in again.
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white px-6 py-10 space-y-10 bg-[#070816]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 🔷 PROFILE HEADER */}
        <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full rounded-full bg-[#0a0b1e] flex items-center justify-center text-4xl font-black italic">
                {user.name?.charAt(0) || "U"}
              </div>
            </div>

            <div className="text-center md:text-left space-y-2">
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                {user?.name || "Focus Warrior"}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase border border-blue-500/20">
                  <Star size={14} fill="currentColor" /> Level {user.level || 1}
                </div>
                <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-xs font-black uppercase border border-red-500/20">
                  <Flame size={14} fill="currentColor" /> {user.streak || 0} Day Streak
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔷 STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Coins" value={user.coins || 0} icon={<Coins className="text-yellow-400" />} />
          <StatCard title="Lifetime XP" value={user.xp || 0} icon={<Star className="text-blue-400" />} />
          <StatCard title="Arena Wins" value={user.wins || 0} icon={<Trophy className="text-green-400" />} />
          <StatCard title="Battles Lost" value={user.losses || 0} icon={<Swords className="text-red-400" />} />
        </div>

        
{/* 🔷 ACHIEVEMENTS (Update this section in your Profile.jsx) */}
<div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
  <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-gray-400">
    <Trophy size={18} className="text-yellow-500" /> Medal Collection
  </h2>

  {user.badges?.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {user.badges
        ?.filter((v, i, a) => a.findIndex(t => (t.badge?.name === v.badge?.name)) === i) // Filter duplicates in UI
        .map((b, i) => (
          <Badge key={i} badge={b} />
        ))}
    </div>
  ) : (
    <div className="text-center py-16 bg-black/20 rounded-3xl border border-dashed border-white/10">
      <Star size={40} className="mx-auto text-white/10 mb-4" />
      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No medals earned yet.</p>
    </div>
  )}
</div>

        {/* 🔷 BATTLE HISTORY */}
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3">
            <History className="text-blue-400" /> Battle History
          </h2>

          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 rounded-xl ${c.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {c.type === 'solo' ? <UserIcon size={20} /> : <Swords size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-lg group-hover:text-blue-400 transition-colors">{c.title}</p>
                      <div className="flex gap-4 text-[10px] uppercase font-black text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Coins size={10}/> {c.stake} Stake</span>
                        <span className="flex items-center gap-1"><Timer size={10}/> {c.duration_minutes}m Duration</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10 font-bold uppercase text-xs tracking-widest">Your focus journey hasn't started yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* 🔹 REUSABLE STAT CARD */
function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all group">
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{title}</p>
        <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black italic">{value}</p>
    </div>
  );
}

/* 🔹 STATUS BADGE */
function StatusBadge({ status }) {
  const styles = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  };

  return (
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}