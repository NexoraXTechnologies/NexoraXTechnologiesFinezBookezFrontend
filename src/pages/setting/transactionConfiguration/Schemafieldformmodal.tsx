import { useEffect } from "react";
import type { FormEventHandler } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Save, X } from "lucide-react";

import type {
    SchemaContext,
    SchemaFieldForm,
} from "./Types";

import { FIELD_TYPE_OPTIONS } from "./Constants";

import {
    getAllMasterConfigurations,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/masterConfigurationSlice";

const CHECKBOX_OPTIONS = [
    {
        key: "isRequired",
        label: "Required",
    },
    {
        key: "isSearchable",
        label: "Searchable",
    },
    {
        key: "isFilterable",
        label: "Filterable",
    },
    {
        key: "isHidden",
        label: "Hidden",
    },
];

const FINAL_FIELD_TYPE_OPTIONS = [
    ...FIELD_TYPE_OPTIONS
        .map((option) => {
            if (
                option.value === "text" ||
                option.value === "string"
            ) {
                return {
                    value: "string",
                    label: "Text",
                };
            }

            return option;
        })
        .filter(
            (option, index, array) =>
                array.findIndex(
                    (item) =>
                        item.value === option.value
                ) === index
        ),

    ...(
        FIELD_TYPE_OPTIONS.some(
            (option) =>
                option.value === "custommaster"
        )
            ? []
            : [
                {
                    value: "custommaster",
                    label: "Custom Master",
                },
            ]
    ),
];

type SchemaFieldFormModalProps = {
    open: boolean;

    schemaContext:
    | SchemaContext
    | null;

    editingSchemaFieldKey:
    | string
    | null;

    form: SchemaFieldForm;

    errors: Partial<
        Record<
            keyof SchemaFieldForm,
            string
        >
    > & {
        customMasterCode?: string;
        customMasterName?: string;
    };

    submitting: boolean;

    onChangeField: (
        field: any,
        value: string | boolean
    ) => void;

    onSubmit: FormEventHandler;

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
    const dispatch = useDispatch<any>();

    const {
        masterConfigurations = [],
        loading: masterLoading,
    } = useSelector(
        (state: any) =>
            state.masterConfiguration || {}
    );

    const customMasterCode =
        String(
            (form as any)
                ?.customMasterCode || ""
        );

    const customMasterName =
        String(
            (form as any)
                ?.customMasterName || ""
        );

    const normalizedFieldType =
        form.type === "text"
            ? "string"
            : form.type || "string";

    useEffect(() => {
        if (!open) {
            return;
        }

        dispatch(
            getAllMasterConfigurations({
                offset: 0,
                limit: 500,
                search: "",
                status: "active",
            })
        );
    }, [
        dispatch,
        open,
    ]);

    if (
        !open ||
        !schemaContext
    ) {
        return null;
    }

    const handleSchemaLabelChange = (
        value: string
    ) => {
        onChangeField(
            "label",
            value
        );

        /*
         * Same behavior as Master Configuration:
         *
         * ADD:
         * Field Label -> automatically generates Field Key.
         *
         * EDIT:
         * Existing Field Key stays unchanged.
         */
       
        if (!editingSchemaFieldKey) {
            const key = value
                ?.toLowerCase()
                ?.trim()
                ?.replace(/\s+/g, "_")
                ?.replace(/[^\w]/g, "");

            onChangeField("key", key);
        }
    };

    const handleFieldTypeChange = (
        value: string
    ) => {
        onChangeField(
            "type",
            value
        );

        if (
            value !==
            "custommaster"
        ) {
            onChangeField(
                "customMasterCode",
                ""
            );

            onChangeField(
                "customMasterName",
                ""
            );
        }
    };

    const handleCustomMasterReferenceChange =
        (
            moduleCode: string
        ) => {
            const selected =
                masterConfigurations.find(
                    (
                        item: any
                    ) =>
                        item
                            ?.moduleCode ===
                        moduleCode
                );

            onChangeField(
                "customMasterCode",
                moduleCode
            );

            onChangeField(
                "customMasterName",
                selected
                    ?.moduleName ||
                ""
            );
        };

    const activeCustomMasters =
        masterConfigurations.filter(
            (item: any) =>
                !item?.status ||
                item.status === "active"
        );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded border border-border bg-card shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-card-foreground">
                            {editingSchemaFieldKey
                                ? "Update Schema Field"
                                : "Add Schema Field"}
                        </h2>

                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {
                                schemaContext.title
                            }

                            {schemaContext.kind ===
                                "custom"
                                ? ` · ${schemaContext.moduleKey}`
                                : " · Transaction"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            submitting
                        }
                        className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                    >
                        <X
                            size={
                                19
                            }
                        />
                    </button>
                </div>

                <form
                    onSubmit={
                        onSubmit
                    }
                    className="space-y-5 p-5"
                >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* ===============================
                            FIELD LABEL
                        =============================== */}

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Field
                                Label{" "}
                                <span className="text-danger">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                value={
                                    form.label
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleSchemaLabelChange(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Example: Department Code"
                                className={`
                                    h-10 w-full rounded border bg-background px-3 text-sm
                                    outline-none focus:ring-2 focus:ring-primary/20
                                    ${errors.label ||
                                        errors.key
                                        ? "border-danger"
                                        : "border-input"
                                    }
                                `}
                            />

                            {errors.label ||
                                errors.key ? (
                                <p className="mt-1 text-xs font-semibold text-danger">
                                    {errors.label ||
                                        errors.key}
                                </p>
                            ) : null}
                        </div>

                        {/* ===============================
                            FIELD TYPE
                        =============================== */}

                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                Field
                                Type{" "}
                                <span className="text-danger">
                                    *
                                </span>
                            </label>

                            <select
                                value={
                                    normalizedFieldType
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleFieldTypeChange(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={`
                                    h-10 w-full rounded border bg-background px-3
                                    text-sm font-semibold outline-none
                                    focus:border-primary focus:ring-2 focus:ring-primary/20
                                    ${errors.type
                                        ? "border-danger"
                                        : "border-input"
                                    }
                                `}
                            >
                                {FINAL_FIELD_TYPE_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                )
                                )}
                            </select>

                            {errors.type ? (
                                <p className="mt-1 text-xs font-semibold text-danger">
                                    {errors.type}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {/* ===================================
                        CUSTOM MASTER
                    =================================== */}

                    {normalizedFieldType === "custommaster" ? (<div>
                        <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                            Custom Master{" "}
                            <span className="text-danger">
                                *
                            </span>
                        </label>

                        <select
                            value={customMasterCode}
                            disabled={masterLoading}
                            onChange={(event) => handleCustomMasterReferenceChange(event.target.value)}
                            className={`
                                    h-10 w-full rounded border bg-background px-3
                                    text-sm font-semibold outline-none
                                    focus:border-primary focus:ring-2 focus:ring-primary/20
                                    disabled:cursor-not-allowed disabled:opacity-60
                                    ${errors.customMasterCode
                                    ? "border-danger"
                                    : "border-input"
                                }
                                `}
                        >
                            <option value="">
                                {masterLoading
                                    ? "Loading Custom Masters..."
                                    : "Select Custom Master"}
                            </option>

                            {activeCustomMasters.map(
                                (
                                    item: any
                                ) => (
                                    <option
                                        key={item.moduleCode}
                                        value={item.moduleCode}
                                    >
                                        {item.moduleName}{" "}
                                        ({item.moduleCode}                                        )
                                    </option>
                                )
                            )}
                        </select>

                        {errors.customMasterCode ? (
                            <p className="mt-1 text-xs font-semibold text-danger">
                                {
                                    errors.customMasterCode
                                }
                            </p>
                        ) : null}

                        {customMasterCode &&
                            customMasterName ? (
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                Selected:{" "}
                                <span className="font-semibold text-card-foreground">
                                    {
                                        customMasterName
                                    }{" "}
                                    (
                                    {
                                        customMasterCode
                                    }
                                    )
                                </span>
                            </p>
                        ) : null}
                    </div>
                    ) : null}

                    {/* ===================================
                        FIELD OPTIONS
                    =================================== */}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {CHECKBOX_OPTIONS.map(
                            (
                                option
                            ) => (
                                <label
                                    key={
                                        option.key
                                    }
                                    className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-3 text-sm font-bold"
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            !!(
                                                form as any
                                            )[
                                            option
                                                .key
                                            ]
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            onChangeField(
                                                option.key,
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                    />

                                    {
                                        option.label
                                    }
                                </label>
                            )
                        )}
                    </div>

                    {/* ===================================
                        ACTIONS
                    =================================== */}

                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                submitting
                            }
                            className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                            className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save
                                size={
                                    16
                                }
                            />

                            {editingSchemaFieldKey
                                ? "Update Field"
                                : "Add Field"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchemaFieldFormModal;