import type { FormEventHandler } from "react";
import { X } from "lucide-react";
import type { TransactionModuleForm } from "./Types";



type ModuleFormModalProps = {
    open: boolean;
    editingModuleCode: string | null;
    loadingExisting: boolean;
    form: TransactionModuleForm;
    errors: Partial<Record<keyof TransactionModuleForm, string>>;
    submitting: boolean;
    serverError: string | null;
    onChangeField: (field: keyof TransactionModuleForm, value: string) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClose: () => void;
};

const ModuleFormModal = ({
    open,
    editingModuleCode,
    loadingExisting,
    form,
    errors,
    submitting,
    serverError,
    onChangeField,
    onSubmit,
    onClose,
}: ModuleFormModalProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded border border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-card-foreground">
                            {editingModuleCode ? "Edit Custom Transaction" : "Add Custom Transaction"}
                        </h2>
                        {editingModuleCode ? (
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                Module Code: {editingModuleCode}
                            </p>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </div>

                {editingModuleCode && loadingExisting ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
                        Loading custom transaction...
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-5 p-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Module Name <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.moduleName}
                                onChange={(event) => onChangeField("moduleName", event.target.value)}
                                placeholder="Example: Delivery Challan"
                                maxLength={100}
                                className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.moduleName ? "border-danger" : "border-input"
                                }`}
                            />
                            {errors.moduleName ? (
                                <p className="mt-1 text-xs font-semibold text-danger">{errors.moduleName}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Module Type <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.moduleType}
                                onChange={(event) => onChangeField("moduleType", event.target.value)}
                                placeholder="Example: sales / purchase / inventory"
                                maxLength={100}
                                className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.moduleType ? "border-danger" : "border-input"
                                }`}
                            />
                            {errors.moduleType ? (
                                <p className="mt-1 text-xs font-semibold text-danger">{errors.moduleType}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(event) => onChangeField("description", event.target.value)}
                                placeholder="Describe where this transaction will be used"
                                rows={4}
                                maxLength={500}
                                className="w-full resize-none rounded border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="mt-1 flex items-center justify-end">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {form.description.length}/500
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">Status</label>
                            <select
                                value={form.status}
                                onChange={(event) => onChangeField("status", event.target.value)}
                                className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {serverError ? (
                            <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                                {serverError}
                            </div>
                        ) : null}

                        <div className="flex justify-end gap-3 border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {editingModuleCode ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModuleFormModal;