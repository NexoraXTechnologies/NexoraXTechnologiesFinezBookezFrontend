import { Check } from "lucide-react";

const TransportOrderStepper = ({ step, steps = [] }: any) => {
	return (
		<div className="mb-2 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
			<div
				className="grid items-start"
				style={{
					gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
				}}
			>
				{steps.map((item: string, index: number) => {
					const active = index === step;
					const done = index < step;
					const isLast = index === steps.length - 1;

					return (
						<div
							key={item}
							className="relative flex flex-col items-center"
						>
							{!isLast && (
								<div
									className={`absolute left-1/2 top-3 h-[2px] w-full rounded-full ${
										done ? "bg-success" : "bg-border"
									}`}
								/>
							)}

							<div
								className={`
									relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black transition-all duration-200
									${
										done
											? "border-success bg-success text-white shadow-sm"
											: active
												? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
												: "border-border bg-background text-muted-foreground"
									}
								`}
							>
								{done ? <Check size={16} strokeWidth={3} /> : index + 1}
							</div>

							<span
								className={`
									mt-1 max-w-[90px] truncate text-center text-xs font-bold transition
									${
										active
											? "text-primary"
											: done
												? "text-success"
												: "text-muted-foreground"
									}
								`}
								title={item}
							>
								{item}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TransportOrderStepper;