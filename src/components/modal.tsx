// import React from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { PrimaryButton, SecondaryButton } from "./buttons";
// import { X } from "lucide-react";

// type ModalProps = {
//     show: boolean;
//     setShow: (value: boolean) => void;
//     handleSubmit: () => void;
//     handleClose: () => void;
//     state: boolean;
//     body: React.ReactNode;
//     title: string;
//     loader: boolean;
//     // Optional dynamic props
//     gridCols?: 1 | 2 | 3 | 4;
//     maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
//     bodyClassName?: string;
//     headerClassName?: string;
//     footerClassName?: string;
// };

// const gridColsClass: Record<number, string> = {
//     1: "grid-cols-1",
//     2: "grid-cols-1 md:grid-cols-2",
//     3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
//     4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
// };

// const maxWidthClass: Record<string, string> = {
//     sm: "max-w-sm",
//     md: "max-w-md",
//     lg: "max-w-lg",
//     xl: "max-w-xl",
//     "2xl": "max-w-2xl",
//     "3xl": "max-w-3xl",
//     "4xl": "max-w-4xl",
//     "5xl": "max-w-5xl",
// };

// const Modal = ({
//     show,
//     setShow,
//     handleSubmit,
//     state,
//     body,
//     handleClose = () => null,
//     title,
//     loader = false,
//     // Default old values, so other components stay same
//     gridCols = 2,
//     maxWidth = "3xl",
//     bodyClassName = "",
//     headerClassName = "",
//     footerClassName = "",
// }: ModalProps) => {
//     return (
//         <AnimatePresence>
//             {show && (
//                 <motion.div
//                     className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     transition={{ duration: 0.2 }}
//                 >
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.9, y: 40 }}
//                         animate={{ opacity: 1, scale: 1, y: 0 }}
//                         exit={{ opacity: 0, scale: 0.9, y: 20 }}
//                         transition={{
//                             type: "spring",
//                             stiffness: 260,
//                             damping: 20,
//                         }}
//                         className={`relative w-full ${maxWidthClass[maxWidth]} max-h-[90vh] rounded-md bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col`}
//                     >
//                         {/* Header */}
//                         <div className={`flex items-center justify-between border-b border-gray-300 px-6 py-3 bg-gray-50 shrink-0 ${headerClassName}`}
//                         >
//                             <div>
//                                 <h2 className="text-xl font-semibold text-gray-800 mb-0">
//                                     {state ? `Edit ${title}` : `Add New ${title}`}
//                                 </h2>

//                                 <p className="text-sm text-gray-500">
//                                     Fill in the {title.toLowerCase()} details below
//                                 </p>
//                             </div>

//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     handleClose();
//                                     setShow(false)
//                                 }}
//                                 className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
//                             >
//                                 <X size={18} className="text-gray-600" />
//                             </button>
//                         </div>

//                         {/* Body */}
//                         <div
//                             className={`p-6 grid ${gridColsClass[gridCols]} gap-4 text-sm overflow-y-auto ${bodyClassName}`}
//                         >
//                             {body}
//                         </div>

//                         {/* Footer */}
//                         <div
//                             className={`flex justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4 shrink-0 ${footerClassName}`}
//                         >
//                             <SecondaryButton
//                                 callBackFn={() => {
//                                     handleClose()
//                                     setShow(false)
//                                 }}
//                                 text="Cancel"
//                             />

//                             <PrimaryButton
//                                 disabled={loader}
//                                 callBackFn={handleSubmit}
//                                 text={loader ? "Loading.." : (state ? "Update" : "Save")}
//                             />
//                         </div>
//                     </motion.div>
//                 </motion.div>
//             )}
//         </AnimatePresence>
//     );
// };

// export default Modal;




// // warning model


// type NoDataConfirmAlertProps = {
//   show: boolean;
//   title?: string;
//   message?: string;
//   cancelText?: string;
//   confirmText?: string;
//   onCancel: () => void;
//   onConfirm: () => void;
// };

// const WarningModel = ({
//   show,
//   title = "No Data Found",
//   message = "Please create at least one record to proceed.",
//   cancelText = "Cancel",
//   confirmText = "Yes",
//   onCancel,
//   onConfirm,
// }: NoDataConfirmAlertProps) => {
//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
//       <div className="w-full max-w-md rounded-md bg-white p-6 text-center shadow-2xl">
//         <h2 className="text-2xl font-bold text-slate-900">
//           {title}
//         </h2>

//         <p className="mt-4 text-base leading-7 text-slate-600">
//           {message}
//         </p>

//         <div className="mt-7 grid grid-cols-2 gap-4">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="rounded-md border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
//           >
//             {cancelText}
//           </button>

//           <button
//             type="button"
//             onClick={onConfirm}
//             className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
//           >
//             {confirmText}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export {WarningModel};








import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { X } from "lucide-react";

type ModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    handleSubmit: () => void;
    handleClose: () => void;
    state: boolean;
    body: React.ReactNode;
    title: string;
    loader: boolean;

    // Optional dynamic props
    gridCols?: 1 | 2 | 3 | 4 | 12;
    maxWidth?:
        | "sm"
        | "md"
        | "lg"
        | "xl"
        | "2xl"
        | "3xl"
        | "4xl"
        | "5xl"
        | "6xl"
        | "7xl"
        | "full";

    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;

    // New optional props, safe for existing usage
    modalClassName?: string;
    overlayClassName?: string;
    hideFooter?: boolean;
};

const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    12: "grid-cols-1",
};

const maxWidthClass: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",

    // Only used when you pass maxWidth="full"
    full: "w-[98vw] max-w-[98vw]",
};

const Modal = ({
    show,
    setShow,
    handleSubmit,
    state,
    body,
    handleClose = () => null,
    title,
    loader = false,

    // Default old values, so other components stay same
    gridCols = 2,
    maxWidth = "3xl",
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",

    // New optional values
    modalClassName = "",
    overlayClassName = "",
    hideFooter = false,
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${overlayClassName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className={`
                            relative flex w-full max-h-[90vh] flex-col overflow-hidden
                            rounded-md border border-gray-100 bg-white shadow-2xl
                            ${maxWidthClass[maxWidth] || maxWidthClass["3xl"]}
                            ${modalClassName}
                        `}
                    >
                        {/* Header */}
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3 ${headerClassName}`}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                    {state ? `Edit ${title}` : `${title}`}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Fill in the {title.toLowerCase()} details below
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    setShow(false);
                                }}
                                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm
                                ${gridColsClass[gridCols] || gridColsClass[2]}
                                ${bodyClassName}
                            `}
                        >
                            {body}
                        </div>

                        {/* Footer */}
                        {!hideFooter && (
                            <div
                                className={`flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4 ${footerClassName}`}
                            >
                                <SecondaryButton
                                    callBackFn={() => {
                                        handleClose();
                                        setShow(false);
                                    }}
                                    text="Cancel"
                                />

                                <PrimaryButton
                                    disabled={loader}
                                    callBackFn={handleSubmit}
                                    text={
                                        loader
                                            ? "Loading.."
                                            : state
                                            ? "Update"
                                            : "Save"
                                    }
                                />
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

// warning modal

type NoDataConfirmAlertProps = {
    show: boolean;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    onCancel: () => void;
    onConfirm: () => void;
};

const WarningModel = ({
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

export { WarningModel };