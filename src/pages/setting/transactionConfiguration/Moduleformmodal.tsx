import type { FormEventHandler } from "react";
import { X } from "lucide-react";
import type { TransactionModuleForm } from "./Types";

// ⭐ YELLOW STAR: ADDED — REUSABLE INPUT FIELDS
import {
    SelectInput,
    TextArea,
    TextInput,
} from "../../../components/inputs";

type ModuleFormModalProps = {
    open: boolean;
    editingModuleCode: string | null;
    loadingExisting: boolean;
    form: TransactionModuleForm;
    errors: Partial<Record<keyof TransactionModuleForm, string>>;
    submitting: boolean;
    serverError: string | null;
    onChangeField: (
        field: keyof TransactionModuleForm,
        value: string
    ) => void;
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
            <div className="w-full max-w-xl overflow-hidden rounded border border-border bg-card text-card-foreground shadow-2xl">

                {/* ================= HEADER ================= */}

                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-card-foreground">
                            {editingModuleCode
                                ? "Edit Custom Transaction"
                                : "Add Custom Transaction"}
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

                {/* ================= BODY ================= */}

                {editingModuleCode &&
                    loadingExisting ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
                        Loading custom transaction...
                    </div>
                ) : (
                    <form
                        onSubmit={onSubmit}
                        className="space-y-5 p-5"
                    >
                        {/* ⭐ YELLOW STAR: UPDATED — REUSABLE TEXT INPUT */}
                        <TextInput
                            label="Module Name"
                            name="moduleName"
                            mandatory={true}
                            type="text"
                            value={form.moduleName}
                            placeholder="Example: Delivery Challan"
                            maxLength={100}
                            error={errors.moduleName}
                            disabled={submitting}
                            onChange={(event: any) =>
                                onChangeField(
                                    "moduleName",
                                    event.target.value
                                )
                            }
                        />

                        {/* ⭐ YELLOW STAR: UPDATED — REUSABLE TEXT INPUT */}
                        <TextInput
                            label="Module Type"
                            name="moduleType"
                            mandatory={true}
                            type="text"
                            value={form.moduleType}
                            placeholder="Example: sales / purchase / inventory"
                            maxLength={100}
                            error={errors.moduleType}
                            disabled={submitting}
                            onChange={(event: any) =>
                                onChangeField(
                                    "moduleType",
                                    event.target.value
                                )
                            }
                        />

                        {/* ⭐ YELLOW STAR: UPDATED — REUSABLE SELECT INPUT */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <SelectInput
                                label="Schema Type"
                                name="schemaType"
                                mandatory={false}
                                value={form.schemaType}
                                placeholder="Select schema type"
                                disabled={submitting}
                                error={errors.schemaType}
                                options={[
                                    {
                                        value: "",
                                        label: "Select schema type",
                                    },
                                    {
                                        value: "normal",
                                        label: "Normal",
                                    },
                                    {
                                        value: "sectioned",
                                        label: "Sectioned",
                                    },
                                ]}
                                onChange={(event: any) =>
                                    onChangeField(
                                        "schemaType",
                                        event?.target?.value ?? ""
                                    )
                                }
                            />

                            <SelectInput
                                label="Status"
                                name="status"
                                mandatory={false}
                                value={form.status}
                                placeholder="Select status"
                                disabled={submitting}
                                error={errors.status}
                                options={[
                                    {
                                        value: "",
                                        label: "Select status",
                                    },
                                    {
                                        value: "active",
                                        label: "Active",
                                    },
                                    {
                                        value: "inactive",
                                        label: "Inactive",
                                    },
                                ]}
                                onChange={(event: any) =>
                                    onChangeField(
                                        "status",
                                        event?.target?.value ?? ""
                                    )
                                }
                            />
                        </div>

                        {/* ⭐ YELLOW STAR: UPDATED — REUSABLE TEXT AREA */}
                        <div>
                            <TextArea
                                label="Description"
                                mandatory={false}
                                value={form.description}
                                placeholder="Describe where this transaction will be used"
                                rows={4}
                                error={errors.description}
                                disabled={submitting}
                                onChange={(event: any) =>
                                    onChangeField(
                                        "description",
                                        String(
                                            event.target.value || ""
                                        ).slice(0, 500)
                                    )
                                }
                            />

                            <div className="mt-1 flex items-center justify-end">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {form.description.length}/500
                                </span>
                            </div>
                        </div>

                        {/* ================= SERVER ERROR ================= */}

                        {serverError ? (
                            <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                                {serverError}
                            </div>
                        ) : null}

                        {/* ================= ACTIONS ================= */}

                        <div className="flex justify-end gap-3 border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="h-10 rounded border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {editingModuleCode
                                    ? "Update"
                                    : "Create"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModuleFormModal;