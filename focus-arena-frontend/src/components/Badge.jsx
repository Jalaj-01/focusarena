export default function Badge({ badge, status }) {
  // 🔹 Status Badge Mode
  if (status) {
    const statusStyles = {
      pending: "bg-yellow-500 text-black",
      active: "bg-blue-500 text-white",
      completed: "bg-green-600 text-white",
      failed: "bg-red-600 text-white",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          statusStyles[status] || "bg-gray-500 text-white"
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  }

  // 🔹 Achievement Badge Mode (existing behavior)
  if (badge) {
    return (
      <div className="bg-yellow-100 p-3 rounded text-center shadow">
        <p className="font-semibold">{badge.name}</p>
      </div>
    );
  }

  return null;
}