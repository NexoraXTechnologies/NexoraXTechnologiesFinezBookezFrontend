import React from "react";
import { X, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type VoucherFormModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    title: string;
    subtitle?: string;
    edit?: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: () => void;
    children: React.ReactNode;
};

const VoucherFormModal = ({
    show,
    setShow,
    title,
    subtitle,
    edit = false,
    loading = false,
    onClose,
    onSubmit,
    children,
}: VoucherFormModalProps) => {
    const handleClose = () => {
        onClose();
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="
                        fixed top-0 right-0 bottom-0
                        left-[var(--professional-sidebar-width)]
                        z-[999]
                        bg-slate-100
                        transition-all duration-300
                    "
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="flex h-full w-full flex-col bg-white"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {/* Header */}
                        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold text-slate-900">
                                        {edit ? `Edit ${title}` : `Add New ${title}`}
                                    </h2>

                                    <p className="truncate text-sm text-slate-500">
                                        Fill in the {title.toLowerCase()} details below
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                <X size={20} />
                            </button>
                        </header>



                        {/* This drawer body will scroll only vertically */}
                        {/* Horizontal scroll is blocked here */}
                        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white px-4 py-4 sm:px-6">
                            {children}
                        </main>

                        {/* Footer */}
                        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-md bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={onSubmit}
                                    disabled={loading}
                                    className="rounded-md bg-violet-600 px-7 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Saving..." : edit ? "Update" : "Save"}
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoucherFormModal;