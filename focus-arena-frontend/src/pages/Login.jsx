// import { useState, useContext } from "react";
// import { loginAPI } from "../api/auth.api";
// import { useNavigate, Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { AuthContext } from "../context/AuthContext";
// import { playClick } from "../utils/sound";

// export default function Login() {
//   const navigate = useNavigate();
//   const { login } = useContext(AuthContext); // ✅ IMPORTANT

//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async () => {
//     if (!form.email || !form.password) {
//       return toast.error("All fields are required");
//     }

//     try {
//       setLoading(true);

//       const res = await loginAPI(form);

//       // ✅ THIS IS THE FIX
//       await login(res.data);

// toast.success("Welcome back 🚀");

// // 🔥 delay navigation to allow context update
// setTimeout(() => {
//   navigate("/dashboard");
// }, 100);

//     } catch (err) {
//       toast.error(err.response?.data?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-6 text-white">
//       <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">

//         <h2 className="text-2xl font-bold text-center mb-6">
//           Welcome Back 👋
//         </h2>

//         <div className="space-y-4">
//           <input
//             name="email"
//             placeholder="Email"
//             className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500"
//             onChange={handleChange}
//           />

//           <input
//             name="password"
//             type="password"
//             placeholder="Password"
//             className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500"
//             onChange={handleChange}
//           />

//           <button
//             onClick={() => {
//               playClick();
//               handleSubmit();
//             }}
//             disabled={loading}
//             className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition disabled:bg-gray-500"
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>
//         </div>

//         <p className="mt-5 text-sm text-center text-gray-400">
//           Don't have an account?{" "}
//           <Link to="/register" className="text-blue-400 hover:underline">
//             Register
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

import { useState, useContext, useEffect } from "react"; // Added useEffect
import { loginAPI } from "../api/auth.api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { playClick } from "../utils/sound";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext); // Added user from context

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // 🔥 REDIRECT IF ALREADY LOGGED IN
  // This prevents the "stuck on login page" issue
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      return toast.error("All fields are required");
    }

    try {
      setLoading(true);

      const res = await loginAPI(form);

      // ✅ THIS IS THE FIX: Wait for login context to update
      await login(res.data);

      toast.success("Welcome back 🚀");

      // 🔥 Force navigation after a tiny delay
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 150);

    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">

        <h2 className="text-2xl font-bold text-center mb-6 italic uppercase tracking-tighter">
          Welcome Back 👋
        </h2>

        <div className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            onChange={handleChange}
            value={form.email}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            onChange={handleChange}
            value={form.password}
          />

          <button
            onClick={() => {
              playClick();
              handleSubmit();
            }}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-black uppercase tracking-widest text-sm disabled:bg-gray-700 shadow-xl shadow-blue-900/20"
          >
            {loading ? "Verifying..." : "Enter Arena"}
          </button>
        </div>

        <p className="mt-8 text-xs text-center text-gray-500 font-bold uppercase tracking-widest">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Join Now
          </Link>
        </p>
      </div>
    </div>
  );
}