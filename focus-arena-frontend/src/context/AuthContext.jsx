import { createContext, useState, useEffect } from "react";
import { getMe } from "../api/user.api";
import { connectSocket, disconnectSocket } from "../socket/socket";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await getMe();

          // ✅ FIX HERE
          const userData = res.data?.user || res.data;

          setUser(userData);
          connectSocket();
        }
      } catch {
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (data) => {
    const token = data.access_token || data.accessToken;

    localStorage.setItem("token", token);

    try {
      const res = await getMe();

      // ✅ FIX HERE
      const userData = res.data?.user || res.data;

      setUser(userData);
      connectSocket();
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};