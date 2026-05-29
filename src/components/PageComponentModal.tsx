import { ReactNode } from "react";
import { X, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type PageComponentModalProps = {
    show: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    onClose: () => void;
};

const PageComponentModal = ({
    show,
    title,
    description,
    children,
    onClose,
}: PageComponentModalProps) => {
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
                        className="flex h-full w-full flex-col bg-slate-50"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold text-slate-900">
                                        {title}
                                    </h2>

                                    {description && (
                                        <p className="truncate text-sm text-slate-500">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <main className="flex-1 overflow-auto p-4 sm:p-6">
                            {children}
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PageComponentModal;