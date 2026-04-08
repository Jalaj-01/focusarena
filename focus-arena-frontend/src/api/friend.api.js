import API from "./axios";

export const addFriend = (data) =>
  API.post("/friends/add", data);

export const getFriends = () =>
  API.get("/friends");