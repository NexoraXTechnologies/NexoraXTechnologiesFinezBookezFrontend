import React from "react";
import Modal from "../modal";

type VoucherFormModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    title: string;
    subtitle?: string;
    edit?: boolean;
    loading?: boolean;
    maxWidth?: any;
    onClose: () => void;
    onSubmit: () => void;
    children: React.ReactNode;
};

const VoucherFormModal = ({ show, setShow, title, subtitle, edit = false, loading = false, maxWidth = "7xl", onClose, onSubmit, children,
}: VoucherFormModalProps) => {
    return (
        // @ts-ignore
        <Modal
            show={show}
            setShow={setShow}
            title={edit ? `Edit ${title}` : `Add New ${title}`}
            maxWidth={maxWidth}
            gridCols={12}
            hideFooter
            handleClose={onClose}
            handleSubmit={onSubmit}
            loader={loading}
            state={edit}
            body={
                <div className="flex max-h-[82vh] min-h-[70vh] flex-col bg-white text-slate-800">
                    {subtitle && (
                        <div className="border-b border-slate-200 px-1 pb-4">
                            <p className="text-sm text-slate-500">{subtitle}</p>
                        </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-auto px-1 py-4">
                        {children}
                    </div>

                    {/* <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md bg-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                            className="rounded-md bg-violet-600 px-7 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                        >
                            {loading ? "Saving..." : edit ? "Update" : "Save"}
                        </button>
                    </div> */}
                </div>
            }
        />
    );
};

export default VoucherFormModal;