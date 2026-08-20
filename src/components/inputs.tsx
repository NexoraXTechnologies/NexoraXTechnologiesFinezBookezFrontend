import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import Select, { components } from "react-select";
import type { ReactNode } from "react";
import { CheckSquare, Square } from "lucide-react";

type CheckboxProps = {
    checked: boolean;
    label?: ReactNode;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    name?: string;
    value?: string;
    className?: string;
    labelClassName?: string;
    iconSize?: number;
};

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
    onKeyDown,
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
                onKeyDown={onKeyDown}
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
          w-full rounded-md border border-border bg-input px-4 py-2
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
    largeData = false,
    batchSize = OPTIONS_BATCH_SIZE,
    isMulti = false,
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

    const getSelectValue = (item: any) => {
        if (
            item &&
            typeof item === "object"
        ) {
            return (
                item.value ??
                item.code ??
                item.accountCode ??
                item.productCode ??
                item.unitCode ??
                item._id ??
                ""
            );
        }

        return item ?? "";
    };

    const selectedOption = useMemo(() => {
        if (isMulti) {
            if (!Array.isArray(value)) {
                return [];
            }

            return value
                .map((item: any) => optionMap.get(String(getSelectValue(item))) || null)
                .filter(Boolean);
        }

        return optionMap.get(String(getSelectValue(value))) || null;
    }, [optionMap, value, isMulti]);

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
       Single select remains unchanged.
       Multi select expands only when chips are selected.
    =================================================== */

    const defaultStyles = useMemo(
        () => ({
            control: (base: any, state: any) => ({
                ...base,
                minHeight: "32px",
                height: isMulti ? "auto" : "32px",
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
                minHeight: "30px",
                height: isMulti ? "auto" : "30px",
                padding: isMulti ? "2px 8px" : "0 12px",
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

            multiValue: (base: any) => ({
                ...base,
                margin: "1px 2px",
                borderRadius: "0.25rem",
                backgroundColor: "var(--primary)",
            }),

            multiValueLabel: (base: any) => ({
                ...base,
                padding: "2px 5px",
                color: "var(--primary-foreground)",
                fontSize: "12px",
                fontWeight: 600,
            }),

            multiValueRemove: (base: any) => ({
                ...base,
                color: "var(--primary-foreground)",
                cursor: "pointer",
                "&:hover": {
                    backgroundColor: "var(--danger)",
                    color: "white",
                },
            }),

            placeholder: (base: any) => ({
                ...base,
                color: "var(--muted-foreground)",
                fontSize: "14px",
            }),

            indicatorsContainer: (base: any) => ({
                ...base,
                minHeight: "30px",
                height: isMulti ? "auto" : "30px",
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
        [disabled, isMulti]
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
                isMulti={isMulti}
                closeMenuOnSelect={!isMulti}
                hideSelectedOptions={false}
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
                // @ts-ignore
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
                    const selectedValue = isMulti
                        ? (selected || []).map((item: any) => item?.value)
                        : selected?.value || "";

                    onChange({
                        target: {
                            name,
                            value: selectedValue,
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
        </div>
    );
};

type ImageUploadInputProps = {
    label: string;
    value?: string | null;
    error?: string;
    placeholder?: string;
    alt?: string;
    mandatory?: boolean;
    onChange: (value: string | null) => void;
    className?: string,
    validateImage?: () => boolean;
};

const ImageUploadInput = ({
    label,
    value = "",
    error = "",
    placeholder = "Click to upload image",
    alt = "Uploaded Image",
    mandatory = false,
    onChange,
    className = "",
    validateImage = () => true
}: ImageUploadInputProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file: any = e.target.files?.[0];

        if (!file) return;
        // @ts-ignore
        if (!validateImage(file)) {
            e.target.value = "";
            return;
        }

        const base64 = await fileToBase64(file);
        onChange(base64);
        e.target.value = "";
    };

    return (
        <div className={`flex w-full min-w-0 flex-col gap-1.5 ${className}`}>
            {!!label?.length && (
                <label className="text-sm font-semibold text-card-foreground">
                    {label}
                    {mandatory && <span className="ml-0.5 text-danger">*</span>}
                </label>
            )}

            <motion.div
                role="button"
                tabIndex={0}
                whileHover={{
                    y: -2,
                    scale: 1.01,
                }}
                whileTap={{
                    scale: 0.99,
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        inputRef.current?.click();
                    }
                }}
                className={`
            group relative flex h-[118px] w-full min-w-0 cursor-pointer
            items-center justify-center overflow-hidden rounded-xl border-2
            border-dashed bg-card p-3 transition-colors duration-200
            hover:border-primary hover:bg-primary/5 hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-primary/20
            sm:h-[130px]
            ${error ? "border-danger bg-danger/5" : "border-border"}
        `}
            >
                <AnimatePresence mode="wait">
                    {value ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -8 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 22,
                            }}
                            className="relative flex h-full w-full items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-background/10" />

                            <motion.img
                                src={value}
                                alt={alt}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="
                            relative z-10 max-h-[88px] max-w-full rounded-lg
                            object-contain transition duration-200
                            group-hover:scale-[1.02] sm:max-h-[98px] sm:max-w-[220px]
                        "
                            />

                            <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                className="
                            absolute inset-0 z-20 flex items-center justify-center
                            bg-black/0 opacity-0 transition duration-200
                             group-hover:opacity-100
                        "
                            >
                                <motion.span
                                    initial={{ scale: 0.9, y: 5 }}
                                    whileHover={{ scale: 1, y: 0 }}
                                    className="rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-card-foreground shadow"
                                >
                                    Click to change
                                </motion.span>
                            </motion.div>

                            <motion.button
                                type="button"
                                title="Remove image"
                                whileHover={{
                                    scale: 1.08,
                                    rotate: 6,
                                }}
                                whileTap={{
                                    scale: 0.92,
                                }}
                                className="
                            absolute right-1 top-0 z-30 flex h-7 w-7 items-center
                            justify-center rounded-full bg-card text-danger shadow-md
                            transition hover:bg-danger hover:text-white
                        "
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(null);
                                }}
                            >
                                <X size={15} strokeWidth={2.5} />
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -8 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 22,
                            }}
                            className="flex flex-col items-center justify-center gap-2 text-center"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -3, 0],
                                }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="
                            flex h-10 w-10 items-center justify-center rounded-full
                            bg-primary/10 text-primary transition duration-200
                            group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground
                        "
                            >
                                <ImagePlus size={20} />
                            </motion.div>

                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-card-foreground">
                                    {placeholder}
                                </p>

                                <p className="text-[11px] text-muted-foreground">
                                    PNG, JPG, JPEG or WEBP
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {!!error?.length && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs font-medium text-danger"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};


type DocumentUploadInputProps = {
    label?: string;
    value?: any[];
    error?: string;
    mandatory?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    accept?: string;
    placeholder?: string;
    description?: string;
    allowedText?: string;
    className?: string;
    onChange: (documents: any[]) => void;
};

const documentFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
};

const DocumentUploadInput = ({
    label = "",
    value = [],
    error = "",
    mandatory = false,
    disabled = false,
    multiple = true,
    accept = ".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx",
    placeholder = "Upload Documents",
    description = "Attach PDF, Excel, Word, or image files.",
    allowedText = "Allowed: PDF, PNG, JPG, JPEG, XLS, XLSX, DOC, DOCX",
    className = "",
    onChange,
}: DocumentUploadInputProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (!files.length) return;

        const uploadedDocs: any[] = [];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                continue;
            }

            const base64 = await documentFileToBase64(file);

            uploadedDocs.push({
                documentName: file.name,
                documentUrl: base64,
                fileSizeKB: Math.round(file.size / 1024),
                mimeType: file.type,
            });
        }

        onChange([...(value || []), ...uploadedDocs]);

        e.target.value = "";
    };

    const removeDocument = (index: number) => {
        onChange((value || []).filter((_: any, i: number) => i !== index));
    };

    return (
        <div className={`flex w-full flex-col gap-1.5 ${className}`}>
            {!!label?.length && (
                <label className="text-sm font-semibold text-card-foreground">
                    {label}
                    {mandatory && <span className="ml-0.5 text-danger">*</span>}
                </label>
            )}

            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    if (!disabled) inputRef.current?.click();
                }}
                onKeyDown={(e) => {
                    if (disabled) return;

                    if (e.key === "Enter" || e.key === " ") {
                        inputRef.current?.click();
                    }
                }}
                className={`
					flex min-h-[118px] cursor-pointer flex-col items-center justify-center
					rounded-xl border-2 border-dashed bg-card p-4 text-center
					transition duration-200 hover:border-primary hover:bg-primary/5
					focus:outline-none focus:ring-2 focus:ring-primary/20
					disabled:cursor-not-allowed disabled:opacity-70
					${error ? "border-danger bg-danger/5" : "border-border"}
					${disabled ? "pointer-events-none opacity-70" : ""}
				`}
            >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Paperclip size={20} />
                </div>

                <p className="text-sm font-semibold text-card-foreground">
                    {placeholder}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>

                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                    {allowedText}
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                disabled={disabled}
                onChange={handleFileChange}
                className="hidden"
            />

            {!!value?.length && (
                <div className="mt-2 flex flex-col gap-2">
                    {value.map((doc: any, index: number) => (
                        <div
                            key={`${doc?.documentName || "document"}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-input px-3 py-2"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-card-foreground">
                                    {doc?.documentName || "-"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {doc?.fileSizeKB || 0} KB
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => removeDocument(index)}
                                className="rounded-md p-2 text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!!error?.length && (
                <p className="text-xs font-medium text-danger">{error}</p>
            )}
        </div>
    );
};


export { TextInput, SelectInput, TextArea, SelectInputNormal, ToggleInput, ImageUploadInput, DocumentUploadInput };








export const renderField = ({
    field,
    form,
    handleInputChange,
    handleSelectChange,
    updateField,
    isView
}: any) => {
    const commonProps = {
        label: field.label,
        value:
            typeof field.value === "function"
                ? field.value(form)
                : form?.[field.key],
        mandatory: field.mandatory,
        disabled: field.disabled,
        error: field.error || "",
    };

    if (field.type === "select") {
        return (
            <SelectInput
                key={field.key}
                {...commonProps}
                options={field.options || []}
                disabled={isView}
                isMulti={field?.isMulti === true || field?.selectionType === "multiselect"}
                onChange={handleSelectChange(field.key)}
            />
        );
    }

    if (field.type === "toggle" || field.type === "checkbox") {
        return (
            <div key={field.key} className={field.className || ""}>
                <ToggleInput
                    label={field.label}
                    name={field.key}
                    value={Boolean(form?.[field.key])}
                    checked={Boolean(form?.[field.key])}
                    mandatory={field.mandatory}
                    disabled={field.disabled || isView}
                    error={field.error || ""}
                    onChange={(event: any) => {
                        if (isView) return;

                        const checked =
                            event?.target?.checked ??
                            event?.checked ??
                            false;

                        updateField(field.key, checked);
                    }}
                />
            </div>
        );
    }

    if (field.type === "textarea") {
        return (
            <div key={field.key} className={field.className || "md:col-span-2 xl:col-span-3"}>
                <TextArea
                    label={field.label}
                    value={form?.[field.key] || ""}
                    placeholder={field.placeholder}
                    onChange={(e: any) => {
                        const value = e?.target?.value || "";

                        updateField(
                            field.key,
                            field.maxLength ? value.slice(0, field.maxLength) : value
                        );
                    }}
                    disabled={isView}
                />

                {field.maxLength && (
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                        {String(form?.[field.key] || "").length}/{field.maxLength}
                    </p>
                )}
            </div>
        );
    }

    return (
        <TextInput
            key={field.key}
            {...commonProps}
            type={field.type || "text"}
            className={
                field.type === "date" || field.type === "datetime-local"
                    ? "dark:[color-scheme:dark]"
                    : ""
            }
            placeholder={field.placeholder}
            onChange={field.disabled ? () => { } : handleInputChange(field.key)}
            disabled={isView}
        />
    );
};


export const Checkbox = ({
    checked,
    label,
    onChange,
    disabled = false,
    name,
    value,
    className = "",
    labelClassName = "",
    iconSize = 20,
}: CheckboxProps) => {
    return (
        <label
            className={`
                flex w-full items-center gap-3 text-left text-sm font-medium
                text-card-foreground transition
                ${disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }
                ${className}
            `}
        >
            <input
                type="checkbox"
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="sr-only"
            />

            {checked ? (
                <CheckSquare
                    size={iconSize}
                    aria-hidden="true"
                    className="shrink-0 text-primary"
                />
            ) : (
                <Square
                    size={iconSize}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                />
            )}

            {label !== undefined && label !== null ? (
                <span className={labelClassName}>{label}</span>
            ) : null}
        </label>
    );
};

const CREATE_OPTION_VALUE =
    "__CREATE_NEW_SELECT_OPTION__";

type CreateOptionLabel =
    | string
    | ((searchValue: string) => string);

type CreatableSelectInputProps = {
    label?: string;
    value?: any;
    onChange: (event: any) => void;
    options?: any[];
    mandatory?: boolean;
    error?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    defaultValue?: any;
    styles?: any;
    largeData?: boolean;
    batchSize?: number;
    onCreateOption?: (
        searchValue: string
    ) => void | Promise<void>;
    createOptionLabel?: CreateOptionLabel;
    showCreateOnEmpty?: boolean;
    useMenuPortal?: boolean;
};

export const CreatableSelectInput = ({
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
    styles: customStyles = {},
    largeData = false,
    batchSize = 100,
    onCreateOption,
    createOptionLabel = "+ Add New",
    showCreateOnEmpty = true,
    useMenuPortal = true,
}: CreatableSelectInputProps) => {
    const [
        inputValue,
        setInputValue,
    ] = useState("");

    const [
        visibleCount,
        setVisibleCount,
    ] = useState(batchSize);

    const normalizedOptions =
        useMemo(() => {
            return (options || [])
                .map((option: any) => {
                    if (
                        option &&
                        typeof option ===
                        "object" &&
                        "label" in option &&
                        "value" in option
                    ) {
                        return {
                            ...option,

                            label:
                                String(
                                    option.label ??
                                    ""
                                ),

                            value:
                                option.value,

                            searchLabel:
                                String(
                                    option.label ??
                                    ""
                                ).toLowerCase(),
                        };
                    }

                    return {
                        label:
                            String(
                                option ?? ""
                            ),

                        value:
                            option,

                        searchLabel:
                            String(
                                option ?? ""
                            ).toLowerCase(),
                    };
                })
                .filter(
                    (option: any) =>
                        option.value !==
                        "" &&
                        option.value !==
                        null &&
                        option.value !==
                        undefined
                );
        }, [options]);

    const selectedOption =
        useMemo(() => {
            return (
                normalizedOptions.find(
                    (option: any) =>
                        String(
                            option.value
                        ) ===
                        String(
                            value ?? ""
                        )
                ) || null
            );
        }, [
            normalizedOptions,
            value,
        ]);

    const matchedOptions =
        useMemo(() => {
            const searchValue =
                inputValue
                    .trim()
                    .toLowerCase();

            if (!searchValue) {
                return normalizedOptions;
            }

            return normalizedOptions.filter(
                (option: any) =>
                    option.searchLabel.includes(
                        searchValue
                    )
            );
        }, [
            normalizedOptions,
            inputValue,
        ]);

    const visibleOptions =
        useMemo(() => {
            if (!largeData) {
                return matchedOptions;
            }

            return matchedOptions.slice(
                0,
                visibleCount
            );
        }, [
            matchedOptions,
            visibleCount,
            largeData,
        ]);

    const shouldShowCreateOption =
        typeof onCreateOption ===
        "function" &&
        matchedOptions.length === 0 &&
        (
            showCreateOnEmpty ||
            inputValue.trim().length > 0
        );

    const createActionOption =
        useMemo(() => {
            if (
                !shouldShowCreateOption
            ) {
                return null;
            }

            const searchValue =
                inputValue.trim();

            const createLabel =
                typeof createOptionLabel ===
                    "function"
                    ? createOptionLabel(
                        searchValue
                    )
                    : searchValue
                        ? `${createOptionLabel} "${searchValue}"`
                        : createOptionLabel;

            return {
                label:
                    createLabel,

                value:
                    CREATE_OPTION_VALUE,

                __isCreateOption:
                    true,
            };
        }, [
            shouldShowCreateOption,
            inputValue,
            createOptionLabel,
        ]);

    const selectOptions =
        useMemo(() => {
            if (
                createActionOption
            ) {
                return [
                    createActionOption,
                ];
            }

            return visibleOptions;
        }, [
            createActionOption,
            visibleOptions,
        ]);

    const defaultStyles =
        useMemo(
            () => ({
                control: (
                    base: any,
                    state: any
                ) => ({
                    ...base,

                    minHeight:
                        "32px",

                    height:
                        "32px",

                    borderRadius:
                        "0.2rem",

                    borderColor:
                        state.isFocused
                            ? "var(--primary)"
                            : "var(--border)",

                    boxShadow:
                        state.isFocused
                            ? "0 0 0 1px var(--primary)"
                            : "none",

                    backgroundColor:
                        disabled
                            ? "var(--muted)"
                            : "var(--input)",

                    cursor:
                        disabled
                            ? "not-allowed"
                            : "pointer",

                    opacity:
                        disabled
                            ? 0.7
                            : 1,

                    transition:
                        "all 200ms",

                    "&:hover": {
                        borderColor:
                            "var(--primary)",
                    },
                }),

                valueContainer: (
                    base: any
                ) => ({
                    ...base,
                    height: "30px",
                    padding: "0 12px",
                }),

                input: (
                    base: any
                ) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                    color:
                        "var(--foreground)",
                    fontSize:
                        "14px",
                }),

                singleValue: (
                    base: any
                ) => ({
                    ...base,
                    color:
                        "var(--foreground)",
                    fontSize:
                        "14px",
                }),

                placeholder: (
                    base: any
                ) => ({
                    ...base,
                    color:
                        "var(--muted-foreground)",
                    fontSize:
                        "14px",
                }),

                indicatorsContainer: (
                    base: any
                ) => ({
                    ...base,
                    height: "30px",
                }),

                dropdownIndicator: (
                    base: any
                ) => ({
                    ...base,
                    padding: "4px",
                    color:
                        "var(--muted-foreground)",

                    "&:hover": {
                        color:
                            "var(--primary)",
                    },
                }),

                indicatorSeparator:
                    () => ({
                        display:
                            "none",
                    }),

                menu: (
                    base: any
                ) => ({
                    ...base,
                    zIndex:
                        2147483647,
                    fontSize:
                        "14px",
                    backgroundColor:
                        "var(--card)",
                    border:
                        "1px solid var(--border)",
                    boxShadow:
                        "0 12px 28px rgba(0,0,0,0.18)",
                    overflow:
                        "hidden",
                }),

                menuList: (
                    base: any
                ) => ({
                    ...base,
                    backgroundColor:
                        "var(--card)",
                    padding: "4px",
                    maxHeight:
                        "280px",
                    overflowY:
                        "auto",
                }),

                menuPortal: (
                    base: any
                ) => ({
                    ...base,
                    zIndex:
                        2147483647,
                }),

                option: (
                    base: any,
                    state: any
                ) => {
                    const isCreateOption =
                        Boolean(
                            state?.data
                                ?.__isCreateOption
                        );

                    return {
                        ...base,

                        minHeight:
                            "34px",

                        display:
                            "flex",

                        alignItems:
                            "center",

                        borderRadius:
                            "0.25rem",

                        cursor:
                            "pointer",

                        fontSize:
                            "14px",

                        fontWeight:
                            isCreateOption
                                ? 700
                                : 400,

                        backgroundColor:
                            state.isSelected
                                ? "var(--primary)"
                                : state.isFocused
                                    ? "var(--muted)"
                                    : "var(--card)",

                        color:
                            state.isSelected
                                ? "var(--primary-foreground)"
                                : isCreateOption
                                    ? "var(--primary)"
                                    : "var(--card-foreground)",

                        "&:active": {
                            backgroundColor:
                                "var(--primary)",

                            color:
                                "var(--primary-foreground)",
                        },
                    };
                },

                noOptionsMessage: (
                    base: any
                ) => ({
                    ...base,
                    color:
                        "var(--muted-foreground)",
                    fontSize:
                        "14px",
                }),
            }),
            [disabled]
        );

    const mergedStyles =
        useMemo(
            () => ({
                ...defaultStyles,
                ...customStyles,
            }),
            [
                defaultStyles,
                customStyles,
            ]
        );

    const resetSearch = () => {
        setInputValue("");
        setVisibleCount(
            batchSize
        );
    };

    return (
        <div className="flex w-full flex-col gap-1">
            {!!label?.length && (
                <label className="text-sm font-medium text-card-foreground">
                    {label}

                    {mandatory && (
                        <span className="text-danger">
                            *
                        </span>
                    )}
                </label>
            )}

            <Select
                name={name}
                value={selectedOption}
                defaultValue={
                    defaultValue
                }
                options={
                    selectOptions
                }
                placeholder={
                    placeholder
                }
                isDisabled={
                    disabled
                }
                isSearchable
                isClearable={
                    false
                }
                menuPortalTarget={
                    useMenuPortal &&
                        typeof document !==
                        "undefined"
                        ? document.body
                        : undefined
                }
                menuPosition={
                    useMenuPortal
                        ? "fixed"
                        : "absolute"
                }
                styles={
                    mergedStyles
                }
                inputValue={
                    inputValue
                }
                filterOption={() =>
                    true
                }
                captureMenuScroll={
                    false
                }
                menuShouldScrollIntoView={
                    false
                }
                maxMenuHeight={
                    280
                }
                onMenuOpen={() => {
                    setVisibleCount(
                        batchSize
                    );
                }}
                onMenuScrollToBottom={() => {
                    if (
                        largeData &&
                        visibleCount <
                        matchedOptions.length
                    ) {
                        setVisibleCount(
                            (
                                previous
                            ) =>
                                Math.min(
                                    previous +
                                    batchSize,

                                    matchedOptions.length
                                )
                        );
                    }
                }}
                onInputChange={(
                    nextValue,
                    actionMeta
                ) => {
                    if (
                        actionMeta.action ===
                        "input-change"
                    ) {
                        setInputValue(
                            nextValue
                        );

                        setVisibleCount(
                            batchSize
                        );
                    }

                    return nextValue;
                }}
                onChange={(
                    selected: any
                ) => {
                    // ⭐ YELLOW STAR: FIXED — REACT-SELECT CREATE OPTION CLICK
                    if (
                        selected
                            ?.__isCreateOption ||
                        selected?.value ===
                        CREATE_OPTION_VALUE
                    ) {
                        const searchValue =
                            inputValue.trim();

                        resetSearch();

                        // Allow React Select menu to close first.
                        window.setTimeout(
                            () => {
                                onCreateOption?.(
                                    searchValue
                                );
                            },
                            0
                        );

                        return;
                    }

                    onChange({
                        target: {
                            name,

                            value:
                                selected
                                    ?.value ??
                                "",
                        },
                    });

                    resetSearch();
                }}
                noOptionsMessage={() =>
                    "No options found"
                }
            />

            {!!error?.length && (
                <p className="text-xs text-danger">
                    {error}
                </p>
            )}
        </div>
    );
};