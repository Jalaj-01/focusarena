export default function UserStats({ user }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded shadow text-center">
        <p className="text-gray-500">Coins</p>
        <h2 className="text-xl font-bold">{user.coins}</h2>
      </div>

      <div className="bg-white p-4 rounded shadow text-center">
        <p className="text-gray-500">XP</p>
        <h2 className="text-xl font-bold">{user.xp}</h2>
      </div>

      <div className="bg-white p-4 rounded shadow text-center">
        <p className="text-gray-500">Level</p>
        <h2 className="text-xl font-bold">{user.level}</h2>
      </div>

      <div className="bg-white p-4 rounded shadow text-center">
        <p className="text-gray-500">Streak</p>
        <h2 className="text-xl font-bold">{user.streak}</h2>
      </div>
    </div>
  );
}