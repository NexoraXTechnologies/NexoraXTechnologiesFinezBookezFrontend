import { useCallback, useMemo, useState } from "react";
import Select, { components } from "react-select";

const ToggleInput = ({
    label = "",
    value = false,
    checked,
    onChange,
    name = "",
    mandatory = false,
    error = "",
    disabled = false,
    className = "",
}: any) => {
    const isChecked =
        typeof checked === "boolean"
            ? checked
            : value === true ||
              value === "true" ||
              value === 1 ||
              value === "1";

    return (
        <div className={`w-full flex flex-col gap-1 ${className}`}>
            {!!label?.length && (
                <label className="text-sm font-medium text-card-foreground">
                    {label}
                    {mandatory && <span className="text-danger">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;

                    onChange({
                        target: {
                            name,
                            value: !isChecked,
                            checked: !isChecked,
                        },
                    });
                }}
                className={`
                    flex h-8 w-full items-center justify-between rounded-sm
                    border border-border bg-input px-3 text-sm
                    text-foreground outline-none transition duration-200
                    hover:border-primary
                    focus:border-primary focus:ring-1 focus:ring-primary/20
                    disabled:cursor-not-allowed disabled:opacity-70
                    ${isChecked ? "border-primary/60 bg-primary/5" : ""}
                `}
            >
                <span className="font-medium text-card-foreground">
                    {isChecked ? "Enabled" : "Disabled"}
                </span>

                <span
                    className={`
                        relative inline-flex h-[18px] w-[36px] shrink-0 items-center
                        rounded-full transition duration-200
                        ${isChecked ? "bg-primary" : "bg-slate-300"}
                    `}
                >
                    <span
                        className={`
                            inline-block h-[14px] w-[14px] rounded-full bg-white
                            shadow-sm transition duration-200
                            ${isChecked ? "translate-x-[19px]" : "translate-x-[3px]"}
                        `}
                    />
                </span>
            </button>

            {!!error?.length && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
};

const TextInput = ({
    label = "",
    value,
    onChange,
    placeholder,
    name = "",
    mandatory = false,
    error = "",
    type = "text",
    maxLength = null,
    className = "",
    disabled = false,
}: any) => {
    return (
        <div className="w-full flex flex-col gap-1">
            {!!label?.length && (
                <label className="text-sm font-medium text-card-foreground">
                    {label}
                    {mandatory && <span className="text-danger">*</span>}
                </label>
            )}

            <input
                maxLength={maxLength}
                disabled={disabled}
                value={value}
                name={name || value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                className={`
          w-full h-8 rounded-sm border border-border bg-input px-3
          text-sm text-foreground placeholder:text-muted-foreground
          outline-none transition duration-200
          hover:border-primary
          focus:border-primary focus:ring-1 focus:ring-primary/20
          disabled:cursor-not-allowed disabled:opacity-70
          ${className}
        `}
            />

            {!!error?.length && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
};

const TextArea = ({
    label,
    value,
    onChange,
    placeholder,
    mandatory = false,
    error = "",
    rows = 4,
}: any) => {
    return (
        <div className="w-full flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-card-foreground">
                {label}
                {mandatory && <span className="text-danger">*</span>}
            </label>

            <textarea
                rows={rows}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
          w-full rounded-md border border-border bg-input px-4
          text-sm text-foreground placeholder:text-muted-foreground
          outline-none transition duration-200
          hover:border-primary
          focus:border-primary focus:ring-1 focus:ring-primary/20
        "
            />

            {!!error?.length && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
};

const SelectInputNormal = ({
    label,
    value,
    onChange,
    options,
    mandatory = false,
    error = "",
    name = "",
}: any) => (
    <div className="w-full flex flex-col gap-1">
        <label className="text-sm font-medium text-card-foreground">
            {label}
            {mandatory && <span className="text-danger">*</span>}
        </label>

        <select
            name={name}
            value={value}
            onChange={onChange}
            className="
        w-full h-8 rounded-md border border-border bg-input px-4
        text-sm text-foreground outline-none transition duration-200
        hover:border-primary
        focus:border-primary focus:ring-1 focus:ring-primary/20
        cursor-pointer
      "
        >
            {options?.map((option: any, idx: any) => (
                <option key={idx} value={idx == 0 ? "" : option?.value}>
                    {option?.label}
                </option>
            ))}
        </select>

        {!!error?.length && <p className="text-xs text-danger">{error}</p>}
    </div>
);

const OPTIONS_BATCH_SIZE = 100;
const EMPTY_STYLES = {};

const CustomMenuList = (props: any) => {
    const { children, selectProps, innerRef, innerProps } = props;
    const handleScroll = (e: any) => {
        const target = e.currentTarget;
        const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;

        if (isBottom && selectProps?.onLoadMoreOptions) {
            selectProps.onLoadMoreOptions();
        }
    };

    return (
        <components.MenuList
            {...props}
            innerRef={innerRef}
            innerProps={{
                ...innerProps,
                onScroll: handleScroll,
            }}
        >
            {children}
        </components.MenuList>
    );
};

/* ===================================================
   SELECT INPUT
=================================================== */

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
    defaultValue = null,
    styles: customStyles = EMPTY_STYLES,

    // ✅ New props
    largeData = false,
    batchSize = OPTIONS_BATCH_SIZE,
}: any) => {
    const [inputValue, setInputValue] = useState("");
    const [visibleCount, setVisibleCount] = useState(batchSize);

    /* ===================================================
       NORMALIZE OPTIONS
    =================================================== */

    const normalizedOptions = useMemo(() => {
        return (options || []).map((option: any, idx: number) => {
            if (
                option &&
                typeof option === "object" &&
                "label" in option &&
                "value" in option
            ) {
                const label = String(option.label ?? "");

                return {
                    ...option,
                    label,
                    value:
                        idx === 0 && option?.value === ""
                            ? ""
                            : option.value,
                    searchLabel: label.toLowerCase(),
                };
            }

            const label = String(option || "");

            return {
                label,
                value: option,
                searchLabel: label.toLowerCase(),
            };
        });
    }, [options]);

    /* ===================================================
       SELECTED OPTION MAP
       Fast selected value lookup
    =================================================== */

    const optionMap = useMemo(() => {
        const map = new Map();

        normalizedOptions.forEach((option: any) => {
            map.set(String(option.value), option);
        });

        return map;
    }, [normalizedOptions]);

    const selectedOption = useMemo(() => {
        return optionMap.get(String(value ?? "")) || null;
    }, [optionMap, value]);

    /* ===================================================
       MANUAL SEARCH
       Searches from full list
    =================================================== */

    const matchedOptions = useMemo(() => {
        const search = inputValue.trim().toLowerCase();

        if (!search) {
            return normalizedOptions;
        }

        const result: any[] = [];

        for (const option of normalizedOptions) {
            if (option.searchLabel.includes(search)) {
                result.push(option);
            }
        }

        return result;
    }, [normalizedOptions, inputValue]);

    /* ===================================================
       VISIBLE OPTIONS
       Normal select = all matched options
       Large select = batch wise options
    =================================================== */

    const visibleOptions = useMemo(() => {
        if (!largeData) {
            return matchedOptions;
        }

        return matchedOptions.slice(0, visibleCount);
    }, [matchedOptions, visibleCount, largeData]);

    /* ===================================================
       LOAD MORE FOR LARGE DATA
    =================================================== */

    const handleLoadMoreOptions = useCallback(() => {
        if (!largeData) return;

        setVisibleCount((prev: number) => {
            if (prev >= matchedOptions.length) return prev;

            const next = prev + batchSize;

            return next > matchedOptions.length
                ? matchedOptions.length
                : next;
        });
    }, [largeData, matchedOptions.length, batchSize]);

    /* ===================================================
       STYLES - SAME CSS
    =================================================== */

    const defaultStyles = useMemo(
        () => ({
            control: (base: any, state: any) => ({
                ...base,
                minHeight: "32px",
                height: "32px",
                borderRadius: "0.2rem",
                borderColor: state.isFocused
                    ? "var(--primary)"
                    : "var(--border)",
                boxShadow: state.isFocused
                    ? "0 0 0 1px var(--primary)"
                    : "none",
                backgroundColor: disabled ? "var(--muted)" : "var(--input)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 200ms",
                opacity: disabled ? 0.7 : 1,
                "&:hover": {
                    borderColor: "var(--primary)",
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
                color: "var(--foreground)",
                fontSize: "14px",
            }),

            singleValue: (base: any) => ({
                ...base,
                color: "var(--foreground)",
                fontSize: "14px",
            }),

            placeholder: (base: any) => ({
                ...base,
                color: "var(--muted-foreground)",
                fontSize: "14px",
            }),

            indicatorsContainer: (base: any) => ({
                ...base,
                height: "30px",
            }),

            dropdownIndicator: (base: any) => ({
                ...base,
                padding: "4px",
                color: "var(--muted-foreground)",
                "&:hover": {
                    color: "var(--primary)",
                },
            }),

            clearIndicator: (base: any) => ({
                ...base,
                padding: "4px",
                color: "var(--muted-foreground)",
                "&:hover": {
                    color: "var(--danger)",
                },
            }),

            indicatorSeparator: () => ({
                display: "none",
            }),

            menu: (base: any) => ({
                ...base,
                zIndex: 9999,
                fontSize: "14px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                overflow: "hidden",
            }),

            menuList: (base: any) => ({
                ...base,
                backgroundColor: "var(--card)",
                padding: "4px",
                maxHeight: "280px",
                overflowY: "auto",
            }),

            menuPortal: (base: any) => ({
                ...base,
                zIndex: 9999,
            }),

            option: (base: any, state: any) => ({
                ...base,
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                cursor: "pointer",
                borderRadius: "0.25rem",
                backgroundColor: state.isSelected
                    ? "var(--primary)"
                    : state.isFocused
                        ? "var(--muted)"
                        : "var(--card)",
                color: state.isSelected
                    ? "var(--primary-foreground)"
                    : "var(--card-foreground)",
                "&:active": {
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                },
            }),

            noOptionsMessage: (base: any) => ({
                ...base,
                color: "var(--muted-foreground)",
                fontSize: "14px",
            }),
        }),
        [disabled]
    );

    const mergedStyles = useMemo(() => {
        return {
            ...defaultStyles,
            ...customStyles,
        };
    }, [defaultStyles, customStyles]);

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="w-full flex flex-col gap-1">
            {!!label?.length && (
                <label className="text-sm font-medium text-card-foreground">
                    {label}
                    {mandatory && <span className="text-danger">*</span>}
                </label>
            )}

            <Select
                name={name}
                value={selectedOption}
                defaultValue={defaultValue}
                options={visibleOptions}
                placeholder={placeholder}
                isDisabled={disabled}
                isSearchable
                isClearable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                classNamePrefix="common-select"
                styles={mergedStyles}
                components={
                    largeData
                        ? {
                            MenuList: CustomMenuList,
                        }
                        : undefined
                }
                inputValue={inputValue}
                filterOption={() => true}
                captureMenuScroll={false}
                menuShouldScrollIntoView={false}
                maxMenuHeight={280}
                onLoadMoreOptions={
                    largeData ? handleLoadMoreOptions : undefined
                }
                onMenuOpen={() => {
                    if (largeData) {
                        setVisibleCount(batchSize);
                    }
                }}
                onInputChange={(newValue, actionMeta) => {
                    if (actionMeta.action === "input-change") {
                        setInputValue(newValue);

                        if (largeData) {
                            setVisibleCount(batchSize);
                        }
                    }

                    if (actionMeta.action === "menu-close") {
                        setInputValue("");

                        if (largeData) {
                            setVisibleCount(batchSize);
                        }
                    }

                    return newValue;
                }}
                onChange={(selected: any) => {
                    onChange({
                        target: {
                            name,
                            value: selected?.value || "",
                        },
                    });

                    setInputValue("");

                    if (largeData) {
                        setVisibleCount(batchSize);
                    }
                }}
                noOptionsMessage={() => "No options found"}
            />

            {!!error?.length && <p className="text-xs text-danger">{error}</p>}

            {largeData && matchedOptions.length > visibleOptions.length && (
                <p className="text-[11px] text-muted-foreground">
                    Showing {visibleOptions.length} of {matchedOptions.length}.
                    Scroll down to load more.
                </p>
            )}
        </div>
    );
};

export { TextInput, SelectInput, TextArea, SelectInputNormal,ToggleInput };