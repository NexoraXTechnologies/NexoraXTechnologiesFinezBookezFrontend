// /* ===================================================
//    REUSABLE SECTION CARD
// =================================================== */

// import { ChevronDown, ChevronUp } from "lucide-react";

// export const SectionCard = ({
//     index,
//     title,
//     icon,
//     expanded,
//     onToggle,
//     children,
// }: any) => {
//     return (
//         <section className="rounded-md border border-border bg-card p-3 shadow-sm ">
//             <button
//                 type="button"
//                 onClick={onToggle}
//                 className={`flex w-full items-center gap-3 cursor-pointer ${expanded ? "mb-2 border-b border-border pb-3" : ""
//                     }`}
//             >
//                 <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
//                     {icon}
//                 </span>

//                 <h2 className="flex-1 text-left text-base font-bold text-card-foreground">
//                     {index}. {title}
//                 </h2>

//                 {expanded ? (
//                     <ChevronUp size={20} className="text-muted-foreground" />
//                 ) : (
//                     <ChevronDown size={20} className="text-muted-foreground" />
//                 )}
//             </button>

//             {expanded && (
//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//                     {children}
//                 </div>
//             )}
//         </section>
//     );
// };



// export const FormSectionCard = ({ title, icon, children }: any) => {
//     return (
//         <section className="rounded-md border border-border bg-card p-4 shadow-sm">
//             <div className="mb-4 flex w-full items-center gap-3 border-b border-border pb-3">
//                 <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
//                     {icon}
//                 </span>

//                 <h2 className="flex-1 text-left text-base font-bold text-card-foreground">
//                     {title}
//                 </h2>
//             </div>

//             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//                 {children}
//             </div>
//         </section>
//     );
// };




/* ===================================================
   REUSABLE SECTION CARD
=================================================== */

import { ChevronDown, ChevronUp } from "lucide-react";

export const SectionCard = ({
    index,
    title,
    subtitle,      // NEW - optional, e.g. "1 Entry"
    icon,
    expanded,
    onToggle,
    trailing,      // NEW - optional, e.g. "₹ 700" or "Pending"
    children,
}: any) => {
    return (
        <section className="rounded-md border border-border bg-card p-3 shadow-sm ">
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center gap-3 cursor-pointer ${expanded ? "mb-2 border-b border-border pb-3" : ""
                    }`}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {icon}
                </span>

                <div className="flex-1 min-w-0 text-left">
                    <h2 className="truncate text-base font-bold text-card-foreground">
                        {index}. {title}
                    </h2>

                    {subtitle && (
                        <p className="text-xs font-medium text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                {trailing && (
                    <span className="shrink-0 text-sm font-bold">{trailing}</span>
                )}

                {expanded ? (
                    <ChevronUp size={20} className="shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronDown size={20} className="shrink-0 text-muted-foreground" />
                )}
            </button>

            {expanded && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {children}
                </div>
            )}
        </section>
    );
};



export const FormSectionCard = ({ title, icon, children }: any) => {
    return (
        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex w-full items-center gap-3 border-b border-border pb-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {icon}
                </span>

                <h2 className="flex-1 text-left text-base font-bold text-card-foreground">
                    {title}
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </section>
    );
};