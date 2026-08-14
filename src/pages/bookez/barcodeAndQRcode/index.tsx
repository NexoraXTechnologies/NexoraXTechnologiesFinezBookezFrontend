
import { useMemo } from "react";
import { BrickWallShield, Wallet } from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import AssignBarcodeQrTemplate from "./BarcodeQrTemplate";
import AssignBarcodeQrCode from "./AssignBarcodeQrCode";
import BarcodeQrLabelPrint from "./BarcodeQrLabelPrint";

const BarCodeAndQrCode = () => {

    const masterCards: any[] = useMemo(() => {
        const defaultCards: any[] = [
            {
                title: "BarCode/QR Code Template",
                description: "Manage customers, vendors, cash, bank and ledgers.",
                icon: <Wallet size={22} />,
                component: AssignBarcodeQrTemplate,
                permissionKey: "accountMaster"
            },
            {
                title: "Assign BarCode/QR Code",
                description: "Manage customers, vendors, cash, bank and ledgers.",
                icon: <Wallet size={22} />,
                component: AssignBarcodeQrCode,
                permissionKey: "accountMaster"
            },
            {
                title: "BarCode/QR Code Print",
                description: "Manage customers, vendors, cash, bank and ledgers.",
                icon: <Wallet size={22} />,
                component: BarcodeQrLabelPrint,
                permissionKey: "accountMaster"
            }
        ];

        return [...defaultCards];
    }, []);

    return (
        <TransactionDashboard
            title="BarCode And QR Code"
            description="Generate BarCode/QR Code and assign to product"
            icon={<BrickWallShield size={24} />}
            cards={masterCards}
        />
    );
};

export default BarCodeAndQrCode;