import {
  Wallet,
  Landmark,
  Boxes,
  BookOpenCheck,
  ArrowLeftRight,
  FilePlus2,
  FileMinus2,
} from "lucide-react";
import TransactionDashboard from "../../../../components/mainPage/TransactionDashboard";
import OpeningBalance from "./openingBalance";
import OpeningStock from "./openingStock";
import JournalVoucher from "./JournalVoucher";
import ContraVoucher from "./ContraVoucher";
import CreditNote from "./CreditNote";
import DebitNote from "./DebitNote";
import ImpBankStatemnt from "./impBankStatemnt";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";

const OpeningBalancesDashboard = () => {
  const dispatch = useDispatch();
  const { configurations } = useSelector((state: any) => state.systemConfiguration);

  const enableLocation = useMemo(() => {
    const locationConfig = configurations?.[0]?.systemConfiguration?.bankStatementConfiguration?.enableBankStatementImport
    return locationConfig === true || locationConfig === "true";
  }, [configurations]);

  useEffect(() => {
    dispatch(
      getAllSystemConfigurations({
        offset: 0,
        limit: 100000,
        status: "",
      }) as any
    );
  }, [])

  const cards: any = [
    {
      title: "Opening Balances",
      description: "Manage account-wise opening balances.",
      component: OpeningBalance,
      icon: <Landmark size={22} />,
      permissionKey: "openingBalance"
    },
    {
      title: "Opening Stocks",
      description: "Manage product-wise opening stock entries.",
      component: OpeningStock,
      icon: <Boxes size={22} />,
      permissionKey: "openingStock"
    },
    {
      title: "Journal Voucher",
      description: "Create and manage journal voucher entries.",
      component: JournalVoucher,
      icon: <BookOpenCheck size={22} />,
      permissionKey: "journalVouchar"
    },
    {
      title: "Contra Voucher",
      description: "Manage cash and bank transfer entries.",
      component: ContraVoucher,
      icon: <ArrowLeftRight size={22} />,
      permissionKey: "contraVoucher"
    },
    {
      title: "Credit Note",
      description: "Create and manage credit note entries.",
      component: CreditNote,
      icon: <FilePlus2 size={22} />,
      permissionKey: "creditNote"
    },
    {
      title: "Debit Note",
      description: "Create and manage debit note entries.",
      component: DebitNote,
      icon: <FileMinus2 size={22} />,
      permissionKey: "debitNotes"
    },
    ...(enableLocation ? [{
      title: "Import Bank Statement",
      description: "Attach bank statement and fetch data",
      component: ImpBankStatemnt,
      icon: <FileMinus2 size={22} />,
      permissionKey: "Pass"
    }] : [])
  ];

  return (
    <TransactionDashboard
      title="Opening Balances / Stocks"
      description="Manage opening balances, opening stocks and accounting vouchers."
      icon={<Wallet size={24} />}
      cards={cards}
    />
  );
};

export default OpeningBalancesDashboard;