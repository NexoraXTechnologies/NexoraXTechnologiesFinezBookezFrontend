import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { createUnit, getAllUnitMasterSchema, getAllUnits, updateUnit } from "../../../redux/slices/professionalSlice/unitMasterSlice";
import { SelectInput, TextInput } from "../../../components/inputs";
import Modal from "../../../components/modal";


type UnitMasterModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    editingUnit?: any;
    onSaved?: (savedUnit: any) => void | Promise<void>;
    title?: string;
    initialSearchValue?: string;
};

const getTextValue = (value: any) => {
    if (!value) return "";

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    if (typeof value === "object") {
        return (
            value.en ||
            value.name ||
            value.label ||
            value.unitName ||
            value.code ||
            Object.values(value).find(
                (itemValue) =>
                    typeof itemValue === "string"
            ) ||
            ""
        );
    }

    return "";
};

const normalizeUnit = (value: any) => {
    if (
        typeof value === "object" &&
        value !== null
    ) {
        return (
            value.unitCode ??
            value.code ??
            value.value ??
            value.name ??
            value.unitName ??
            ""
        );
    }

    return value ?? "";
};

const getSavedUnitFromResponse = (response: any) => {
    return (
        response?.data?.unit ||
        response?.data?.data?.unit ||
        response?.data?.data ||
        response?.data ||
        response?.unit ||
        response
    );
};

const UnitMasterModal = ({
    show,
    setShow,
    editingUnit = null,
    onSaved,
    title,
    initialSearchValue = "",
}: UnitMasterModalProps) => {
    const dispatch = useDispatch<any>();

    const {
        units = [],
        unitMasterSchemaFields = [],
        schemaLoading,
    } = useSelector(
        (state: any) => state.unitMaster || {}
    );

    const [form, setForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] =
        useState(false);

    const buildEmptyForm = (
        fields: any[] = []
    ) => {
        return fields.reduce(
            (accumulator: any, field: any) => {
                accumulator[field.key] = "";
                return accumulator;
            },
            {}
        );
    };

    useEffect(() => {
        if (!show) return;

        dispatch(
            getAllUnitMasterSchema({
                offset: 0,
                limit: 50,
            }) as any
        );
    }, [dispatch, show]);

    useEffect(() => {
        if (
            !show ||
            unitMasterSchemaFields.length === 0
        ) {
            return;
        }

        setErrors({});

        const nextForm = buildEmptyForm(
            unitMasterSchemaFields
        );

        if (editingUnit) {
            unitMasterSchemaFields.forEach(
                (field: any) => {
                    const key = field.key;

                    if (key === "unit") {
                        nextForm.unit = normalizeUnit(
                            editingUnit?.unit
                        );
                        return;
                    }

                    nextForm[key] =
                        editingUnit?.[key] ?? "";
                }
            );
        } else if (initialSearchValue) {
            const unitCodeField =
                unitMasterSchemaFields.find(
                    (field: any) =>
                        field.key === "unitCode"
                );

            const unitNameField =
                unitMasterSchemaFields.find(
                    (field: any) =>
                        field.key === "unitName"
                );

            if (unitCodeField) {
                nextForm.unitCode = initialSearchValue;
            } else if (unitNameField) {
                nextForm.unitName = initialSearchValue;
            }
        }

        setForm(nextForm);
    }, [
        show,
        editingUnit,
        unitMasterSchemaFields,
        initialSearchValue,
    ]);

    const validateForm = () => {
        const validationErrors: any = {};

        unitMasterSchemaFields.forEach(
            (field: any) => {
                const value = form?.[field.key];

                if (
                    field.isRequired &&
                    String(value || "").trim() === ""
                ) {
                    validationErrors[field.key] =
                        `${field.label} required`;
                }

                if (
                    field.type === "number" &&
                    value !== "" &&
                    value !== null &&
                    value !== undefined &&
                    Number(value) < 0
                ) {
                    validationErrors[field.key] =
                        `${field.label} cannot be negative`;
                }
            }
        );

        setErrors(validationErrors);

        return (
            Object.keys(validationErrors).length ===
            0
        );
    };

    const getFieldOptions = (field: any) => {
        if (field.ref === "unitMeasurement") {
            return (
                units?.map((item: any) => {
                    const value =
                        item?.[field.valueField] ||
                        item?.unitCode ||
                        item?.code ||
                        "";

                    const label =
                        item?.[field.labelField] ||
                        item?.unitName ||
                        item?.name ||
                        value;

                    return {
                        value,
                        label: getTextValue(label),
                    };
                }) || []
            );
        }

        return (field.options || []).map(
            (option: any) => {
                if (typeof option === "object") {
                    return {
                        value:
                            option.value ||
                            option.code ||
                            option.name ||
                            "",
                        label:
                            option.label ||
                            option.name ||
                            option.value ||
                            "",
                    };
                }

                return {
                    value: option,
                    label: option,
                };
            }
        );
    };

    const updateField = (
        key: string,
        value: any
    ) => {
        setForm((previous: any) => ({
            ...previous,
            [key]: value,
        }));

        setErrors((previous: any) => ({
            ...previous,
            [key]: "",
        }));
    };

    const renderSchemaField = (field: any) => {
        const value = form?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value,
            placeholder: `Enter ${field.label}`,
            error: errors?.[field.key],
            disabled:
                field?.disabled ||
                field?.isReadonly ||
                submitting,
        };

        if (field.type === "select") {
            return (
                <SelectInput
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    mandatory={field.isRequired}
                    value={value}
                    placeholder={`Select ${field.label}`}
                    error={errors?.[field.key]}
                    disabled={
                        field?.disabled ||
                        field?.isReadonly ||
                        submitting
                    }

                    // ⭐ YELLOW STAR: ADDED — SHOW SELECT OPTIONS ABOVE UNIT MODAL
                    styles={{
                        menuPortal: (base: any) => ({
                            ...base,
                            zIndex: 2147483647,
                        }),

                        menu: (base: any) => ({
                            ...base,
                            zIndex: 2147483647,
                        }),
                    }}

                    onChange={(event: any) => {
                        updateField(
                            field.key,
                            event?.target?.value ?? ""
                        );
                    }}
                    options={[
                        {
                            value: "",
                            label: `Select ${field.label}`,
                        },
                        ...getFieldOptions(field),
                    ]}
                />
            );
        }

        if (field.type === "number") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="number"
                    onChange={(event: any) => {
                        updateField(
                            field.key,
                            event.target.value
                        );
                    }}
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type="text"
                onChange={(event: any) => {
                    updateField(
                        field.key,
                        event.target.value
                    );
                }}
            />
        );
    };

    const handleSubmit = async () => {
        if (
            submitting ||
            !validateForm()
        ) {
            return;
        }

        const payload: any = {
            ...form,
        };

        unitMasterSchemaFields.forEach(
            (field: any) => {
                if (
                    field.type === "number" &&
                    payload[field.key] !== ""
                ) {
                    payload[field.key] = Number(
                        payload[field.key]
                    );
                }
            }
        );

        setSubmitting(true);

        try {
            let response: any;

            if (editingUnit) {
                const updatePayload: any = {};

                unitMasterSchemaFields.forEach(
                    (field: any) => {
                        const key = field.key;

                        const oldValue =
                            key === "unit"
                                ? normalizeUnit(
                                    editingUnit?.[key] ||
                                    ""
                                )
                                : editingUnit?.[key];

                        if (form[key] !== oldValue) {
                            updatePayload[key] =
                                payload[key];
                        }
                    }
                );

                response = await dispatch(
                    updateUnit({
                        unitId: editingUnit.unitId,
                        data: updatePayload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Unit updated successfully"
                );
            } else {
                response = await dispatch(
                    createUnit(payload) as any
                ).unwrap();

                toast.success(
                    "Unit created successfully"
                );
            }

            await dispatch(
                getAllUnits({
                    offset: 0,
                    limit: 1000,
                    search: "",
                }) as any
            ).unwrap();

            const savedUnit =
                getSavedUnitFromResponse(response) ||
                payload;

            if (onSaved) {
                await onSaved(savedUnit);
            }

            setShow(false);
            setErrors({});
            setForm(
                buildEmptyForm(
                    unitMasterSchemaFields
                )
            );
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Unit operation failed"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (
        !show ||
        typeof document === "undefined"
    ) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[2147483600] isolate pointer-events-none">
            <div className="pointer-events-auto">
                <Modal
                    {...{
                        show,
                        setShow,
                        handleSubmit,
                        state: editingUnit,
                        title:
                            title ||
                            (editingUnit
                                ? "Update Unit"
                                : "Add New Unit"),
                        body: (
                            <>
                                {schemaLoading ? (
                                    <div className="py-6 text-sm text-muted-foreground">
                                        Loading unit fields...
                                    </div>
                                ) : (
                                    unitMasterSchemaFields.map(
                                        (field: any) =>
                                            renderSchemaField(field)
                                    )
                                )}
                            </>
                        ),
                    }}
                />
            </div>
        </div>,
        document.body
    );
};

export default UnitMasterModal;