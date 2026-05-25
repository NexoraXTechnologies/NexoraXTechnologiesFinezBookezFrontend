import React from "react";
import AiTaxCopilot from "./AiTaxCopilot";

const AiTaxCopilotDrawer = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <>
      {/* Chatbot Popup */}
      <div
        className="
          fixed bottom-6 right-6 z-50
          w-[430px] h-[650px]
          bg-white rounded-2xl
          shadow-2xl border
          flex flex-col
        "
      >
        <AiTaxCopilot onClose={onClose} />
      </div>
    </>
  );
};

export default AiTaxCopilotDrawer;