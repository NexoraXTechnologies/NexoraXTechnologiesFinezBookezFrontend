import { useEffect, useMemo, useState } from "react";
import type { FormEventHandler } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { ModuleSchemaData, SchemaContext, SchemaField, SchemaFieldForm, SchemaSection } from "./Types";
import { INITIAL_SCHEMA_FIELD_FORM } from "./Constants";
import { clearTransactionSchemaError, clearTransactionSchemaState, getAllTransactionSchema, saveTransactionSchema, updateTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";



/**
 * Owns: fetching/refreshing the schema for whatever `schemaContext` currently
 * points at, the field search, and the add/edit field modal. `schemaContext`
 * is the single thing that distinguishes "fixed transaction" from "custom
 * module" — this hook doesn't care which it is.
 */
export function useTransactionSchema(schemaContext: SchemaContext | null) {
    const dispatch = useDispatch<any>();

    const {
        transactionsSchema: schemaData,
        loading: schemaLoading,
        schemaLoading: schemaMutating,
        error: schemaError,
    } = useSelector((state: any) => state.transactionsSchema || {}) as {
        transactionsSchema: ModuleSchemaData | null;
        loading: boolean;
        schemaLoading: boolean;
        error: string | null;
    };

    const [schemaSection, setSchemaSection] = useState<SchemaSection>("header");
    const [schemaSearch, setSchemaSearch] = useState("");
    const [schemaRefreshing, setSchemaRefreshing] = useState(false);

    const [showSchemaForm, setShowSchemaForm] = useState(false);
    const [editingSchemaFieldKey, setEditingSchemaFieldKey] = useState<string | null>(null);
    const [schemaForm, setSchemaForm]:any = useState(INITIAL_SCHEMA_FIELD_FORM);
    const [schemaFormErrors, setSchemaFormErrors] = useState<
        Partial<Record<keyof SchemaFieldForm, string>>
    >({});

    // ⭐ UPDATED: Only schemas explicitly marked "normal" use flat fields.
    const schemaType = String(
        (schemaData as any)?.module?.schemaType ||
        (schemaContext as any)?.schemaType ||
        "sectioned"
    ).toLowerCase();

    const isNormalSchema = schemaType === "normal";
    const isSectionedSchema = !isNormalSchema;

    // ⭐ UPDATED: Sectioned fields remain separate from normal fields.
    const sectionFields: SchemaField[] = isSectionedSchema &&
        Array.isArray(schemaData?.[schemaSection])
        ? (schemaData![schemaSection] as SchemaField[])
        : [];

    // ⭐ UPDATED: Normal schemas read their flat fields array.
    const normalSchemaFields: SchemaField[] = isNormalSchema &&
        Array.isArray((schemaData as any)?.fields)
        ? ((schemaData as any).fields as SchemaField[])
        : [];

    // ⭐ UPDATED: Search uses the fields for the active schema type.
    const activeSchemaFields = isNormalSchema
        ? normalSchemaFields
        : sectionFields;

    const sectionCounts = {
        header: schemaData?.counts?.header ?? 0,
        body: schemaData?.counts?.body ?? 0,
        footer: schemaData?.counts?.footer ?? 0,
        total: schemaData?.counts?.total ?? 0,
    };

    // ⭐ UPDATED: Separate count for the normal schema field list.
    const normalSchemaFieldCount = isNormalSchema
        ? (schemaData as any)?.counts?.fields ?? normalSchemaFields.length
        : 0;

    useEffect(() => {
        if (!schemaContext) return;

        setSchemaSection("header");
        dispatch(clearTransactionSchemaState());
        dispatch(getAllTransactionSchema(schemaContext.moduleKey) as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemaContext?.moduleKey]);

    useEffect(() => {
        if (!schemaError) return;
        toast.error(schemaError);
        dispatch(clearTransactionSchemaError());
    }, [schemaError, dispatch]);

    const reloadSchema = async () => {
        if (!schemaContext) return;
        await dispatch(getAllTransactionSchema(schemaContext.moduleKey) as any).unwrap();
    };

    const isSchemaSubmitting = !!schemaMutating;

    const filteredSchemaFields = useMemo(() => {
        if (!schemaSearch.trim()) return activeSchemaFields;

        const q = schemaSearch.toLowerCase();

        return activeSchemaFields.filter(
            (field) =>
                String(field.key || "").toLowerCase().includes(q) ||
                String(field.label || "").toLowerCase().includes(q) ||
                String(field.type || "").toLowerCase().includes(q) ||
                String(field.ref || "").toLowerCase().includes(q)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSchemaFields, schemaSearch]);

    const handleRefreshSchema = async () => {
        setSchemaRefreshing(true);
        try {
            await reloadSchema();
        } catch {
            // Errors are surfaced through the slice-level effect.
        } finally {
            setSchemaRefreshing(false);
        }
    };

    const closeSchemaForm = () => {
        setShowSchemaForm(false);
        setEditingSchemaFieldKey(null);
        setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
        setSchemaFormErrors({});
    };

    const openAddSchemaForm = () => {
        if (!schemaContext) return;

        setEditingSchemaFieldKey(null);
        setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
        setSchemaFormErrors({});
        setShowSchemaForm(true);
    };

    const isTruthyFlag = (value: unknown): boolean => value === true || value === "true";

    const openEditSchemaForm = (field: SchemaField) => {
        setEditingSchemaFieldKey(field.key);
        setSchemaForm({
            key: field.key || "",
            label: field.label || "",
            type: field.type || "text",
            ref: field.ref || "",
            isRequired: isTruthyFlag(field.isRequired),
            isSearchable: isTruthyFlag(field.isSearchable),
            isFilterable: isTruthyFlag(field.isFilterable),
            isReadonly: isTruthyFlag(field.isReadonly),
            isHidden: isTruthyFlag(field.isHidden),
        });
        setSchemaFormErrors({});
        setShowSchemaForm(true);
    };

    const updateSchemaFormField = (field: keyof SchemaFieldForm, value: string | boolean) => {
        setSchemaForm((previous:any) => ({ ...previous, [field]: value }));
        setSchemaFormErrors((previous) => ({ ...previous, [field]: "" }));
    };

    const validateSchemaForm = () => {
        const errors: Partial<Record<keyof SchemaFieldForm, string>> = {};

        if (!schemaForm.key.trim()) errors.key = "Field key is required.";
        if (!schemaForm.label.trim()) errors.label = "Field label is required.";
        if (!schemaForm.type.trim()) errors.type = "Field type is required.";

        setSchemaFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildSchemaFieldPayload = (): SchemaField => {
        const payload = {
            key: schemaForm.key.trim(),
            customMasterCode: schemaForm?.customMasterCode,
            customMasterName: schemaForm?.customMasterName,
            label: schemaForm.label.trim(),
            type: schemaForm.type,
            isRequired: schemaForm.isRequired,
            isSearchable: schemaForm.isSearchable,
            isFilterable: schemaForm.isFilterable,
            isReadonly: schemaForm.isReadonly,
            isHidden: schemaForm.isHidden,

            // ⭐ UPDATED: Preserve the existing sectioned field payload.
            // Normal field objects have no section; their top-level section is "fields".
            ...(isSectionedSchema ? { section: schemaSection } : {}),
        } as SchemaField;

        if (schemaForm.ref.trim()) payload.ref = schemaForm.ref.trim();

        return payload;
    };

    const handleSchemaSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (!schemaContext || !validateSchemaForm()) return;

        const fieldPayload = buildSchemaFieldPayload();
        const moduleCode = schemaContext.moduleKey?.trim();

        // ⭐ UPDATED: The normal-schema API contract uses section: "fields".
        const section = isNormalSchema ? "fields" : schemaSection?.trim();

        if (!moduleCode) {
            toast.error("Module is required.");
            return;
        }

        if (!section) {
            toast.error("Section is required.");
            return;
        }

        try {
            if (editingSchemaFieldKey) {
                const { key: _ignoredKey, ...updates } = fieldPayload;

                await dispatch(
                    updateTransactionSchema({
                        module: moduleCode,
                        section,
                        key: editingSchemaFieldKey,
                        updates,
                    })
                ).unwrap();

                toast.success(`${schemaContext.title} schema field updated successfully.`);
            } else {
                await dispatch(
                    saveTransactionSchema({
                        module: moduleCode,
                        section,
                        fields: [fieldPayload],
                    })
                ).unwrap();

                toast.success(`${schemaContext.title} schema field added successfully.`);
            }

            closeSchemaForm();
            await reloadSchema();
        } catch {
            // Redux slice error effect handles the error toast.
        }
    };

    return {
        schemaData,
        schemaLoading,
        isSchemaSubmitting,

        // ⭐ UPDATED: Schema type and separate normal field list.
        schemaType,
        isNormalSchema,
        isSectionedSchema,
        sectionFields,
        normalSchemaFields,
        activeSchemaFields,
        normalSchemaFieldCount,

        sectionCounts,
        schemaSection,
        setSchemaSection,
        schemaSearch,
        setSchemaSearch,
        filteredSchemaFields,
        schemaRefreshing,
        handleRefreshSchema,
        showSchemaForm,
        editingSchemaFieldKey,
        schemaForm,
        schemaFormErrors,
        openAddSchemaForm,
        openEditSchemaForm,
        updateSchemaFormField,
        handleSchemaSubmit,
        closeSchemaForm,
    };
}