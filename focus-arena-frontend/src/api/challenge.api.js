import axios from "./axios";

// ✅ GET ALL CHALLENGES
export const getChallenges = () => {
  return axios.get("/challenges");
};

// ✅ CREATE
export const createChallenge = (data) => {
  return axios.post("/challenges", data);
};

// ✅ START
export const startChallenge = (id) => {
  return axios.patch(`/challenges/${id}/start`);
};

// ✅ COMPLETE
export const completeChallenge = (id) => {
  return axios.patch(`/challenges/${id}/complete`);
};

// ✅ DELETE CHALLENGE (Stake Refund)
export const deleteChallenge = (id) => {
  return axios.delete(`/challenges/${id}`);
};