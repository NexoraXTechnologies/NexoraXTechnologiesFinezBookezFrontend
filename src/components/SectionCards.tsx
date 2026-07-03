/* ===================================================
   REUSABLE SECTION CARD
=================================================== */

import { ChevronDown, ChevronUp } from "lucide-react";

export const SectionCard = ({
    index,
    title,
    icon,
    expanded,
    onToggle,
    children,
}: any) => {
    return (
        <section className="rounded-md border border-border bg-card p-4 shadow-sm ">
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center gap-3 cursor-pointer ${expanded ? "mb-4 border-b border-border pb-3" : ""
                    }`}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {icon}
                </span>

                <h2 className="flex-1 text-left text-base font-bold text-card-foreground">
                    {index}. {title}
                </h2>

                {expanded ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
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

