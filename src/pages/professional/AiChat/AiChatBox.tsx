import { Sparkles, BotMessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const AiChatBox = ({ onClick }: any) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="
        group relative inline-flex items-center gap-3 overflow-hidden
        rounded-2xl border border-blue-200/70
        bg-white px-4 py-3
        text-sm font-black text-slate-900
        shadow-[0_14px_35px_rgba(37,99,235,0.18)]
        transition-all duration-300
        hover:border-blue-300
        hover:shadow-[0_18px_45px_rgba(37,99,235,0.26)]
      "
    >
      {/* soft gradient background */}
      <span
        className="
          absolute inset-0 bg-gradient-to-r
          from-blue-50 via-indigo-50 to-cyan-50
          opacity-100 transition-opacity duration-300
          group-hover:opacity-100
        "
      />

      {/* moving shine */}
      <span
        className="
          pointer-events-none absolute inset-y-0 -left-12 w-10
          rotate-12 bg-white/80 blur-md
          transition-all duration-700
          group-hover:left-[120%]
        "
      />

      {/* icon */}
      <span
        className="
          relative z-10 flex h-9 w-9 shrink-0 items-center justify-center
          rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600
          text-white shadow-md shadow-blue-200
        "
      >
        <BotMessageSquare size={18} />
      </span>

      {/* text */}
      <span className="relative z-10 flex flex-col items-start leading-none">
        <span className="flex items-center gap-1.5 text-sm font-black text-slate-950">
          Ask AI
          <Sparkles size={13} className="text-blue-600" />
        </span>

        <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Tax Copilot
        </span>
      </span>

      {/* right pulse dot */}
      <span className="relative z-10 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
    </motion.button>
  );
};

export default AiChatBox;