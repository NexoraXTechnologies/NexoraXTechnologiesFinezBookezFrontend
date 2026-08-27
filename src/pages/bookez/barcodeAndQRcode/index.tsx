
import { useMemo } from "react";
import { LayoutTemplate, Printer, ScanBarcode, ScanLine } from "lucide-react";
import TransactionDashboard from "../../../components/mainPage/TransactionDashboard";
import AssignBarcodeQrTemplate from "./BarcodeQrTemplate";
import AssignBarcodeQrCode from "./AssignBarcodeQrCode";
import BarcodeQrLabelPrint from "./BarcodeQrLabelPrint";

const BarCodeAndQrCode = () => {

    const masterCards: any[] = useMemo(() => {
        const defaultCards: any[] = [
            {
                title: "Barcode / QR Code Template",
                description: "Create and manage Barcode/QR Code label templates, formats and print settings.",
                icon: <LayoutTemplate size={22} />,
                component: AssignBarcodeQrTemplate,
                permissionKey: "accountMaster"
            },
            {
                title: "Assign Barcode / QR Code",
                description: "Generate and assign Barcode/QR Codes to products using configured templates.",
                icon: <ScanBarcode size={22} />,
                component: AssignBarcodeQrCode,
                permissionKey: "accountMaster"
            },
            {
                title: "Print Barcode / QR Code",
                description: "Preview and print assigned Barcode/QR Code labels for products.",
                icon: <Printer size={22} />,
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
            icon={<ScanLine size={24} />}
            cards={masterCards}
        />
    );
};

export default BarCodeAndQrCode;