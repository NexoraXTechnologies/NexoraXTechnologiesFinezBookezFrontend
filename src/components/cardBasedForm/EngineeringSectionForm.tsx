import { SelectInput, TextArea, TextInput, ToggleInput } from "../inputs";

const EngineeringSectionForm = ({
    sections = [],
    form,
    errors,
    handleChange,
}: any) => {
    const renderInput = (field: any) => {
        if (field?.isHidden) return null;

        if (field?.type === "date") {
            return (
                <TextInput
                    label={field?.label}
                    mandatory={field?.isRequired || field?.required}
                    disabled={field?.disabled || field?.isReadonly}
                    read
                    type={field.type}
                    value={form?.[field?.key] ? String(form?.[field?.key]).split("T")[0] : ""}
                    error={errors?.[field?.key]}
                    onChange={(event: any) => {
                        const value = event.target.value;

                        if (field?.onChange) {
                            field.onChange(value);
                            return;
                        }

                        handleChange(field?.key, value);
                    }}
                />
            );
        }

        if (field?.type === "textarea") {
            return (
                <TextArea
                    label={field?.label}
                    mandatory={field?.isRequired || field?.required}
                    value={form?.[field?.key] || ""}
                    placeholder={field?.placeholder}
                    disabled={field?.disabled || field?.isReadonly}
                    error={errors?.[field?.key]}
                    onChange={(event: any) => {
                        const value = event.target.value;

                        if (field?.onChange) {
                            field.onChange(value);
                            return;
                        }

                        handleChange(field?.key, value);
                    }}
                />
            );
        }

        if (field?.type === "toggle") {
            return (
                <ToggleInput
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={form?.[field.key]}
                    checked={Boolean(form?.[field.key])}
                    mandatory={field?.isRequired || field?.required}
                    disabled={field?.disabled || field?.isReadonly}
                    error={errors?.[field.key]}
                    onChange={(event: any) => {
                        const value = event.target.checked;

                        if (field?.onChange) {
                            field.onChange(value);
                            return;
                        }

                        handleChange(field.key, value);
                    }}
                />
            );
        }

        if (field?.type === "select") {
            return (
                <SelectInput
                    label={field?.label}
                    value={form?.[field?.key] || ""}
                    mandatory={field?.isRequired || field?.required}
                    placeholder={field?.placeholder}
                    disabled={field?.disabled || field?.isReadonly}
                    error={errors?.[field?.key]}
                    onChange={(event: any) => {
                        const value = event.target.value;

                        if (field?.onChange) {
                            field.onChange(value);
                            return;
                        }

                        handleChange(field?.key, value);
                    }}
                    options={[
                        { label: field?.placeholder || `Select ${field?.label}`, value: "" },
                        ...(field?.options || []),
                    ]}
                />
            );
        }

        return (
            <TextInput
                label={field?.label}
                mandatory={field?.isRequired || field?.required}
                value={form?.[field?.key] || ""}
                disabled={field?.disabled || field?.isReadonly}
                placeholder={field?.placeholder}
                error={errors?.[field?.key]}
                type={field?.type === "number" ? "number" : "text"}
                onChange={(event: any) => {
                    const value = event.target.value;

                    if (field?.onChange) {
                        field.onChange(value);
                        return;
                    }

                    handleChange(field?.key, value);
                }}
            />
        );
    };

    return (
        <div className="w-full max-w-full space-y-4 text-card-foreground">
            {sections?.map((section: any, sectionIndex: number) => {
                if (section?.isHidden) return null;

                return (
                    <div
                        key={section?.title || sectionIndex}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm"
                    >
                        {section?.title && (
                            <div className="mb-4 border-b border-border pb-3">
                                <h2 className="text-lg font-bold text-card-foreground">
                                    {section.title}
                                </h2>

                                {section?.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {section.description}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">
                            {section?.fields?.map((field: any, index: number) => (
                                <div key={field?.key || index}>
                                    {renderInput(field)}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EngineeringSectionForm;