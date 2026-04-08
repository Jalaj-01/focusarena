import React from "react";
import { Trophy, Flame, Star, Coins, ShieldCheck } from "lucide-react";

const badgeConfig = {
  "First Win": { 
    icon: <Trophy size={18} />, 
    color: "from-yellow-400 to-orange-500", 
    text: "text-orange-950" 
  },
  "Streak Master": { 
    icon: <Flame size={18} />, 
    color: "from-red-500 to-pink-600", 
    text: "text-red-50" 
  },
  "Elite Focuser": { 
    icon: <ShieldCheck size={18} />, 
    color: "from-blue-500 to-indigo-600", 
    text: "text-blue-50" 
  },
  "Rich Player": { 
    icon: <Coins size={18} />, 
    color: "from-green-400 to-emerald-600", 
    text: "text-green-950" 
  },
  "Default": { 
    icon: <Star size={18} />, 
    color: "from-gray-400 to-gray-600", 
    text: "text-white" 
  }
};

export default function Badge({ badge }) {
  // Safe check to prevent crash if badge is null
  if (!badge) return null;

  const config = badgeConfig[badge.name] || badgeConfig["Default"];

  return (
    <div className="relative group">
      <div className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg transition-all duration-300 hover:scale-110 hover:-rotate-3 cursor-pointer border border-white/20`}>
        <div className={`p-2 bg-white/20 rounded-full mb-2 ${config.text} shadow-inner`}>
          {config.icon}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-tighter text-center ${config.text} leading-none`}>
          {badge.name}
        </p>
      </div>
      
      {/* Gamified Tooltip */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#0a0b1e] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap z-[100] shadow-2xl pointer-events-none uppercase tracking-widest">
        {badge.description || "Earned Milestone"}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0b1e] rotate-45 border-b border-r border-white/10"></div>
      </div>
    </div>
  );
}