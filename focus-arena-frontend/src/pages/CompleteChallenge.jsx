import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";

export default function CompleteChallenge() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("success");
  const [loading, setLoading] = useState(true); // Start loading to check security

  // 🛡️ SECURITY CHECK ON MOUNT
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const res = await axios.get(`/challenges/${id}`);
        const challenge = res.data;

        const now = Date.now();
        const endTime = new Date(challenge.end_time).getTime();

        // 1. Prevent early access
        if (now < endTime) {
          toast.error("Timer is still running! Go back.");
          navigate(`/challenge/${id}`);
          return;
        }

        // 2. Prevent cheaters (fetch current user via local token)
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentUserId = payload.userId;

        const participant = challenge.participants.find(p => p.user.id === currentUserId);
        
        if (participant && participant.warnings > 3) {
          toast.error("Challenge failed due to violations.");
          navigate("/dashboard");
          return;
        }

        setLoading(false);
      } catch (err) {
        toast.error("Unauthorized access");
        navigate("/dashboard");
      }
    };

    checkSecurity();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Upload proof");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("status", status);

      // Submit Proof
      await axios.post(`/challenges/${id}/proof`, formData);
      
      // Call Complete API (Server will do final check)
      await axios.post(`/challenges/${id}/complete`, { status });

      toast.success("Challenge completed successfully! 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to complete challenge";
      toast.error(msg);
      if (msg.includes("violations")) navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white text-xl animate-pulse">
        Verifying Focus Session Integrity...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
        <h1 className="text-2xl font-bold mb-6 text-center">Submit Proof</h1>
        <p className="text-gray-400 text-sm mb-4 text-center">Upload a screenshot of your finished work</p>
        
        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" />

        {preview && <img src={preview} alt="Preview" className="w-full h-60 object-cover rounded mb-4 border border-white/20 shadow-xl" />}

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full mb-4 p-3 rounded bg-gray-800 border border-white/10 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="success">Success (Completed Goal)</option>
          <option value="fail">Fail (Did not finish goal)</option>
        </select>

        <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 transition disabled:bg-gray-700 font-bold text-lg shadow-lg shadow-green-900/20">
          {loading ? "Finalizing..." : "Finish Challenge"}
        </button>
      </div>
    </div>
  );
}