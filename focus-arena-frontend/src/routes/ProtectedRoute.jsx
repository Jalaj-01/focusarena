import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse text-gray-400">
        Loading...
      </div>
    </div>
  );
}

  if (!user) return <Navigate to="/login" />;

  return children;
}