import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function ChallengeAuto() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const didRun = useRef(false); // 🔥 FIX: Prevents double creation in Strict Mode

  useEffect(() => {
    if (didRun.current) return; // Exit if already triggered
    didRun.current = true;

    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    const userStake = params.get("stake") || "10";
    const userDuration = params.get("duration") || "30";

    if (type === "solo") {
      setLoading(true);

      const createSolo = async () => {
        try {
          const token = localStorage.getItem("token");

          const res = await axios.post(
            "http://localhost:3000/challenges",
            {
              title: "Solo Focus Session",
              type: "solo",
              stake: Number(userStake),
              duration_minutes: Number(userDuration),
              status: "active",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const challengeId = res?.data?.id || res?.data?.challenge?.id;

          if (challengeId) {
            navigate(`/challenge/${challengeId}`, { replace: true });
          }
        } catch (err) {
          const errorMsg = err.response?.data?.message || "Creation failed";
          console.error("❌ Solo error:", errorMsg);
          toast.error(errorMsg);
          // Redirect to dashboard if there is already an ongoing challenge
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      };

      createSolo();
    }
  }, [location, navigate]);

  return (
    <div className="text-white flex justify-center items-center min-h-screen bg-[#0a0b1e]">
      <div className="flex flex-col items-center gap-4">
         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
         <p className="text-xl font-medium">Switching to Solo mode...</p>
      </div>
    </div>
  );
}