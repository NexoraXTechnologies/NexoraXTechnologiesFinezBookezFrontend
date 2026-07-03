import { ArrowLeft, ArrowRight, Save } from "lucide-react";

const TransportOrderFooter = ({
	step,
	totalSteps,
	loading,
	buttonLabel,
	onBack,
	onNext,
}: any) => {
	const isLastStep = step === totalSteps - 1;

	return (
		<footer className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card p-4 shadow-sm">
			{step > 0 && (
				<button
					type="button"
					onClick={onBack}
					className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10"
				>
					<ArrowLeft size={18} />
					Back
				</button>
			)}

			<button
				type="button"
				disabled={loading}
				onClick={onNext}
				className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isLastStep ? <Save size={18} /> : <ArrowRight size={18} />}

				{loading ? "Saving..." : buttonLabel}
			</button>
		</footer>
	);
};

export default TransportOrderFooter;