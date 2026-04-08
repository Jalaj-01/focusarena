import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("/users/leaderboard");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="text-gray-400 animate-pulse p-6">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white px-6 py-8">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-8">
        🏆 Leaderboard
      </h1>

      {/* TABLE CONTAINER */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left">

            {/* HEADER */}
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-4 px-4">Rank</th>
                <th className="py-4 px-4">User</th>
                <th className="py-4 px-4">Coins</th>
                <th className="py-4 px-4">XP</th>
                <th className="py-4 px-4">Level</th>
                <th className="py-4 px-4">Streak</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {users.map((user, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <tr
                    key={user.id || index}
                    className={`border-b border-white/5 transition hover:bg-white/5 ${
                      isTop1
                        ? "bg-yellow-500/10"
                        : isTop2
                        ? "bg-gray-400/10"
                        : isTop3
                        ? "bg-orange-500/10"
                        : ""
                    }`}
                  >
                    {/* RANK */}
                    <td className="py-4 px-4 font-bold">
                      {isTop1 && "🥇"}
                      {isTop2 && "🥈"}
                      {isTop3 && "🥉"}
                      {!isTop1 && !isTop2 && !isTop3 && index + 1}
                    </td>

                    {/* USER */}
                    <td className="py-4 px-4 font-medium">
                      {user.name || "Anonymous"}
                    </td>

                    {/* COINS */}
                    <td className="py-4 px-4 text-yellow-400 font-semibold">
                      {user.coins}
                    </td>

                    {/* XP */}
                    <td className="py-4 px-4 text-blue-400">
                      {user.xp}
                    </td>

                    {/* LEVEL */}
                    <td className="py-4 px-4 text-green-400">
                      {user.level}
                    </td>

                    {/* STREAK */}
                    <td className="py-4 px-4 text-red-400">
                      🔥 {user.streak}
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>

      {/* EMPTY STATE */}
      {users.length === 0 && (
        <p className="text-center text-gray-400 mt-8">
          No leaderboard data available
        </p>
      )}
    </div>
  );
}