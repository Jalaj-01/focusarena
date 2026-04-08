import API from "./axios";

// ✅ FIXED: correct endpoint
export const getMe = () => API.get("/users/profile");

export const getUserById = (id) => API.get(`/users/${id}`);