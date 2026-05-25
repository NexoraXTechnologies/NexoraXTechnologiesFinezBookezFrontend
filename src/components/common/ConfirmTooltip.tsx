import React from "react";
import { createPortal } from "react-dom";

const ConfirmTooltip = ({
  x,
  y,
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (x === null || y === null) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        zIndex: 9999,
      }}
      className="bg-gray-50 border border-gray-200 shadow-lg rounded-md px-3 py-2 w-44"
    >
      <p className="text-xs text-center text-gray-800 font-medium mb-2">
        {message}
      </p>
      <div className="flex justify-center gap-2">
        <button
          onClick={onConfirm}
          className="px-2.5 py-0.5 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition"
        >
          {confirmText}
        </button>
        <button
          onClick={onCancel}
          className="px-2.5 py-0.5 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition"
        >
          {cancelText}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmTooltip;
