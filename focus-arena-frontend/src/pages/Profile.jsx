import { useEffect, useState } from "react";
import axios from "../api/axios";
import Badge from "../components/Badge";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get("/users/profile");

        // ✅ SAFE FALLBACK
        const raw = userRes.data;

        const userData =
          raw.user ||
          raw.data ||
          raw;

        console.log("FINAL USER:", userData);

        setUser(userData);

        // ✅ SAFE CHALLENGE FETCH
        try {
          const challengeRes = await axios.get("/challenges");
          setChallenges(challengeRes.data || []);
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
      <div className="h-screen flex items-center justify-center text-gray-400 animate-pulse">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white px-6 py-10 space-y-10">

      {/* 🔷 PROFILE HEADER */}
      <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
        
        {/* glow effect */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-6 relative z-10">
          
          {/* avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
            {user.name?.charAt(0) || "U"}
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {user?.name ?? user?.email?.split("@")[0] ?? "User"}
            </h1>

            <p className="text-gray-400 mt-1">
              Level {user.level || 1} • 🔥 {Math.max(0, user.streak || 0)} day streak
            </p>
          </div>{(user.name || user.username || user.fullName || "U").charAt(0)}
        </div>
      </div>

      {/* 🔷 STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Stat title="Coins" value={user.coins || 0} color="text-yellow-400" />
        <Stat title="XP" value={user.xp || 0} color="text-blue-400" />
        <Stat title="Wins" value={user.wins || 0} color="text-green-400" />
        <Stat title="Losses" value={user.losses || 0} color="text-red-400" />
      </div>

      {/* 🔷 BADGES */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h2 className="text-xl font-semibold mb-6">🏆 Badges</h2>

        {user.badges?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {user.badges.map((b, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <Badge badge={b} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No badges yet</p>
        )}
      </div>

      {/* 🔷 HISTORY */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h2 className="text-xl font-semibold mb-6">📜 Challenge History</h2>

        {challenges.length > 0 ? (
          <div className="space-y-4">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center hover:bg-white/10 transition"
              >
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>

                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No challenges yet</p>
        )}
      </div>
    </div>
  );
}

/* 🔹 STAT CARD */
function Stat({ title, value, color }) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center hover:bg-white/10 transition">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

/* 🔹 STATUS BADGE */
function StatusBadge({ status }) {
  let color = "bg-gray-500/20 text-gray-300";

  if (status === "completed") color = "bg-green-500/20 text-green-400";
  if (status === "pending") color = "bg-yellow-500/20 text-yellow-400";
  if (status === "failed") color = "bg-red-500/20 text-red-400";

  return (
    <span className={`text-xs px-3 py-1 rounded-full ${color}`}>
      {status}
    </span>
  );
}