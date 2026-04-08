import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function MatchmakingButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMatchmaking = async () => {
    try {
      setLoading(true);

      const res = await API.post("/matchmaking/find");

      const challengeId = res.data.challengeId;
      navigate(`/live/${challengeId}`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Matchmaking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMatchmaking}
      disabled={loading}
      className="w-full bg-purple-500 text-white p-2 rounded mb-6"
    >
      {loading ? "Finding opponent..." : "Find Opponent"}
    </button>
  );
}