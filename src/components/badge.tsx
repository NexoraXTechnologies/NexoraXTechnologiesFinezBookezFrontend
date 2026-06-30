const Badge = ({ count = 0, text = "", varient = "success" }) => {
    const badgeColl: any = {
        success: {
            text: "text-success",
            bg: "bg-success/10",
            border: "border-success/20",
        },
        primary: {
            text: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20",
        },
        danger: {
            text: "text-danger",
            bg: "bg-danger/10",
            border: "border-danger/20",
        },
    };

    return (
        <>
            <div id="account-summary" className="flex items-start gap-3">
                <div
                    className={`flex items-center gap-1 ${badgeColl[varient]?.bg} border ${badgeColl[varient]?.border} rounded-md px-2 py-1 h-8`}
                >
                    <span className="text-xs text-muted-foreground">{text}</span>

                    <span className={`text-sm font-semibold ${badgeColl[varient]?.text}`}>
                        {count}
                    </span>
                </div>
            </div>
        </>
    );
};

export default Badge;