
type BadgeVariant = "success" | "primary" | "danger";
interface BadgeColor {
    text: string;
    bg: string;
    border: string;
}

const Badge = ({ count = 0, text = "", varient = "success" }) => {
    const badgeColl: Record<BadgeVariant, BadgeColor> = {
        success: { text: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
        primary: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        danger: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" }
    };

    return (
        <>
            <div id="account-summary" className="flex items-start gap-3">
                <div className={`flex items-center gap-1 ${badgeColl[varient]?.bg} border ${badgeColl[varient]?.border} rounded-md px-2 py-1 h-8`}>
                    <span className="text-xs text-gray-600">{text}</span>
                    <span className={`text-sm font-semibold ${badgeColl[varient]?.text}`}>
                        {count}
                    </span>
                </div>
            </div>
        </>
    )
}

export default Badge;