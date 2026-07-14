import { User } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";

import { computeRemainingTrips } from "../transportOrderCalculations";
import { orderTypeOptions } from "../transportOrderOptions";


const CustomerStep = ({ form, setForm, update, accounts = [], transportContract = [], onContractSelect }: any) => {
	
	const isContractOrder = form.orderType === "contract";

	
const contractOptions = [
		{ label: "Select Contract", value: "", contractNumber: "" },
		...transportContract
			.filter((item: any) => item?.contractNumber || item?.voucherNumber)
			.map((item: any) => ({
				label: `${item?.contractNumber || item?.voucherNumber}${item?.customer?.customerName ? ` - ${item.customer.customerName}` : ""}`,
				value: item?.contractNumber || item?.voucherNumber,
				raw: item, // keep the full raw record so the parent can use it
			})),
	];

	const handleContractSelect = (value: any) => {
		const selected = contractOptions.find((item: any) => String(item?.value) === String(value));

		if (!selected?.raw) {
			// cleared selection — still let the local contractDetails reset happen
			update("contractDetails", "contractNumber", "");
			return;
		}

		onContractSelect?.(selected.raw); // parent now owns filling every section
	};





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

	// const handleContractSelect = (value: any) => {
	// 	const selectedContract = contractOptions.find(
	// 		(item: any) => String(item?.value) === String(value)
	// 	);

	// 	setForm((prev: any) => ({
	// 		...prev,

	// 		contractDetails: {
	// 			...prev.contractDetails,
	// 			contractNumber: selectedContract?.contractNumber || value || "",
	// 			validityFrom: selectedContract?.validityFrom || "",
	// 			validityTo: selectedContract?.validityTo || "",
	// 			totalTrips: selectedContract?.totalTrips || "",
	// 			completedTrips: selectedContract?.completedTrips || 0,
	// 			remainingTrips: selectedContract?.remainingTrips || 0,
	// 		},

	// 		customerDetails: {
	// 			...prev.customerDetails,
	// 			customerCode:
	// 				selectedContract?.customerCode ||
	// 				prev.customerDetails?.customerCode ||
	// 				"",
	// 			customerName:
	// 				selectedContract?.customerName ||
	// 				prev.customerDetails?.customerName ||
	// 				"",
	// 			contactPerson:
	// 				selectedContract?.customerName ||
	// 				prev.customerDetails?.contactPerson ||
	// 				"",
	// 		},
	// 	}));
	// };

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