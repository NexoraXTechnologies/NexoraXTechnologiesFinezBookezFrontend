import { IndianRupee } from "lucide-react";
import { FormSectionCard } from "../../../../../components/SectionCards";
import { renderField } from "../../../../../components/inputs";
import {
	paymentModeOptions,
	paymentTypeOptions,
} from "../transportOrderOptions";

const FreightStep = ({ form, update, balanceAmount }: any) => {
	const updateFreightField = (key: string, value: any) => {
		update("freightDetails", key, value);
	};

	const handleInputChange = (key: string) => (e: any) => {
		const value = e?.target?.value ?? "";

		if (key.startsWith("freightDetails.")) {
			const freightKey = key.replace("freightDetails.", "");
			updateFreightField(freightKey, value);
		}
	};

	const handleSelectChange = (key: string) => (e: any) => {
		handleInputChange(key)(e);
	};

	const updateField = (key: string, value: any) => {
		if (key.startsWith("freightDetails.")) {
			const freightKey = key.replace("freightDetails.", "");
			updateFreightField(freightKey, value);
		}
	};

	const fieldForm = {
		"freightDetails.freightPerTon":
			form.freightDetails?.freightPerTon || "",

		"freightDetails.expectedFreight":
			form.freightDetails?.expectedFreight || "",

		"freightDetails.advanceAmount":
			form.freightDetails?.advanceAmount || "",

		"freightDetails.balanceAmount":
			form.freightDetails?.expectedFreight === "" &&
			form.freightDetails?.advanceAmount === ""
				? ""
				: balanceAmount,

		"freightDetails.paymentType":
			form.freightDetails?.paymentType || "",

		"freightDetails.paymentMode":
			form.freightDetails?.paymentMode || "",
	};

	const freightFields = [
	{
		key: "freightDetails.freightPerTon",
		label: "Freight Per Ton",
		type: "number",
		placeholder: "Enter freight per ton",
	},
	{
		key: "freightDetails.expectedFreight",
		label: "Expected Freight",
		type: "number",
		placeholder: "Enter expected freight",
	},
	{
		key: "freightDetails.advanceAmount",
		label: "Advance Amount",
		type: "number",
		placeholder: "Enter advance amount",
	},
	{
		key: "freightDetails.balanceAmount",
		label: "Balance Amount",
		type: "number",
		placeholder: "Auto calculated balance amount",
		disabled: true,
	},
	{
		key: "freightDetails.paymentType",
		label: "Payment Type",
		type: "select",
		options: paymentTypeOptions,
	},
	{
		key: "freightDetails.paymentMode",
		label: "Payment Mode",
		type: "select",
		options: paymentModeOptions,
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
		<FormSectionCard title="Freight Details" icon={<IndianRupee size={18} />}>
			{renderFields(freightFields)}
		</FormSectionCard>
	);
};

export default FreightStep;