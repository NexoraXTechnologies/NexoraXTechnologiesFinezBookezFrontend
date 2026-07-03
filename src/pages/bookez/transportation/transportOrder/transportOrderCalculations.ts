import { num } from "../../../../utils/helperFunctions";

export const computeFreightBalance = (
	expectedFreight: any,
	advanceAmount: any
) => {
	return Math.max(num(expectedFreight) - num(advanceAmount), 0);
};

export const computeRemainingTrips = (
	totalTrips: any,
	completedTrips: any
) => {
	return Math.max(num(totalTrips) - num(completedTrips), 0);
};