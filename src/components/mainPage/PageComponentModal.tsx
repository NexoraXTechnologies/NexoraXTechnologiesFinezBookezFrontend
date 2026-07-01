import { X, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type PageComponentModalProps = {
    show: boolean;
    title: string;
    description?: string;
    children: any;
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
            bg-background
            transition-all duration-300
          "
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="flex h-full w-full flex-col bg-background text-foreground"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold text-card-foreground">
                                        {title}
                                    </h2>

                                    {description && (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md p-2 text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <main className="flex-1 overflow-auto bg-background">
                            {children}
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PageComponentModal;