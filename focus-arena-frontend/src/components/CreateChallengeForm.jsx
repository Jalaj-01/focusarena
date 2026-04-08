import { useState, useEffect } from "react";
import { createChallenge } from "../api/challenge.api";
import toast from "react-hot-toast";
import { playClick } from "../utils/sound";

export default function CreateChallengeForm({ onCreated, prefill }) {
  const [title, setTitle] = useState("Focus Session");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState("solo");
  const [stake, setStake] = useState("10");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefill) {
      if (prefill.type) setType(prefill.type);
      if (prefill.duration_minutes) setDuration(String(prefill.duration_minutes));
      if (prefill.stake) setStake(String(prefill.stake));
    }
  }, [prefill]);

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Title required");
    
    // Simple frontend validation before even hitting the backend
    if (parseInt(stake) <= 0) return toast.error("Stake must be positive");
    if (parseInt(duration) <= 0) return toast.error("Duration must be at least 1 minute");

    try {
      setLoading(true);

      const res = await createChallenge({
        title,
        type,
        stake: parseInt(stake),
        duration_minutes: parseInt(duration),
      });

      toast.success("Challenge created 🎯");
      onCreated && onCreated(res.data);
    } catch (error) {
      // 🔥 DYNAMIC ERROR EXTRACTION
      // This grabs the specific "Stake too high" message from your NestJS Service
      const errorMessage = error.response?.data?.message || "Failed to create challenge";
      toast.error(errorMessage);
      console.error("Creation Error:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 mb-8">
      {prefill?.type && (
        <div className="mb-4 text-yellow-400 text-sm font-medium">
          ⚡ No match found — create your own challenge
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Create Challenge</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 ml-1">Title</label>
          <input
            className="p-3 rounded bg-white/5 border border-white/10 outline-none focus:border-blue-500 transition"
            placeholder="Focus Session"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 ml-1">Type</label>
          <select
            className="p-3 rounded bg-white/5 border border-white/10 outline-none focus:border-blue-500 transition"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="solo" className="bg-gray-900">Solo</option>
            <option value="group" className="bg-gray-900">Group</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 ml-1">Duration (Minutes)</label>
          <input
            type="number"
            className="p-3 rounded bg-white/5 border border-white/10 outline-none focus:border-blue-500 transition"
            placeholder="Minutes (e.g. 30)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 ml-1">Stake (Coins)</label>
          <input
            type="number"
            className="p-3 rounded bg-white/5 border border-white/10 outline-none focus:border-blue-500 transition"
            placeholder="Coins (e.g. 100)"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </div>
      </div>

      <button
        disabled={loading}
        onClick={() => {
          playClick();
          handleCreate();
        }}
        className={`mt-6 w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${
          loading 
            ? "bg-gray-600 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
        }`}
      >
        {loading ? "Creating..." : "Create Challenge"}
      </button>
    </div>
  );
}