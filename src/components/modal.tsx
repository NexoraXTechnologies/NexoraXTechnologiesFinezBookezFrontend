// import { AnimatePresence, motion } from "framer-motion";
// import { TextInput } from "./inputs";
// import { PrimaryButton, SecondaryButton } from "./buttons";
// import { X } from "lucide-react";

// const Modal = ({ show, setShow, handleSubmit, state, body,title }: { show: Boolean, setShow: () => void, handleSubmit: () => void, state: string, body: any }  ) => {

//     return (
//         <>
//             <AnimatePresence>
//                 {show && (
//                     <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
//                         <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
//                             transition={{
//                                 type: "spring",
//                                 stiffness: 260,
//                                 damping: 20,
//                             }}
//                             className="relative w-full max-w-3xl rounded-md bg-white shadow-2xl border border-gray-100 overflow-hidden">
//                             {/* Header */}
//                             <div className="flex items-center justify-between border-b border-gray-300 px-6 py-3 bg-gray-50">
//                                 <div>
//                                     <h2 className="text-xl font-semibold text-gray-800 mb-0">{state ? `Edit ${title}` : `Add New ${title}`}</h2>
//                                     <p className="text-sm text-gray-500">Fill in the {title.toLowerCase()} details below</p>
//                                 </div>

//                                 <button onClick={() => setShow(false)} className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
//                                     <X size={18} className="text-gray-600" />
//                                 </button>
//                             </div>

//                             {/* Body */}
//                             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                                 {body}
//                             </div>

//                             {/* Footer */}
//                             <div className="flex justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4">
//                                 <SecondaryButton callBackFn={() => setShow(false)} text="Cancel" />
//                                 <PrimaryButton callBackFn={handleSubmit} text={state ? "Update" : "Save"} />
//                             </div>
//                         </motion.div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </>
//     )
// }

// export default Modal;



import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { X } from "lucide-react";

type ModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    handleSubmit: () => void;
    state: boolean;
    body: React.ReactNode;
    title: string;

    // Optional dynamic props
    gridCols?: 1 | 2 | 3 | 4;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
};

const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
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
};

const Modal = ({
    show,
    setShow,
    handleSubmit,
    state,
    body,
    title,

    // Default old values, so other components stay same
    gridCols = 2,
    maxWidth = "3xl",
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
                        className={`relative w-full ${maxWidthClass[maxWidth]} max-h-[90vh] rounded-md bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col`}
                    >
                        {/* Header */}
                        <div
                            className={`flex items-center justify-between border-b border-gray-300 px-6 py-3 bg-gray-50 shrink-0 ${headerClassName}`}
                        >
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-0">
                                    {state ? `Edit ${title}` : `Add New ${title}`}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Fill in the {title.toLowerCase()} details below
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShow(false)}
                                className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`p-6 grid ${gridColsClass[gridCols]} gap-4 text-sm overflow-y-auto ${bodyClassName}`}
                        >
                            {body}
                        </div>

                        {/* Footer */}
                        <div
                            className={`flex justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4 shrink-0 ${footerClassName}`}
                        >
                            <SecondaryButton
                                callBackFn={() => setShow(false)}
                                text="Cancel"
                            />

                            <PrimaryButton
                                callBackFn={handleSubmit}
                                text={state ? "Update" : "Save"}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;