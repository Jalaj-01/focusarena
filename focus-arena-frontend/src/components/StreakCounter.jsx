import { useEffect, useState } from "react";

export default function StreakCounter({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 1;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className="text-red-400 font-bold text-xl">
      🔥 {display}
    </span>
  );
}