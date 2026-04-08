type QueueUser = {
  userId: string;
  level: number;
  stake: number;
  type: string;
};

export const matchmakingQueue: QueueUser[] = [];

export function addToQueue(user: QueueUser) {
  matchmakingQueue.push(user);
}

export function removeFromQueue(userId: string) {
  const index = matchmakingQueue.findIndex(u => u.userId === userId);
  if (index !== -1) matchmakingQueue.splice(index, 1);
}

export function findMatch(user: QueueUser) {
  return matchmakingQueue.find(
    (u) =>
      u.userId !== user.userId &&
      u.type === user.type &&
      u.stake === user.stake &&
      Math.abs(u.level - user.level) <= 2,
  );
}