import { toast } from "react-toastify";

export const validateCurrentStep = (step: number, form: any) => {
	if (step === 0) {
		if (form.orderType === "contract" && !form.contractDetails.contractNumber) {
			toast.warn("Contract required");
			return false;
		}

		if (!form.customerDetails.customerName) {
			toast.warn("Customer name required");
			return false;
		}

		if (!form.customerDetails.mobileNumber) {
			toast.warn("Mobile number required");
			return false;
		}
	}

	if (step === 1) {
		if (!form.loadDetails.loadType) {
			toast.warn("Load type required");
			return false;
		}

		if (!form.loadDetails.materialName) {
			toast.warn("Material name required");
			return false;
		}
	}

	if (step === 2) {
		if (!form.pickupDetails.pickupStateName) {
			toast.warn("Pickup state required");
			return false;
		}

		if (!form.pickupDetails.pickupCityName) {
			toast.warn("Pickup city required");
			return false;
		}
	}

	if (step === 3) {
		if (!form.deliveryDetails.deliveryStateName) {
			toast.warn("Delivery state required");
			return false;
		}

		if (!form.deliveryDetails.deliveryCityName) {
			toast.warn("Delivery city required");
			return false;
		}
	}

	return true;
};