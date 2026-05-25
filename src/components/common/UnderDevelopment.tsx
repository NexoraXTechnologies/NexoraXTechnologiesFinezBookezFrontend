import React from "react";

const UnderDevelopment = ({ size = 180 }) => {
  return (
    <div className="flex flex-col items-center text-gray-600 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gear */}
        <g>
          <circle cx="100" cy="100" r="35" stroke="#6e7cdb" strokeWidth="8" />
          <g transform="translate(100 100)">
            <g>
              <rect
                x="-8"
                y="-60"
                width="16"
                height="25"
                rx="4"
                fill="#6e7cdb"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          </g>
        </g>

        {/* Dots Loading */}
        <circle cx="60" cy="160" r="8" fill="#6e7cdb">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1s"
            begin="0s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="100" cy="160" r="8" fill="#6e7cdb">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="140" cy="160" r="8" fill="#6e7cdb">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      <p className="mt-4 text-lg font-semibold">Under Development</p>
    </div>
  );
};

export default UnderDevelopment;