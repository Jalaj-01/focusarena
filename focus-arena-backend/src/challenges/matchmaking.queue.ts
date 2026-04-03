export const matchmakingQueue: any[] = [];

export function addToQueue(user: any, prefs: any) {
  matchmakingQueue.push({ user, prefs });
}

export function findMatch(user: any) {
  return matchmakingQueue.find(
    (q) =>
      q.user.id !== user.id &&
      Math.abs(q.user.level - user.level) <= 2,
  );
}