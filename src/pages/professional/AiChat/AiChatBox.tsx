import React from "react";

const AiChatBox = ({ onClick }) => {
  return (
    <>
      <div
        onClick={onClick}
        className="inline-flex perspective-[800px] cursor-pointer"
      >
        <div className="relative rounded-full overflow-hidden group px-8 py-3">
          {/* === EDGE-TRAVELING BORDER === */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 300 60"
            preserveAspectRatio="none"
          >
            {/* base border */}
            <rect
              x="2"
              y="2"
              width="296"
              height="56"
              rx="28"
              ry="28"
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="7"
            />

            {/* moving long light with small gap */}
            <rect
              x="2"
              y="2"
              width="296"
              height="56"
              rx="28"
              ry="28"
              fill="none"
              stroke="url(#aiGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="600 400"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-880"
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>

            {/* gradient */}
            <defs>
              <linearGradient
                id="aiGradient"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="300"
                y2="0"
              >
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="30%" stopColor="#34A853" />
                <stop offset="60%" stopColor="#FBBC05" />
                <stop offset="100%" stopColor="#EA4335" />
              </linearGradient>
            </defs>
          </svg>

          {/* === HOVER GLOW (same style) === */}
          <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-tr from-blue-500 via-green-400 to-yellow-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-tr from-blue-500 via-green-400 to-yellow-400 animate-pulse [animation-delay:.6s]" />
          </div>

          {/* === BUTTON CONTENT === */}
          <span className="relative font-semibold tracking-wide whitespace-nowrap">
            Ai.Tax Copilot
          </span>
        </div>
      </div>
    </>
  );
};

export default AiChatBox;
