import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    BrickWallShield,
    Wallet,
    
} from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import { getAllSystemConfigurations } from "../../../redux/slices/systemConf";
import ProfitAndLoss from "./profitAndLoss";

const AccountStatement = () => {
    const dispatch = useDispatch();

    const { customMasterModules = [], loading } = useSelector(
        (state: any) => state.customMasterModule
    );

    const { configurations = [] } = useSelector(
        (state: any) => state.systemConfiguration
    );

    const kitEanble =
        configurations?.[0]?.systemConfiguration?.kitConfiguration?.enableKit == "true" ||
        configurations?.[0]?.systemConfiguration?.kitConfiguration?.enableKit == true;



    useEffect(() => {
        dispatch(getAllSystemConfigurations({}) as any);
    }, [dispatch]);

    const masterCards: any[] = useMemo(() => {
        const defaultCards: any[] = [
            {
                title: "Profit & Loss",
                description: "Manage customers, vendors, cash, bank and ledgers.",
                icon: <Wallet size={22} />,
                component: ProfitAndLoss,
                permissionKey: "accountMaster",
            },
            // {
            //     title: "Balance Sheet",
            //     description: "Manage customers, vendors, cash, bank and ledgers.",
            //     icon: <Wallet size={22} />,
            //     component: BalanceSheet,
            //     permissionKey: "accountMaster",
            // }
        ];

        return [...defaultCards];
    }, [customMasterModules, configurations, kitEanble]);

    return (
        <TransactionDashboard
            title="Account Statement"
            description="Manage all BookEZ master data."
            icon={<BrickWallShield size={24} />}
            cards={masterCards}
            loading={loading}
        />
    );
};

export default AccountStatement;