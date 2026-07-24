import type { FormEventHandler } from "react";
import type { SchemaContext, SchemaFieldForm } from "./Types";
import { Save, X } from "lucide-react";
import { FIELD_TYPE_OPTIONS } from "./Constants";




const CHECKBOX_OPTIONS: { key: keyof SchemaFieldForm; label: string }[] = [
    { key: "isRequired", label: "Required" },
    { key: "isSearchable", label: "Searchable" },
    { key: "isFilterable", label: "Filterable" },
    { key: "isReadonly", label: "Readonly" },
    { key: "isHidden", label: "Hidden" },
];

type SchemaFieldFormModalProps = {
    open: boolean;
    schemaContext: SchemaContext | null;
    editingSchemaFieldKey: string | null;
    form: SchemaFieldForm;
    errors: Partial<Record<keyof SchemaFieldForm, string>>;
    submitting: boolean;
    onChangeField: (field: keyof SchemaFieldForm, value: string | boolean) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClose: () => void;
};

const SchemaFieldFormModal = ({
    open,
    schemaContext,
    editingSchemaFieldKey,
    form,
    errors,
    submitting,
    onChangeField,
    onSubmit,
    onClose,
}: SchemaFieldFormModalProps) => {
    if (!open || !schemaContext) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded border border-border bg-card shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-card-foreground">
                            {editingSchemaFieldKey ? "Update Schema Field" : "Add Schema Field"}
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {schemaContext.title}
                            {schemaContext.kind === "custom" ? ` · ${schemaContext.moduleKey}` : " · Transaction"}
                        </p>
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

                <form onSubmit={onSubmit} className="space-y-5 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Field Key <span className="text-danger">*</span>
                            </label>
                            <input
                                value={form.key}
                                onChange={(event) => onChangeField("key", event.target.value)}
                                disabled={!!editingSchemaFieldKey}
                                placeholder="Example: dueDate"
                                className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                                    errors.key ? "border-danger" : "border-input"
                                }`}
                            />
                            {errors.key ? <p className="mt-1 text-xs font-semibold text-danger">{errors.key}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Field Label <span className="text-danger">*</span>
                            </label>
                            <input
                                value={form.label}
                                onChange={(event) => onChangeField("label", event.target.value)}
                                placeholder="Example: Due Date"
                                className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none ${
                                    errors.label ? "border-danger" : "border-input"
                                }`}
                            />
                            {errors.label ? <p className="mt-1 text-xs font-semibold text-danger">{errors.label}</p> : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Field Type <span className="text-danger">*</span>
                            </label>
                            <select
                                value={form.type}
                                onChange={(event) => onChangeField("type", event.target.value)}
                                className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none"
                            >
                                {FIELD_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">Reference</label>
                            <input
                                value={form.ref}
                                onChange={(event) => onChangeField("ref", event.target.value)}
                                placeholder="Example: productmaster"
                                className="h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {CHECKBOX_OPTIONS.map((option) => (
                            <label
                                key={option.key}
                                className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-3 text-sm font-bold"
                            >
                                <input
                                    type="checkbox"
                                    checked={!!form[option.key]}
                                    onChange={(event) => onChangeField(option.key, event.target.checked)}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>

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
                            className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            {editingSchemaFieldKey ? "Update Field" : "Add Field"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchemaFieldFormModal;