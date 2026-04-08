import { useEffect, useState } from "react";
import axios from "../api/axios";
import Badge from "../components/Badge";
import StreakCounter from "../components/StreakCounter";
import { Coins, Flame, Trophy, Star } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/users/profile");

        // ✅ HANDLE BOTH CASES (safe)
        const userData = res.data?.user || res.data;

        console.log("DASHBOARD USER:", userData); // debug

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

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold">
            Welcome back 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Let’s dominate your focus today
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <StatCard
            title="Coins"
            value={user?.coins ?? 0}
            icon={<Coins className="text-yellow-400" />}
          />

          <StatCard
            title="XP"
            value={user?.xp ?? 0}
            icon={<Star className="text-blue-400" />}
          />

          <StatCard
            title="Level"
            value={user?.level ?? 1}
            icon={<Trophy className="text-green-400" />}
          />

          <StatCard
            title="Streak"
            value={<StreakCounter value={Number(user?.streak || 0)} />}
            icon={<Flame className="text-red-400" />}
          />

        </div>

        {/* BADGES */}
        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-6">
            Your Badges 🏆
          </h2>

          {user?.badges && user.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.badges.map((b, index) => (
                <Badge key={index} badge={b} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-6">
              No badges yet. Complete challenges to earn some!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* 🔥 STAT CARD COMPONENT */
function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 
      hover:border-blue-500 transition group cursor-pointer">

      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{title}</p>
        {icon}
      </div>

      <div className="mt-4 text-3xl font-bold group-hover:scale-105 transition">
        {value}
      </div>
    </div>
  );
}