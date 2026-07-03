import { User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";

import { computeRemainingTrips } from "../transportOrderCalculations";
import { orderTypeOptions } from "../transportOrderOptions";
import { getAllTransportContract } from "../../../../../redux/slices/professionalSlice/transportation/transportContractSlice";

const CustomerStep = ({ form, setForm, update }: any) => {
	const dispatch = useDispatch<any>();

	const { accounts = [] } = useSelector((state: any) => state.accountMaster);

	const { transportContract = [] } = useSelector(
		(state: any) => state.transportContract
	);

	const isContractOrder = form.orderType === "contract";

	const contractOptions = [
		{
			label: "Select Contract",
			value: "",
			contractNumber: "",
		},
		...(transportContract || [])
			.filter((item: any) => item?.contractNumber || item?.voucherNumber)
			.map((item: any) => {
				const contractNumber =
					item?.contractNumber || item?.voucherNumber || "";

				const customerCode =
					item?.customer?.customerCode ||
					item?.customerCode ||
					"";

				const customerName =
					item?.customer?.customerName ||
					item?.customerName ||
					"";

				const validityFrom =
					item?.contractPeriod?.startDate ||
					item?.validityFrom ||
					item?.periodStart ||
					"";

				const validityTo =
					item?.contractPeriod?.endDate ||
					item?.validityTo ||
					item?.periodEnd ||
					"";

				const totalTrips =
					item?.tripCommitment?.totalTrips ??
					item?.totalTrips ??
					"";

				const completedTrips =
					item?.tripCommitment?.completedTrips ??
					item?.completedTrips ??
					0;

				const remainingTrips =
					item?.tripCommitment?.balanceTrips ??
					item?.tripCommitment?.remainingTrips ??
					item?.remainingTrips ??
					computeRemainingTrips(totalTrips, completedTrips);

				return {
					label: `${contractNumber}${customerName ? ` - ${customerName}` : ""}`,
					value: contractNumber,
					contractNumber,

					customerCode,
					customerName,

					validityFrom: validityFrom ? String(validityFrom).slice(0, 10) : "",
					validityTo: validityTo ? String(validityTo).slice(0, 10) : "",

					totalTrips,
					completedTrips,
					remainingTrips,

					raw: item,
				};
			}),
	];

	const customerOption = [
		{
			label: "Select Customer",
			value: "",
			accountCode: "",
			accountName: "",
		},
		...(accounts || [])
			.filter((item: any) => item?.accountCode)
			.map((item: any) => ({
				label: item?.accountName || "-",
				value: item?.accountCode || "",
				accountCode: item?.accountCode || "",
				accountName: item?.accountName || "",

				gstNumber:
					item?.gstNumber ||
					item?.gst ||
					item?.accountGSTNumber ||
					"",

				mobileNumber:
					item?.mobileNumber ||
					item?.mobile ||
					item?.accountMobile ||
					item?.accountMobileNumber ||
					"",

				email:
					item?.email ||
					item?.accountEmail ||
					item?.accountEmailId ||
					"",
			})),
	];

	useEffect(() => {
		dispatch(
			getAllAccounts({
				accountType: "customer",
			})
		);

		dispatch(
			getAllTransportContract({
				limit: 500,
				offset: 0,
			})
		);
	}, [dispatch]);

	const handleOrderTypeChange = (value: string) => {
		setForm((prev: any) => ({
			...prev,
			orderType: value,
			contractDetails:
				value === "contract"
					? prev.contractDetails
					: {
							contractNumber: "",
							validityFrom: "",
							validityTo: "",
							totalTrips: "",
							completedTrips: 0,
							remainingTrips: 0,
					  },
		}));
	};

	const handleContractSelect = (value: any) => {
		const selectedContract = contractOptions.find(
			(item: any) => String(item?.value) === String(value)
		);

		setForm((prev: any) => ({
			...prev,

			contractDetails: {
				...prev.contractDetails,
				contractNumber: selectedContract?.contractNumber || value || "",
				validityFrom: selectedContract?.validityFrom || "",
				validityTo: selectedContract?.validityTo || "",
				totalTrips: selectedContract?.totalTrips || "",
				completedTrips: selectedContract?.completedTrips || 0,
				remainingTrips: selectedContract?.remainingTrips || 0,
			},

			customerDetails: {
				...prev.customerDetails,
				customerCode:
					selectedContract?.customerCode ||
					prev.customerDetails?.customerCode ||
					"",
				customerName:
					selectedContract?.customerName ||
					prev.customerDetails?.customerName ||
					"",
				contactPerson:
					selectedContract?.customerName ||
					prev.customerDetails?.contactPerson ||
					"",
			},
		}));
	};

	const handleContractTripsChange = (key: string, value: any) => {
		setForm((prev: any) => {
			const nextContract = {
				...prev.contractDetails,
				[key]: value,
			};

			nextContract.remainingTrips = computeRemainingTrips(
				nextContract.totalTrips,
				nextContract.completedTrips
			);

			return {
				...prev,
				contractDetails: nextContract,
			};
		});
	};

	const updateCustomerField = (key: string, value: any) => {
		if (key === "customerCode") {
			const selectedCustomer = customerOption.find(
				(item: any) => String(item?.value) === String(value)
			);

			setForm((prev: any) => ({
				...prev,
				customerDetails: {
					...prev.customerDetails,

					customerCode:
						selectedCustomer?.accountCode || value || "",

					customerName:
						selectedCustomer?.accountName || "",

					contactPerson:
						selectedCustomer?.accountName || "",

					gstNumber:
						selectedCustomer?.gstNumber ||
						prev.customerDetails?.gstNumber ||
						"",

					mobileNumber:
						selectedCustomer?.mobileNumber ||
						prev.customerDetails?.mobileNumber ||
						"",

					email:
						selectedCustomer?.email ||
						prev.customerDetails?.email ||
						"",
				},
			}));

			return;
		}

		if (key === "customerName") {
			update("customerDetails", "customerName", value);
			update("customerDetails", "contactPerson", value);
			return;
		}

		update("customerDetails", key, value);
	};

	const handleInputChange = (key: string) => (e: any) => {
		const value = e?.target?.value ?? "";

		if (key === "orderType") {
			handleOrderTypeChange(value);
			return;
		}

		if (key === "contractDetails.contractNumber") {
			handleContractSelect(value);
			return;
		}

		if (key.startsWith("contractDetails.")) {
			const contractKey = key.replace("contractDetails.", "");
			handleContractTripsChange(contractKey, value);
			return;
		}

		if (key.startsWith("customerDetails.")) {
			const customerKey = key.replace("customerDetails.", "");
			updateCustomerField(customerKey, value);
		}
	};

	const handleSelectChange = (key: string) => (e: any) => {
		const value = e?.target?.value ?? "";

		if (key === "orderType") {
			handleOrderTypeChange(value);
			return;
		}

		if (key === "contractDetails.contractNumber") {
			handleContractSelect(value);
			return;
		}

		if (key.startsWith("customerDetails.")) {
			const customerKey = key.replace("customerDetails.", "");
			updateCustomerField(customerKey, value);
			return;
		}

		handleInputChange(key)(e);
	};

	const updateField = (key: string, value: any) => {
		if (key === "orderType") {
			handleOrderTypeChange(value);
			return;
		}

		if (key === "contractDetails.contractNumber") {
			handleContractSelect(value);
			return;
		}

		if (key.startsWith("contractDetails.")) {
			const contractKey = key.replace("contractDetails.", "");
			handleContractTripsChange(contractKey, value);
			return;
		}

		if (key.startsWith("customerDetails.")) {
			const customerKey = key.replace("customerDetails.", "");
			updateCustomerField(customerKey, value);
		}
	};

	const fieldForm = {
		orderType: form.orderType,

		"contractDetails.contractNumber":
			form.contractDetails?.contractNumber || "",
		"contractDetails.validityFrom":
			form.contractDetails?.validityFrom || "",
		"contractDetails.validityTo":
			form.contractDetails?.validityTo || "",
		"contractDetails.totalTrips":
			form.contractDetails?.totalTrips || "",
		"contractDetails.completedTrips":
			form.contractDetails?.completedTrips || 0,
		"contractDetails.remainingTrips":
			form.contractDetails?.remainingTrips || 0,

		"customerDetails.customerCode":
			form.customerDetails?.customerCode || "",
		"customerDetails.customerName":
			form.customerDetails?.customerName || "",
		"customerDetails.gstNumber":
			form.customerDetails?.gstNumber || "",
		"customerDetails.contactPerson":
			form.customerDetails?.contactPerson || "",
		"customerDetails.mobileNumber":
			form.customerDetails?.mobileNumber || "",
		"customerDetails.email":
			form.customerDetails?.email || "",
	};

	const orderTypeFields = [
		{
			key: "orderType",
			label: "Order Type",
			type: "select",
			options: orderTypeOptions,
			mandatory: true,
		},
	];

	const contractFields = [
		{
			key: "contractDetails.contractNumber",
			label: "Contract",
			type: "select",
			mandatory: true,
			options: contractOptions,
		},
		{
			key: "contractDetails.validityFrom",
			label: "Validity From",
			type: "date",
			disabled: true,
		},
		{
			key: "contractDetails.validityTo",
			label: "Validity To",
			type: "date",
			disabled: true,
		},
		{
			key: "contractDetails.totalTrips",
			label: "Total Trips",
			type: "number",
			disabled: true,
		},
		{
			key: "contractDetails.completedTrips",
			label: "Completed Trips",
			type: "number",
			disabled: true,
		},
		{
			key: "contractDetails.remainingTrips",
			label: "Remaining Trips",
			type: "number",
			disabled: true,
		},
	];

	const customerFields = [
		{
			key: "customerDetails.customerCode",
			label: "Customer Name",
			type: "select",
			mandatory: true,
			options: customerOption,
			// disabled: isContractOrder && Boolean(form.contractDetails?.contractNumber),
		},
		{
			key: "customerDetails.gstNumber",
			label: "GST Number",
			type: "text",
		},
		{
			key: "customerDetails.contactPerson",
			label: "Contact Person",
			type: "text",
			mandatory: true,
		},
		{
			key: "customerDetails.mobileNumber",
			label: "Mobile Number",
			type: "number",
			mandatory: true,
		},
		{
			key: "customerDetails.email",
			label: "Email",
			type: "email",
		},
	];

	const renderFields = (fields: any[]) =>
		fields.map((field: any) =>
			renderField({
				field,
				form: fieldForm,
				handleInputChange,
				handleSelectChange,
				updateField,
			})
		);

	return (
		<FormSectionCard title="Customer Details" icon={<User size={18} />}>
			{renderFields(orderTypeFields)}

			{isContractOrder && renderFields(contractFields)}

			{renderFields(customerFields)}
		</FormSectionCard>
	);
};

export default CustomerStep;