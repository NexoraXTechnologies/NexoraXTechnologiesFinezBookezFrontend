// import { useEffect, useLayoutEffect, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { CheckSquare, Square, X } from "lucide-react";
// import { Checkbox } from "../../../../components/inputs";

// type ExportColumn = {
//     key: string;
//     label?: string;
// };

// type ExportColumnsModalProps = {
//     show: boolean;
//     setShow: (show: boolean) => void;
//     exportType: "pdf" | "excel" | null;
//     systemColumns: ExportColumn[];
//     customColumns: ExportColumn[];
//     selectedColumns: string[];
//     loading?: boolean;
//     onClose: () => void;
//     onDownload: (columns: string[]) => void;
// };

// const ExportColumnsModal = ({
//     show,
//     setShow,
//     exportType,
//     systemColumns,
//     customColumns,
//     selectedColumns,
//     loading = false,
//     onClose,
//     onDownload,
// }: ExportColumnsModalProps) => {
//     const [localSelectedColumns, setLocalSelectedColumns] = useState<string[]>([]);
//     const scrollContainerRef = useRef<HTMLDivElement | null>(null);
//     const scrollTopRef = useRef(0);
//     const restoreScrollRef = useRef(false);

//     useEffect(() => {
//         if (show) {
//             setLocalSelectedColumns([...selectedColumns]);
//             scrollTopRef.current = 0;
//             restoreScrollRef.current = false;
//         }
//     }, [show]);

//     useEffect(() => {
//         if (!show) return;

//         const previousOverflow = document.body.style.overflow;
//         document.body.style.overflow = "hidden";

//         return () => {
//             document.body.style.overflow = previousOverflow;
//         };
//     }, [show]);

//     useLayoutEffect(() => {
//         if (!restoreScrollRef.current) return;

//         const scrollContainer = scrollContainerRef.current;

//         if (scrollContainer) {
//             scrollContainer.scrollTop = scrollTopRef.current;
//         }

//         restoreScrollRef.current = false;
//     }, [localSelectedColumns]);

//     const rememberScrollPosition = () => {
//         if (scrollContainerRef.current) {
//             scrollTopRef.current = scrollContainerRef.current.scrollTop;
//         }

//         restoreScrollRef.current = true;
//     };

//     const toggleColumn = (key: string) => {
//         rememberScrollPosition();

//         setLocalSelectedColumns((previous) =>
//             previous.includes(key)
//                 ? previous.filter((item) => item !== key)
//                 : [...previous, key]
//         );
//     };

//     const setSectionSelection = (
//         columns: ExportColumn[],
//         selected: boolean
//     ) => {
//         rememberScrollPosition();

//         const keys = columns.map((column) => column.key);

//         setLocalSelectedColumns((previous) => {
//             const withoutSection = previous.filter(
//                 (key) => !keys.includes(key)
//             );

//             return selected
//                 ? [...withoutSection, ...keys]
//                 : withoutSection;
//         });
//     };

//     const handleClose = () => {
//         onClose();
//         setShow(false);
//     };

//     if (!show || typeof document === "undefined") {
//         return null;
//     }

//     return createPortal(
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
//             <div
//                 className="
//                     relative flex w-full max-w-xl flex-col overflow-hidden
//                     rounded-md border border-border bg-card
//                     text-card-foreground shadow-2xl
//                 "
//             >
//                 <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary px-6 py-3">
//                     <div>
//                         <h2 className="mb-0 text-xl font-semibold text-secondary-foreground">
//                             {exportType === "pdf"
//                                 ? "Select PDF Columns"
//                                 : "Select Excel Columns"}
//                         </h2>

//                         <p className="text-sm text-muted-foreground">
//                             Fill in the select {exportType === "pdf" ? "pdf" : "excel"} columns details below
//                         </p>
//                     </div>

//                     <button
//                         type="button"
//                         onClick={handleClose}
//                         disabled={loading}
//                         className="cursor-pointer rounded-full p-2 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
//                     >
//                         <X
//                             size={18}
//                             className="text-muted-foreground"
//                         />
//                     </button>
//                 </div>

//                 <div className="shrink-0 px-6 pb-3 pt-6">
//                     <p className="text-sm text-muted-foreground">
//                         Select the columns you want to include in the exported file.
//                     </p>
//                 </div>

//                 <div
//                     ref={scrollContainerRef}
//                     className="max-h-[55vh] overflow-y-auto overscroll-contain px-6 py-2"
//                 >
//                     {systemColumns.length > 0 && (
//                         <div className="mb-6">
//                             <div className="mb-2 flex items-center justify-between">
//                                 <h3 className="font-bold text-primary">
//                                     System Columns
//                                 </h3>

//                                 <div className="flex gap-3 text-xs font-bold text-primary">
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             setSectionSelection(
//                                                 systemColumns,
//                                                 true
//                                             )
//                                         }
//                                         className="cursor-pointer hover:underline"
//                                     >
//                                         Select All
//                                     </button>

//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             setSectionSelection(
//                                                 systemColumns,
//                                                 false
//                                             )
//                                         }
//                                         className="cursor-pointer hover:underline"
//                                     >
//                                         Clear All
//                                     </button>
//                                 </div>
//                             </div>

//                             {systemColumns.map((column) => (
//                                 <Checkbox
//                                     key={column.key}
//                                     checked={localSelectedColumns.includes(
//                                         column.key
//                                     )}
//                                     value={column.key}
//                                     label={column.label || column.key}
//                                     onChange={() =>
//                                         toggleColumn(column.key)
//                                     }
//                                     className="border-b border-border py-3 hover:bg-muted/40"
//                                 />
//                             ))}
//                         </div>
//                     )}

//                     {customColumns.length > 0 && (
//                         <div>
//                             <div className="mb-2 flex items-center justify-between">
//                                 <h3 className="font-bold text-primary">
//                                     Custom Columns
//                                 </h3>

//                                 <div className="flex gap-3 text-xs font-bold text-primary">
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             setSectionSelection(
//                                                 customColumns,
//                                                 true
//                                             )
//                                         }
//                                         className="cursor-pointer hover:underline"
//                                     >
//                                         Select All
//                                     </button>

//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             setSectionSelection(
//                                                 customColumns,
//                                                 false
//                                             )
//                                         }
//                                         className="cursor-pointer hover:underline"
//                                     >
//                                         Clear All
//                                     </button>
//                                 </div>
//                             </div>

//                             {customColumns.map((column) => {
//                                 const isChecked =
//                                     localSelectedColumns.includes(
//                                         column.key
//                                     );

//                                 return (
//                                     <button
//                                         key={column.key}
//                                         type="button"
//                                         onClick={() =>
//                                             toggleColumn(column.key)
//                                         }
//                                         className="
//                         flex w-full cursor-pointer items-center gap-3
//                         border-b border-border py-3 text-left text-sm
//                         font-medium text-card-foreground transition
//                         hover:bg-muted/40
//                     "
//                                     >
//                                         {isChecked ? (
//                                             <CheckSquare
//                                                 size={20}
//                                                 aria-hidden="true"
//                                                 className="shrink-0 text-primary"
//                                             />
//                                         ) : (
//                                             <Square
//                                                 size={20}
//                                                 aria-hidden="true"
//                                                 className="shrink-0 text-muted-foreground"
//                                             />
//                                         )}

//                                         <span>
//                                             {column.label || column.key}
//                                         </span>
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     )}

//                     {!systemColumns.length &&
//                         !customColumns.length && (
//                             <div className="py-8 text-center text-sm text-muted-foreground">
//                                 No export columns found.
//                             </div>
//                         )}
//                 </div>

//                 <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
//                     <button
//                         type="button"
//                         onClick={handleClose}
//                         disabled={loading}
//                         className="cursor-pointer rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
//                     >
//                         Cancel
//                     </button>

//                     <button
//                         type="button"
//                         onClick={() =>
//                             onDownload(localSelectedColumns)
//                         }
//                         disabled={
//                             !localSelectedColumns.length ||
//                             loading
//                         }
//                         className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
//                     >
//                         {loading
//                             ? "Downloading..."
//                             : exportType === "pdf"
//                                 ? "Download PDF"
//                                 : "Download Excel"}
//                     </button>
//                 </div>
//             </div>
//         </div>,
//         document.body
//     );
// };

// export default ExportColumnsModal;




import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Square, X } from "lucide-react";

type ExportColumn = {
    key: string;
    label?: string;
};

type ExportColumnsModalProps = {
    show: boolean;
    setShow: (show: boolean) => void;
    exportType: "pdf" | "excel" | null;
    systemColumns: ExportColumn[];
    customColumns: ExportColumn[];
    selectedColumns: string[];
    loading?: boolean;
    onClose: () => void;
    onDownload: (columns: string[]) => void;
};

const ExportColumnsModal = ({
    show,
    setShow,
    exportType,
    systemColumns,
    customColumns,
    selectedColumns,
    loading = false,
    onClose,
    onDownload,
}: ExportColumnsModalProps) => {
    const [localSelectedColumns, setLocalSelectedColumns] = useState<string[]>([]);

    useEffect(() => {
        if (show) {
            setLocalSelectedColumns([...selectedColumns]);
        }
    }, [show]);

    useEffect(() => {
        if (!show) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [show]);

    const toggleColumn = (key: string) => {
        setLocalSelectedColumns((previous) =>
            previous.includes(key)
                ? previous.filter((item) => item !== key)
                : [...previous, key]
        );
    };

    const setSectionSelection = (
        columns: ExportColumn[],
        selected: boolean
    ) => {
        const keys = columns.map((column) => column.key);

        setLocalSelectedColumns((previous) => {
            const withoutSection = previous.filter(
                (key) => !keys.includes(key)
            );

            return selected
                ? [...withoutSection, ...keys]
                : withoutSection;
        });
    };

    const handleClose = () => {
        setShow(false);
        onClose();
    };

    const renderColumn = (column: ExportColumn) => {
        const isChecked = localSelectedColumns.includes(column.key);

        return (
            <div
                key={column.key}
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleColumn(column.key)}
                className="
                    flex w-full cursor-pointer select-none items-center gap-3
                    border-b border-border py-3 text-left text-sm
                    font-medium text-card-foreground transition
                    hover:bg-muted/40
                "
            >
                {isChecked ? (
                    <CheckSquare
                        size={20}
                        aria-hidden="true"
                        className="shrink-0 text-primary"
                    />
                ) : (
                    <Square
                        size={20}
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground"
                    />
                )}

                <span>
                    {column.label || column.key}
                </span>
            </div>
        );
    };

    if (!show || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                className="
                    flex h-[80vh] max-h-[80vh] w-full max-w-xl
                    flex-col overflow-hidden rounded-md border
                    border-border bg-card text-card-foreground shadow-2xl
                "
            >
                <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary px-6 py-3">
                    <div>
                        <h2 className="mb-0 text-xl font-semibold text-secondary-foreground">
                            {exportType === "pdf"
                                ? "Select PDF Columns"
                                : "Select Excel Columns"}
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Fill in the select{" "}
                            {exportType === "pdf" ? "pdf" : "excel"}{" "}
                            columns details below
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="cursor-pointer rounded-full p-2 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X
                            size={18}
                            className="text-muted-foreground"
                        />
                    </button>
                </div>

                <div className="shrink-0 px-6 pb-3 pt-6">
                    <p className="text-sm text-muted-foreground">
                        Select the columns you want to include in the exported file.
                    </p>
                </div>

                <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-2"
                    style={{
                        overflowAnchor: "none",
                    }}
                >
                    {systemColumns.length > 0 && (
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-bold text-primary">
                                    System Columns
                                </h3>

                                <div className="flex gap-3 text-xs font-bold text-primary">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSectionSelection(
                                                systemColumns,
                                                true
                                            )
                                        }
                                        className="cursor-pointer hover:underline"
                                    >
                                        Select All
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSectionSelection(
                                                systemColumns,
                                                false
                                            )
                                        }
                                        className="cursor-pointer hover:underline"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {systemColumns.map(renderColumn)}
                        </div>
                    )}

                    {customColumns.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-bold text-primary">
                                    Custom Columns
                                </h3>

                                <div className="flex gap-3 text-xs font-bold text-primary">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSectionSelection(
                                                customColumns,
                                                true
                                            )
                                        }
                                        className="cursor-pointer hover:underline"
                                    >
                                        Select All
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSectionSelection(
                                                customColumns,
                                                false
                                            )
                                        }
                                        className="cursor-pointer hover:underline"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {customColumns.map(renderColumn)}
                        </div>
                    )}

                    {!systemColumns.length &&
                        !customColumns.length && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No export columns found.
                            </div>
                        )}
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="cursor-pointer rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            onDownload([...localSelectedColumns])
                        }
                        disabled={
                            !localSelectedColumns.length ||
                            loading
                        }
                        className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Downloading..."
                            : exportType === "pdf"
                                ? "Download PDF"
                                : "Download Excel"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExportColumnsModal;