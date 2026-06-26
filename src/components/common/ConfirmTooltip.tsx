import { createPortal } from "react-dom";

const ConfirmTooltip = ({
  x,
  y,
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: any) => {
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
          className="px-2.5 py-0.5 rounded bg-red-500 text-white text-xs hover:bg-red-600 transition cursor-pointer"
        >
          {confirmText}
        </button>
        <button
          onClick={onCancel}
          className="px-2.5 py-0.5 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 transition cursor-pointer"
        >
          {cancelText}
        </button>
      </div>
    </div>,
    document.body
  );
};

const ListTooltip = ({
  x,
  y,
  items = [],
  onClose,
}: {
  x: number | null;
  y: number | null;
  items: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  onClose?: () => void;
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
      className="w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose?.();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition cursor-pointer
            ${item.danger
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
};

export { ListTooltip };
export default ConfirmTooltip;
