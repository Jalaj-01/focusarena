// import { Routes, Route } from "react-router-dom";

// import Home from "../pages/Home";
// import Login from "../pages/Login";
// import Register from "../pages/Register";
// import Dashboard from "../pages/Dashboard";
// import Challenge from "../pages/Challenge";
// import Leaderboard from "../pages/Leaderboard";
// import Profile from "../pages/Profile";
// import Matchmaking from "../pages/Matchmaking";
// import LiveChallenge from "../pages/LiveChallenge";
// import ChallengeAuto from "../pages/ChallengeAuto"; // ✅ ADD THIS
// import ProtectedRoute from "./ProtectedRoute"; // ✅ ADD THIS

// export default function AppRoutes() {
//   return (
//     <Routes>
//       {/* PUBLIC */}
//       <Route path="/" element={<Home />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />

//       {/* 🔒 PROTECTED ROUTES */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <Dashboard />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/challenge"
//         element={
//           <ProtectedRoute>
//             <Challenge />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/challenge/auto"
//         element={
//           <ProtectedRoute>
//             <ChallengeAuto /> {/* SOLO LOGIC */}
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/leaderboard"
//         element={
//           <ProtectedRoute>
//             <Leaderboard />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/profile"
//         element={
//           <ProtectedRoute>
//             <Profile />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/matchmaking"
//         element={
//           <ProtectedRoute>
//             <Matchmaking />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/challenge/:id"
//         element={
//           <ProtectedRoute>
//             <LiveChallenge />
//           </ProtectedRoute>
//         }
//       />

//       {/* 🔥 NEW: COMPLETION ROUTE (FIXED BLANK PAGE) */}
//       <Route
//         path="/challenge/:id/complete"
//         element={
//           <ProtectedRoute>
//             <div className="text-white flex items-center justify-center h-screen text-2xl">
//               Challenge Completed ✅
//             </div>
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }

import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Challenge from "../pages/Challenge";
import Leaderboard from "../pages/Leaderboard";
import Profile from "../pages/Profile";
import Matchmaking from "../pages/Matchmaking";
import LiveChallenge from "../pages/LiveChallenge";
import ChallengeAuto from "../pages/ChallengeAuto";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 🔒 PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenge"
        element={
          <ProtectedRoute>
            <Challenge />
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenge/auto"
        element={
          <ProtectedRoute>
            <ChallengeAuto />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/matchmaking"
        element={
          <ProtectedRoute>
            <Matchmaking />
          </ProtectedRoute>
        }
      />

      {/* 🔥 FIXED: Changed path from /challenge/:id to /live/:id to match Card logic */}
      <Route
        path="/live/:id"
        element={
          <ProtectedRoute>
            <LiveChallenge />
          </ProtectedRoute>
        }
      />

      {/* COMPLETION ROUTE */}
      <Route
        path="/challenge/:id/complete"
        element={
          <ProtectedRoute>
            <div className="text-white flex items-center justify-center h-screen text-2xl font-black uppercase tracking-widest italic">
              Challenge Completed ✅
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}