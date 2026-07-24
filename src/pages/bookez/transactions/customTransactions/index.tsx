import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    PackageSearch,
    ShieldCheck,
} from "lucide-react";

import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import { getAllTransactionModules } from "../../../../redux/slices/professionalSlice/transactionConfiguration/transactionModuleSlice";

const CustomTransactionDashboard = () => {
    const dispatch = useDispatch<any>();

    const transactionModuleState = useSelector(
        (state: any) => state.transactionModule
    );

   
    const transactionModules =
        transactionModuleState?.items ||
        transactionModuleState?.data?.items ||
        [];

    useEffect(() => {
        dispatch(
            getAllTransactionModules({
                offset: 0,
                limit: 50,
                status: "active",
            })
        );
    }, [dispatch]);

    // console.log("Transaction modules:", transactionModules);

    const cards = useMemo(() => {
        return transactionModules.map((item: any) => ({
            title: item.moduleName || "Custom Transaction",
            description:item.description ||`Manage ${item.moduleName || "custom transaction"}.`,
            icon: <ShieldCheck size={22} />,
            path: `/professional/transaction/custom/${item.moduleCode}`,
            permissionKey: "Pass"
        }));
    }, [transactionModules]);

    return (
        <TransactionDashboard
            title="Custom Transaction Workflow"
            description="Access and manage the custom transaction workflows configured for your business."
            icon={<PackageSearch size={24} />}
            cards={cards}
        />
    );
};

export default CustomTransactionDashboard;