import React from "react";
import { Trophy, Flame, Star, Coins, ShieldCheck, Target, Zap, Clock, Sun, Moon, Calendar, Gem, Medal, Crown, Ghost } from "lucide-react";

const badgeConfig = {
  "FIRST WIN": { icon: <Trophy size={16} />, color: "from-yellow-400 to-orange-500", text: "text-orange-950" },
  "STREAK MASTER": { icon: <Flame size={16} />, color: "from-red-500 to-rose-600", text: "text-white" },
  "ELITE FOCUSER": { icon: <ShieldCheck size={16} />, color: "from-blue-500 to-indigo-600", text: "text-white" },
  "RICH PLAYER": { icon: <Coins size={16} />, color: "from-emerald-400 to-green-600", text: "text-green-950" },
  "ZEN MASTER": { icon: <Target size={16} />, color: "from-cyan-400 to-blue-500", text: "text-cyan-950" },
  "HIGH ROLLER": { icon: <Gem size={16} />, color: "from-purple-500 to-fuchsia-700", text: "text-white" },
  "MARATHONER": { icon: <Clock size={16} />, color: "from-slate-400 to-slate-600", text: "text-white" },
  "EARLY BIRD": { icon: <Sun size={16} />, color: "from-amber-300 to-orange-400", text: "text-orange-950" },
  "NIGHT OWL": { icon: <Moon size={16} />, color: "from-indigo-600 to-slate-800", text: "text-white" },
  "WEEKEND WARRIOR": { icon: <Calendar size={16} />, color: "from-pink-400 to-rose-500", text: "text-white" },
  "PRO CHALLENGER": { icon: <Medal size={16} />, color: "from-gray-300 to-gray-400", text: "text-gray-900" },
  "MASTER OF FOCUS": { icon: <Crown size={16} />, color: "from-yellow-500 to-amber-600", text: "text-amber-950" },
  "CENTURION": { icon: <Zap size={16} />, color: "from-orange-500 to-red-600", text: "text-white" },
  "DOUBLE DIGIT": { icon: <Flame size={16} />, color: "from-rose-400 to-pink-500", text: "text-white" },
  "GOD MODE": { icon: <Ghost size={16} />, color: "from-slate-800 to-black", text: "text-white" },
  "DEFAULT": { icon: <Star size={16} />, color: "from-gray-600 to-gray-700", text: "text-gray-400" }
};

export default function Badge({ badge }) {
  if (!badge) return null;

  // 🔥 THE FIX: If the data is nested { badge: { name: '...' } }, we extract it automatically
  const actualBadgeData = badge.badge ? badge.badge : badge;
  
  const name = (actualBadgeData.name || "").toUpperCase().trim();
  const config = badgeConfig[name] || badgeConfig["DEFAULT"];

  return (
    <div className="relative group w-full">
      <div className={`
        flex flex-col items-center justify-center 
        p-3 rounded-2xl 
        bg-gradient-to-br ${config.color} 
        shadow-lg transition-all duration-300 
        hover:scale-105 cursor-default
        min-h-[85px] border border-white/10
      `}>
        
        {/* Compact Icon Bubble */}
        <div className={`p-2 bg-white/20 rounded-full mb-1.5 ${config.text}`}>
          {config.icon}
        </div>

        {/* Badge Name - Compact Text */}
        <p className={`text-[8px] font-black uppercase tracking-widest text-center ${config.text} leading-none`}>
          {actualBadgeData.name}
        </p>
      </div>
      
      {/* Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-black text-white text-[8px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-[100] pointer-events-none uppercase tracking-widest">
        {actualBadgeData.description || "Achievement"}
      </div>
    </div>
  );
}