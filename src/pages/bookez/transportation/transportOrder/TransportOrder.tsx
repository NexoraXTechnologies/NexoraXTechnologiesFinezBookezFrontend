import { useState } from "react";
import {
	ArrowLeft,
	Save,
	RefreshCcw,
	Truck,
	Package,
	MapPin,
	User,
	CalendarDays,
	Hash,
	IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateTransportOrder = () => {
	const navigate = useNavigate();

	const [form, setForm] = useState<any>({
		transportOrderNumber: "",
		orderDate: "",
		customerName: "",
		customerMobile: "",
		fromLocation: "",
		toLocation: "",
		goodsDescription: "",
		vehicleType: "",
		weight: "",
		freightAmount: "",
		remark: "",
	});

	const handleChange = (key: string, value: any) => {
		setForm((prev: any) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleReset = () => {
		setForm({
			transportOrderNumber: "",
			orderDate: "",
			customerName: "",
			customerMobile: "",
			fromLocation: "",
			toLocation: "",
			goodsDescription: "",
			vehicleType: "",
			weight: "",
			freightAmount: "",
			remark: "",
		});
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();

		console.log("Transport Order Form:", form);

		// Later you can dispatch API here
		// dispatch(addTransportOrder({ payload: form }));
	};

	return (
		<main className="h-full bg-background p-4 text-foreground sm:p-6">
			<section className="mb-6 rounded-md border border-border bg-card p-5 shadow-sm">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<header className="flex items-center gap-3">
						<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
							<Truck size={24} />
						</span>

						<div>
							<h1 className="text-2xl font-bold text-card-foreground">
								Create Transport Order
							</h1>

							<p className="mt-1 text-sm text-muted-foreground">
								Create and manage transport orders for customer goods movement.
							</p>
						</div>
					</header>

					<button
						type="button"
						onClick={() => navigate(-1)}
						className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted"
					>
						<ArrowLeft size={16} />
						Back
					</button>
				</div>
			</section>

			<form
				onSubmit={handleSubmit}
				className="rounded-md border border-border bg-card p-5 shadow-sm"
			>
				<div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
					<Package size={18} className="text-primary" />
					<h2 className="text-lg font-bold text-card-foreground">
						Transport Order Details
					</h2>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Order Number
						</label>

						<div className="relative">
							<Hash
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="text"
								value={form.transportOrderNumber}
								onChange={(e) =>
									handleChange("transportOrderNumber", e.target.value)
								}
								placeholder="Enter order number"
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Order Date
						</label>

						<div className="relative">
							<CalendarDays
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="date"
								value={form.orderDate}
								onChange={(e) => handleChange("orderDate", e.target.value)}
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Customer Name
						</label>

						<div className="relative">
							<User
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="text"
								value={form.customerName}
								onChange={(e) => handleChange("customerName", e.target.value)}
								placeholder="Enter customer name"
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Customer Mobile
						</label>

						<input
							type="text"
							value={form.customerMobile}
							onChange={(e) => handleChange("customerMobile", e.target.value)}
							placeholder="Enter mobile number"
							className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							From Location
						</label>

						<div className="relative">
							<MapPin
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="text"
								value={form.fromLocation}
								onChange={(e) => handleChange("fromLocation", e.target.value)}
								placeholder="Pickup location"
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							To Location
						</label>

						<div className="relative">
							<MapPin
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="text"
								value={form.toLocation}
								onChange={(e) => handleChange("toLocation", e.target.value)}
								placeholder="Delivery location"
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Vehicle Type
						</label>

						<select
							value={form.vehicleType}
							onChange={(e) => handleChange("vehicleType", e.target.value)}
							className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary"
						>
							<option value="">Select vehicle type</option>
							<option value="Mini Truck">Mini Truck</option>
							<option value="Pickup">Pickup</option>
							<option value="Container">Container</option>
							<option value="Trailer">Trailer</option>
							<option value="Open Truck">Open Truck</option>
							<option value="Closed Truck">Closed Truck</option>
						</select>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Weight
						</label>

						<input
							type="number"
							value={form.weight}
							onChange={(e) => handleChange("weight", e.target.value)}
							placeholder="Enter weight"
							className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-card-foreground">
							Freight Amount
						</label>

						<div className="relative">
							<IndianRupee
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>

							<input
								type="number"
								value={form.freightAmount}
								onChange={(e) => handleChange("freightAmount", e.target.value)}
								placeholder="Enter amount"
								className="h-10 w-full rounded-md border border-border bg-input px-9 text-sm text-foreground outline-none transition focus:border-primary"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
						<label className="text-sm font-medium text-card-foreground">
							Goods Description
						</label>

						<textarea
							value={form.goodsDescription}
							onChange={(e) =>
								handleChange("goodsDescription", e.target.value)
							}
							placeholder="Enter goods description"
							rows={3}
							className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
						/>
					</div>

					<div className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
						<label className="text-sm font-medium text-card-foreground">
							Remark
						</label>

						<textarea
							value={form.remark}
							onChange={(e) => handleChange("remark", e.target.value)}
							placeholder="Enter remark"
							rows={3}
							className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
						/>
					</div>
				</div>

				<div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
					<button
						type="button"
						onClick={handleReset}
						className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted"
					>
						<RefreshCcw size={16} />
						Reset
					</button>

					<button
						type="submit"
						className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
					>
						<Save size={16} />
						Save Transport Order
					</button>
				</div>
			</form>
		</main>
	);
};

export default CreateTransportOrder;