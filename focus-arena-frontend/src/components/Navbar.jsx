import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Home,
  Trophy,
  User,
  Target,
  LayoutDashboard,
  LogOut,
  Zap,
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ SAFE CONTEXT (prevents crash)
  const auth = useContext(AuthContext) || {};
  const user = auth.user;
  const logout = auth.logout || (() => {});

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Challenges", path: "/challenge", icon: Target },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { name: "Match", path: "/matchmaking", icon: Zap },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center">
      <div className="w-[95%] max-w-6xl px-6 py-3 rounded-full 
        bg-white/5 backdrop-blur-xl border border-white/10 
        flex items-center justify-between shadow-lg">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <Home size={20} className="text-blue-400" />
          <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            FocusArena
          </span>
        </Link>

        {/* NAV */}
        {user && (
          <div className="flex items-center gap-6 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 transition ${
                    isActive
                      ? "text-blue-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* AUTH */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500"
              >
                Get Started
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-400 hover:text-red-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}