import Select from "react-select";


const TextInput = (({ label = "", value, onChange, placeholder, name = "", mandatory = false, error = "", type = "text", maxLength = null, className = "", disabled = false }: any) => {
    return (
        <div className="w-full flex flex-col gap-1">
            {!!label?.length && <label className="text-sm font-medium text-gray-700">
                {label}{mandatory && <span className="text-red-500">*</span>}
            </label>}

            <input
                maxLength={maxLength}
                disabled={disabled}
                value={value}
                name={name || value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                className={`w-full h-8 rounded-sm border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${className}`} />
            {!!error?.length && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
});

const TextArea = (({ label, value, onChange, placeholder, mandatory = false, error = "", rows = 4 }: any) => {
    return (
        <div className="w-full flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">{label}{mandatory && <span className="text-red-500">*</span>}</label>
            <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />

            {!!error?.length && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
})

const SelectInputNormal = (({ label, value, onChange, options, mandatory = false, error = "", name = "" }: any) => (
    <div className="w-full flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
            {label}{mandatory && <span className="text-red-500">*</span>}
        </label>

        <select
            name={name}
            value={value}
            onChange={onChange}
            className=" w-full  h-8 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 cursor-pointer">
            {options?.map((option: any, idx: any) => (
                <option key={idx} value={idx == 0 ? "" : option?.value}>
                    {option?.label}
                </option>
            ))}
        </select>
        {!!error?.length && (
            <p className="text-xs text-red-500">
                {error}
            </p>
        )}
    </div>
))

const SelectInput = ({
    label = "",
    value,
    onChange,
    options = [],
    mandatory = false,
    error = "",
    name = "",
    placeholder = "Select",
    disabled = false,

    // ✅ only new prop
    styles: customStyles = {},
}: any) => {
    const normalizedOptions = (options || []).map((option: any, idx: number) => {
        if (
            option &&
            typeof option === "object" &&
            "label" in option &&
            "value" in option
        ) {
            return {
                ...option,
                value: idx === 0 && option?.value === "" ? "" : option.value,
            };
        }

        return {
            label: String(option || ""),
            value: option,
        };
    });

    const selectedOption =
        normalizedOptions.find(
            (option: any) => String(option.value) === String(value ?? "")
        ) || null;

    const defaultStyles = {
        control: (base: any, state: any) => ({
            ...base,
            minHeight: "32px",
            height: "32px",
            borderRadius: "0.2rem",
            borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 1px #bfdbfe" : "none",
            backgroundColor: disabled ? "#f9fafb" : "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 200ms",
            "&:hover": {
                borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
            },
        }),

        valueContainer: (base: any) => ({
            ...base,
            height: "30px",
            padding: "0 12px",
        }),

        input: (base: any) => ({
            ...base,
            margin: 0,
            padding: 0,
            color: "#1f2937",
            fontSize: "14px",
        }),

        singleValue: (base: any) => ({
            ...base,
            color: "#1f2937",
            fontSize: "14px",
        }),

        placeholder: (base: any) => ({
            ...base,
            color: "#9ca3af",
            fontSize: "14px",
        }),

        indicatorsContainer: (base: any) => ({
            ...base,
            height: "30px",
        }),

        dropdownIndicator: (base: any) => ({
            ...base,
            padding: "4px",
            color: "#6b7280",
        }),

        clearIndicator: (base: any) => ({
            ...base,
            padding: "4px",
            color: "#6b7280",
        }),

        indicatorSeparator: () => ({
            display: "none",
        }),

        menu: (base: any) => ({
            ...base,
            zIndex: 9999,
            fontSize: "14px",
        }),

        menuPortal: (base: any) => ({
            ...base,
            zIndex: 9999,
        }),

        option: (base: any, state: any) => ({
            ...base,
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: state.isSelected
                ? "#dbeafe"
                : state.isFocused
                    ? "#f3f4f6"
                    : "#ffffff",
            color: "#1f2937",
        }),
    };

    return (
        <div className="w-full flex flex-col gap-1">
            {!!label?.length && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {mandatory && <span className="text-red-500">*</span>}
                </label>
            )}

            <Select
                name={name}
                value={selectedOption}
                options={normalizedOptions}
                placeholder={placeholder}
                isDisabled={disabled}
                isSearchable
                isClearable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                classNamePrefix="common-select"
                styles={{
                    ...defaultStyles,
                    ...customStyles,
                }}
                onChange={(selected: any) => {
                    onChange({
                        target: {
                            name,
                            value: selected?.value || "",
                        },
                    });
                }}
                noOptionsMessage={() => "No options found"}
            />

            {!!error?.length && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export { TextInput, SelectInput, TextArea, SelectInputNormal }