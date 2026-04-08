import { useState } from "react";
import { registerAPI } from "../api/auth.api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { playClick } from "../utils/sound";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.name) {
      return toast.error("All fields are required");
    }

    try {
      setLoading(true);
      await registerAPI(form);

      toast.success("Account created 🎉");
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">

        <h2 className="text-2xl font-bold text-center mb-6">
          Create Account 🚀
        </h2>

        <div className="space-y-4">
          <input
            name="name"
            placeholder="Name"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-green-500"
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-green-500"
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-green-500"
            onChange={handleChange}
          />

          <button
            onClick={() => {
              playClick();
              handleSubmit();
            }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 active:scale-95 transition disabled:bg-gray-500"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>

        <p className="mt-5 text-sm text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}