import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";

const AuthButton = ({ clickCb, loader, btnName }: any) => {
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            disabled={loader}
            onClick={clickCb}
            className={`w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/10 ${loader ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
        >
            {loader ? "Submitting..." : btnName}
        </motion.button>
    );
};

const PaginationButton = ({ disabled, onClick, icon }: any) => {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="
        flex items-center justify-center w-10 h-9 cursor-pointer rounded-md border
        border-border bg-card text-muted-foreground shadow-sm
        transition-all duration-200
        hover:bg-muted hover:text-primary hover:border-primary
        disabled:opacity-40 disabled:cursor-not-allowed
        disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border
      "
        >
            {icon}
        </button>
    );
};

const DataREfreshButton = ({ callBackFn }: any) => (
    <button
        onClick={callBackFn}
        className="
      h-9 w-11 cursor-pointer flex items-center justify-center rounded border
      border-border bg-card text-muted-foreground shadow-sm
      transition-all duration-200
      hover:bg-muted hover:text-primary hover:border-primary
      focus:outline-none focus:ring-4 focus:ring-primary/10
      active:scale-95
    "
    >
        <RefreshCw size={18} />
    </button>
);

const DataCreateButton = ({
    callBackFn,
    text = "Add Account",
    icon,
    disabled = false,
}: {
    callBackFn: () => void;
    text?: string;
    icon?: any;
    disabled?: boolean;
}) => {
    return (
        <button
            id="account-add-button"
            onClick={callBackFn}
            disabled={disabled}
            className="
        h-9 cursor-pointer px-3 flex items-center justify-center  rounded-md
        bg-primary text-primary-foreground text-sm font-medium shadow-lg
        transition-all duration-200
        hover:opacity-90
        focus:outline-none focus:ring-4 focus:ring-primary/10
        active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
      "
        >
            {icon ? icon : <Plus size={18} />}
            <span>{text}</span>
        </button>
    );
};

const PrimaryButton = ({
    callBackFn,
    text,
    icon = null,
    disabled = false,
    className = "",
    loader = false
}: any) => (
    <button
        id="account-add-button"
        onClick={callBackFn}
        disabled={disabled || loader}
        className={`
      h-9 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md
      bg-primary text-primary-foreground text-sm font-medium shadow-lg
      transition-all duration-200
      hover:opacity-90
      focus:outline-none focus:ring-4 focus:ring-primary/10
      active:scale-95
      disabled:opacity-60 disabled:cursor-not-allowed
      ${className}
    `}
    >
        {loader ? "Loading.." : <>{icon ? icon : ""}<span> {text}</span></>}
    </button>
);

const SecondaryButton = ({
    callBackFn,
    text,
    icon = null,
    disabled = false,
}: any) => (
    <button
        id="account-add-button"
        onClick={callBackFn}
        disabled={disabled}
        className="
      h-9 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md
      bg-muted text-foreground text-sm font-medium shadow-sm border border-border
      transition-all duration-200
      hover:bg-card hover:text-primary hover:border-primary
      focus:outline-none focus:ring-4 focus:ring-primary/10
      active:scale-95
      disabled:opacity-60 disabled:cursor-not-allowed
    "
    >
        {icon ? icon : ""} <span>{text}</span>
    </button>
);

const SuccessButton = ({
    callBackFn,
    text,
    icon = null,
    disabled = false,
    loader = false
}: any) => (
    <button
        id="account-add-button"
        onClick={callBackFn}
        disabled={disabled || loader}
        className="
      h-9 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md
      bg-success text-success-foreground text-sm font-medium shadow-sm
      transition-all duration-200
      hover:opacity-90
      focus:outline-none focus:ring-4 focus:ring-success/10
      active:scale-95
      disabled:opacity-60 disabled:cursor-not-allowed
    "
    >
        {loader ? "Loading.." : <>{icon ? icon : ""}<span>{text}</span></>}
    </button>
);

const BlueButton = ({ callBackFn, text, icon, disabled = false }: any) => (
    <button
        id="account-add-button"
        onClick={callBackFn}
        disabled={disabled}
        className="
      h-9 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md
      bg-primary text-primary-foreground text-sm font-medium shadow-sm
      transition-all duration-200
      hover:opacity-90
      focus:outline-none focus:ring-4 focus:ring-primary/10
      active:scale-95
      disabled:opacity-60 disabled:cursor-not-allowed
    "
    >
        {icon ? icon : ""} <span>{text}</span>
    </button>
);

export {
    AuthButton,
    PaginationButton,
    DataREfreshButton,
    DataCreateButton,
    PrimaryButton,
    SecondaryButton,
    SuccessButton,
    BlueButton,
};