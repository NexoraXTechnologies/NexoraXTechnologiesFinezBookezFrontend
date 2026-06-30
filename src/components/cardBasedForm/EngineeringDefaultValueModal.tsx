
// import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";
// import VoucherFormModal from "../voucher/VoucherFormModal";
// import EngineeringSectionForm from "./EngineeringSectionForm";

// const EngineeringDefaultValueModal = ({
//     show,
//     setShow,
//     edit,
//     title,
//     subtitle,
//     loading,
//     onClose,
//     onSubmit,
//     form,
//     errors,
//     handleChange,
//     inputData,
//     isView = false,
//     contentLoading = false,
//     contentSkeleton,
// }: any) => {
//     return (
//         <VoucherFormModal
//             isView={isView}
//             show={show}
//             setShow={setShow}
//             edit={edit}
//             title={title}
//             subtitle={subtitle}
//             loading={loading}
//             onClose={onClose}
//             onSubmit={onSubmit}
//         >
//             <div className="h-full w-full max-w-full text-card-foreground">
//                 {contentLoading ? (
//                     contentSkeleton || (
//                         <DynamicFormContentSkeleton
//                             headerFields={5}
//                             bodyRows={2}
//                             bodyColumns={7}
//                             footerFields={6}
//                         />
//                     )
//                 ) : (
//                     <EngineeringSectionForm
//                         sections={inputData?.sections || []}
//                         form={form}
//                         errors={errors}
//                         handleChange={handleChange}
//                     />
//                 )}
//             </div>
//         </VoucherFormModal>
//     );
// };

// export default EngineeringDefaultValueModal;



import { ArrowLeft, X } from "lucide-react";

import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";
import VoucherFormModal from "../voucher/VoucherFormModal";
import EngineeringSectionForm from "./EngineeringSectionForm";

const EngineeringDefaultValueModal = ({
    show,
    setShow,
    edit,
    title,
    subtitle,
    loading,
    onClose,
    onSubmit,
    form,
    errors,
    handleChange,
    inputData,
    isView = false,
    contentLoading = false,
    contentSkeleton,

    /*
       NEW PROPS
       useVoucherModal = true  => old behavior
       useVoucherModal = false => direct page/drawer style
    */
    useVoucherModal = true,
    showHeader = true,
    showFooter = true,
    showTitle = true,
}: any) => {
    if (!show) return null;

    const handleClose = () => {
        onClose?.();
        setShow?.(false);
    };

    const formContent = (
        <div className="h-full w-full max-w-full text-card-foreground">
            {contentLoading ? (
                contentSkeleton || (
                    <DynamicFormContentSkeleton
                        headerFields={5}
                        bodyRows={2}
                        bodyColumns={7}
                        footerFields={6}
                    />
                )
            ) : (
                <EngineeringSectionForm
                    sections={inputData?.sections || []}
                    form={form}
                    errors={errors}
                    handleChange={handleChange}
                />
            )}
        </div>
    );

    /*
       OLD MODE
       This keeps all old screens working same as before.
    */
    if (useVoucherModal) {
        return (
            <VoucherFormModal
                isView={isView}
                show={show}
                setShow={setShow}
                edit={edit}
                title={title}
                subtitle={subtitle}
                loading={loading}
                onClose={onClose}
                onSubmit={onSubmit}
            >
                {formContent}
            </VoucherFormModal>
        );
    }

    /*
       NEW DIRECT MODE
       No VoucherFormModal.
       Save / Cancel buttons directly inside this component.
    */
    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            {showHeader ? (
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {showTitle ? (
                            <div className="min-w-0">
                                {title ? (
                                    <h2 className="truncate text-lg font-semibold text-card-foreground">
                                        {isView
                                            ? title
                                            : edit
                                            ? `Edit ${title}`
                                            : `Add New ${title}`}
                                    </h2>
                                ) : null}

                                {subtitle ? (
                                    <p className="truncate text-sm text-muted-foreground">
                                        {subtitle}
                                    </p>
                                ) : title ? (
                                    <p className="truncate text-sm text-muted-foreground">
                                        Fill in the {String(title).toLowerCase()} details below
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                    >
                        <X size={20} />
                    </button>
                </header>
            ) : null}

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background px-4 py-4 sm:px-6">
                {formContent}
            </main>

            {showFooter && !isView ? (
                <footer className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-md border border-border bg-secondary px-6 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-muted"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="rounded-md bg-primary px-7 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Saving..." : edit ? "Update" : "Save"}
                        </button>
                    </div>
                </footer>
            ) : null}
        </div>
    );
};

export default EngineeringDefaultValueModal;