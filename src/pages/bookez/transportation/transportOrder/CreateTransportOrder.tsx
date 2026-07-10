import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";


import CustomerStep from "./steps/CustomerStep";
import LoadStep from "./steps/LoadStep";
import PickupStep from "./steps/PickupStep";
import DeliveryStep from "./steps/DeliveryStep";
import VehicleStep from "./steps/VehicleStep";
import FreightStep from "./steps/FreightStep";
import RiskStep from "./steps/RiskStep";

import {
	STEPS,
	createInitialTransportOrder,
} from "./transportOrderInitialState";

import { computeFreightBalance } from "./transportOrderCalculations";
import { validateCurrentStep } from "./transportOrderValidation";
import TransportOrderStepper from "./component/TransportOrderStepper";
import TransportOrderFooter from "./component/TransportOrderFooter";
import { createTransportOrder, getTransportOrderByVoucherNumber, updateTransportOrderByVoucherNumber } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import { formatDateForInput, formatDateTimeForInput } from "../../../../utils/helperFunctions";

// const mergeTransportOrderWithInitial = (order: any) => {
// 	const initial = createInitialTransportOrder();

// 	return {
// 		...initial,
// 		...order,

// 		contractDetails: {
// 			...initial.contractDetails,
// 			...(order?.contractDetails || {}),
// 		},

// 		customerDetails: {
// 			...initial.customerDetails,
// 			...(order?.customerDetails || {}),
// 		},

// 		loadDetails: {
// 			...initial.loadDetails,
// 			...(order?.loadDetails || {}),
// 			ewayBillDetails: {
// 				...initial.loadDetails.ewayBillDetails,
// 				...(order?.loadDetails?.ewayBillDetails || {}),
// 			},
// 		},

// 		pickupDetails: {
// 			...initial.pickupDetails,
// 			...(order?.pickupDetails || {}),
// 		},

// 		deliveryDetails: {
// 			...initial.deliveryDetails,
// 			...(order?.deliveryDetails || {}),
// 		},

// 		routeDetails: {
// 			...initial.routeDetails,
// 			...(order?.routeDetails || {}),
// 		},

// 		vehicleRequirement: {
// 			...initial.vehicleRequirement,
// 			...(order?.vehicleRequirement || {}),
// 		},

// 		freightDetails: {
// 			...initial.freightDetails,
// 			...(order?.freightDetails || {}),
// 		},

// 		brokerDetails: {
// 			...initial.brokerDetails,
// 			...(order?.brokerDetails || {}),
// 		},

// 		riskAndInsurance: {
// 			...initial.riskAndInsurance,
// 			...(order?.riskAndInsurance || {}),
// 		},

// 		trackingPreferences: {
// 			...initial.trackingPreferences,
// 			...(order?.trackingPreferences || {}),
// 		},
// 	};
// };


const mergeTransportOrderWithInitial = (order: any) => {
	const initial = createInitialTransportOrder();

	return {
		...initial,
		...order,

		contractDetails: {
			...initial.contractDetails,
			...(order?.contractDetails || {}),
			validityFrom: formatDateForInput(order?.contractDetails?.validityFrom),
			validityTo: formatDateForInput(order?.contractDetails?.validityTo),
		},

		customerDetails: {
			...initial.customerDetails,
			...(order?.customerDetails || {}),
		},

		loadDetails: {
			...initial.loadDetails,
			...(order?.loadDetails || {}),
			ewayBillDetails: {
				...initial.loadDetails.ewayBillDetails,
				...(order?.loadDetails?.ewayBillDetails || {}),
				ewayBillDate: formatDateForInput(
					order?.loadDetails?.ewayBillDetails?.ewayBillDate
				),
			},
		},

		pickupDetails: {
			...initial.pickupDetails,
			...(order?.pickupDetails || {}),
			pickupDateTime: formatDateTimeForInput(
				order?.pickupDetails?.pickupDateTime
			),
		},

		deliveryDetails: {
			...initial.deliveryDetails,
			...(order?.deliveryDetails || {}),
			expectedDeliveryDateTime: formatDateTimeForInput(
				order?.deliveryDetails?.expectedDeliveryDateTime
			),
		},

		routeDetails: {
			...initial.routeDetails,
			...(order?.routeDetails || {}),
		},

		vehicleRequirement: {
			...initial.vehicleRequirement,
			...(order?.vehicleRequirement || {}),
		},

		freightDetails: {
			...initial.freightDetails,
			...(order?.freightDetails || {}),
		},

		brokerDetails: {
			...initial.brokerDetails,
			...(order?.brokerDetails || {}),
		},

		riskAndInsurance: {
			...initial.riskAndInsurance,
			...(order?.riskAndInsurance || {}),
		},

		trackingPreferences: {
			...initial.trackingPreferences,
			...(order?.trackingPreferences || {}),
		},
	};
};
const getOrderFromResponse = (response: any) => {
	return (
		response?.data?.record ||
		response?.data?.records?.[0] ||
		response?.data?.transportOrder ||
		response?.data ||
		response?.record ||
		response?.transportOrder ||
		response ||
		null
	);
};

const CreateTransportOrder = () => {
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();

	const routeOrderNumber =
		params?.orderNumber ||
		params?.transportOrderNumber ||
		params?.voucherNumber ||
		"";

	const stateOrderNumber =
		location.state?.orderNumber ||
		location.state?.transportOrderNumber ||
		location.state?.voucherNumber ||
		location.state?.orderData?.transportOrderNumber ||
		"";

	const orderNumber = routeOrderNumber || stateOrderNumber;

	const isEditMode =
		location.state?.mode === "edit" ||
		Boolean(orderNumber);

	const [form, setForm] = useState<any>(createInitialTransportOrder());
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [prefillLoading, setPrefillLoading] = useState(false);

	const pageTitle =
		location.state?.title ||
		(isEditMode ? "Edit Transport Order" : "Create Transport Order");

	const pageDescription =
		location.state?.description ||
		(isEditMode
			? "Update transport order details."
			: "Create and manage transport orders for customer goods movement.");

	useEffect(() => {
		if (!isEditMode) return;

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		const fetchOrder = async () => {
			try {
				setPrefillLoading(true);

				const response = await dispatch(
					getTransportOrderByVoucherNumber(orderNumber)
				).unwrap();

				const orderData = getOrderFromResponse(response);

				if (!orderData) {
					toast.warn("Transport order details not found");
					return;
				}

				setForm(mergeTransportOrderWithInitial(orderData));
			} catch (error: any) {
				toast.error(
					error?.message ||
					error?.payload?.message ||
					"Failed to fetch transport order details"
				);
			} finally {
				setPrefillLoading(false);
			}
		};

		fetchOrder();
	}, [dispatch, isEditMode, orderNumber]);

	const update = (section: string, key: string, value: any) => {
		setForm((prev: any) => ({
			...prev,
			[section]: {
				...prev[section],
				[key]: value,
			},
		}));
	};

	const updateNested = (
		section: string,
		nested: string,
		key: string,
		value: any
	) => {
		setForm((prev: any) => ({
			...prev,
			[section]: {
				...prev[section],
				[nested]: {
					...prev[section][nested],
					[key]: value,
				},
			},
		}));
	};

	const balanceAmount = useMemo(
		() =>
			computeFreightBalance(
				form.freightDetails.expectedFreight,
				form.freightDetails.advanceAmount
			),
		[
			form.freightDetails.expectedFreight,
			form.freightDetails.advanceAmount,
		]
	);

	const next = () => {
		if (!validateCurrentStep(step, form)) return;
		setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
	};

	const back = () => {
		setStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSave = async () => {
		try {
			setLoading(true);

			const payload = {
				...form,
				freightDetails: {
					...form.freightDetails,
					balanceAmount,
				},
			};

			if (isEditMode) {
				const finalOrderNumber =
					orderNumber ||
					payload?.transportOrderNumber ||
					payload?.orderNumber ||
					payload?.voucherNumber;

				if (!finalOrderNumber) {
					toast.warn("Transport order number not found");
					return;
				}

				await dispatch(
					updateTransportOrderByVoucherNumber({
						voucherNumber: finalOrderNumber,
						payload,
					})
				).unwrap();

				toast.success("Transport order updated");
				navigate(-1);
				return;
			}

			await dispatch(createTransportOrder(payload)).unwrap();

			toast.success("Transport order created");
			navigate(-1);
		} catch (error: any) {
			toast.error(
				error?.message ||
				`Failed to ${isEditMode ? "update" : "create"} transport order`
			);
		} finally {
			setLoading(false);
		}
	};

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<CustomerStep
						form={form}
						setForm={setForm}
						update={update}
					/>
				);

			case 1:
				return (
					<LoadStep
						form={form}
						update={update}
						updateNested={updateNested}
					/>
				);

			case 2:
				return (
					<PickupStep
						form={form}
						update={update}
					/>
				);

			case 3:
				return (
					<DeliveryStep
						form={form}
						update={update}
						setForm={setForm}
					/>
				);

			case 4:
				return (
					<VehicleStep
						form={form}
						update={update}
					/>
				);

			case 5:
				return (
					<FreightStep
						form={form}
						update={update}
						balanceAmount={balanceAmount}
					/>
				);

			case 6:
				return (
					<RiskStep
						form={form}
						update={update}
					/>
				);

			default:
				return null;
		}
	};

	const buttonLabel =
		step === STEPS.length - 1
			? isEditMode
				? "Update Order"
				: "Save Order"
			: `Next: ${STEPS[step + 1]}`;

	return (
		<div className="flex h-full w-full flex-col bg-background text-foreground">
			<header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-4">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
						title="Go back"
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className="truncate text-lg font-bold text-card-foreground">

							{pageTitle}
						</h1>

						<p className="text-sm text-muted-foreground">
							{pageDescription}
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-auto p-4 sm:p-2">
				<TransportOrderStepper step={step} steps={STEPS} />

				{prefillLoading ? (
					<div className="rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
						Loading transport order details...
					</div>
				) : (
					renderStep()
				)}
			</main>

			<TransportOrderFooter
				step={step}
				totalSteps={STEPS.length}
				loading={loading || prefillLoading}
				buttonLabel={buttonLabel}
				onBack={back}
				onNext={step === STEPS.length - 1 ? handleSave : next}
			/>
		</div>
	);
};

export default CreateTransportOrder;