type NoDataConfirmAlertProps = {
  show: boolean;
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const NoDataConfirmAlert = ({
  show,
  title = "No Data Found",
  message = "Please create at least one record to proceed.",
  cancelText = "Cancel",
  confirmText = "Yes",
  onCancel,
  onConfirm,
}: NoDataConfirmAlertProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-md bg-white p-6 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-600">
          {message}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoDataConfirmAlert;