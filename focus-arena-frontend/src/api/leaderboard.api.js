import API from "./axios";

export const getLeaderboard = () =>
  API.get("/leaderboard");