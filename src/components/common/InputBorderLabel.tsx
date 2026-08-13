

type InputBorderLabelProps = {
    label?: string;
    value?: any;
    loading?: boolean;
    loadingText?: string;
    successWhenPositive?: boolean;
    className?: string;
};

const InputBorderLabel = ({
    label = "",
    value,
    loading = false,
    loadingText = "Checking...",
    successWhenPositive = false,
    className = "",
}: InputBorderLabelProps) => {
    const hasValue = value !== null && value !== undefined && value !== "";

    const textColor = loading
        ? "text-muted-foreground"
        : successWhenPositive
            ? Number(value || 0) > 0
                ? "text-success"
                : "text-danger"
            : "text-muted-foreground";

    return (
        <span className={`absolute -top-[6px] right-2 z-10 bg-background px-1 text-[11px] font-medium ${textColor} ${className}`}>
            {loading || !hasValue ? loadingText : `${label}${label ? ": " : ""}${value}`}
        </span>
    );
};

export default InputBorderLabel;