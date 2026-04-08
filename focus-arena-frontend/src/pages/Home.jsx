import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-100px] w-[300px] h-[300px] bg-purple-500/20 blur-[120px] rounded-full"></div>

      {/* HERO */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-28 max-w-4xl mx-auto">

        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          Turn Focus into{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Competition
          </span>
        </h1>

        <p className="mt-6 text-gray-400 max-w-xl text-lg">
          FocusArena helps you stay productive by turning your work sessions
          into challenges. Compete, earn rewards, and build unstoppable focus.
        </p>

        {/* CTA */}
        <div className="mt-10 flex gap-4 flex-wrap justify-center">

          <Link
            to={user ? "/challenge" : "/register"}
            className="px-7 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition shadow-xl shadow-blue-500/20"
          >
            Start Now 🚀
          </Link>

          <Link
            to={user ? "/challenge" : "/login"}
            className="px-7 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition"
          >
            Explore App
          </Link>

        </div>
      </div>

      {/* FEATURES */}
      <div className="grid md:grid-cols-3 gap-6 px-6 max-w-6xl mx-auto pb-28">
        {[
          {
            title: "Focus Challenges",
            desc: "Create timed sessions and stay accountable.",
          },
          {
            title: "Earn Coins & XP",
            desc: "Gamified rewards to keep you motivated.",
          },
          {
            title: "Compete with Others",
            desc: "Real-time matchmaking for serious focus battles.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-blue-500 transition"
          >
            <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {item.title}
            </h3>
            <p className="text-gray-400 mt-3">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center pb-24 px-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to dominate your focus?
        </h2>

        <p className="text-gray-400 mt-4">
          Join now and start building your streak.
        </p>

        <Link
          to={user ? "/challenge" : "/register"}
          className="inline-block mt-8 px-10 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
        >
          Join FocusArena
        </Link>
      </div>

      {/* FOOTER */}
      <div className="text-center py-6 border-t border-white/10 text-gray-500 text-sm">
        © {new Date().getFullYear()} FocusArena — Built by Jalaj 🚀
      </div>
    </div>
  );
}