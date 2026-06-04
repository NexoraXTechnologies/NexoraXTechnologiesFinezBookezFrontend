import { Plus } from "lucide-react";

import Modal from "../../../../../components/modal";
import { SelectInput, TextInput } from "../../../../../components/inputs";
import { ColumnWiseTable } from "../../../../../components/DataTable";

/* ===================================================
   SALES ORDER FORM MODAL
=================================================== */

type SalesOrderFormModalProps = {
  showModal: boolean;
  setShowModal: (value: boolean) => void;

  editingRecord: any;
  createLoading?: boolean;
  updateLoading?: boolean;

  form: any;
  errors: any;

  customerOptions?: any[];
  productTableFields?: any[];

  grossAmount?: number;
  discountAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  netAmount?: number;

  handleSubmit?: () => void;
  handleMainChange?: (key: string, value: any) => void;
  handleCustomerChange?: (customerCode: string) => void;

  openAddProductModal: () => void;
  handleEditProduct?: (item: any, index: number) => void;
  handleDeleteProduct?: (index: number) => void;
};

const fmtMoney = (value: any) => Number(value || 0).toFixed(2);

const SalesOrderFormModel = ({
  showModal,
  setShowModal,

  editingRecord,
  createLoading = false,
  updateLoading = false,

  form,
  errors,

  customerOptions = [],
  productTableFields = [],

  grossAmount = 0,
  discountAmount = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  igstAmount = 0,
  netAmount = 0,

  handleSubmit = () => { },
  handleMainChange = () => { },
  handleCustomerChange = () => { },

  openAddProductModal,
  handleEditProduct = () => { },
  handleDeleteProduct = () => { },
}: SalesOrderFormModalProps) => {
  return (
    // @ts-ignore
    <Modal
      show={showModal}
      setShow={setShowModal}
      handleSubmit={handleSubmit}
      loader={editingRecord ? updateLoading : createLoading}
      state={Boolean(editingRecord)}
      title={editingRecord ? "Sales Order" : "Sales Order"}
      body={
        <div className="col-span-2 w-full space-y-5">
          {/* ================= BASIC DETAILS CARD ================= */}
          <div className="w-full rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TextInput
                label="Voucher no."
                value={form?.voucherNumber || ""}
                placeholder="Voucher no."
                disabled
                error={errors?.voucherNumber}
              />

              <TextInput
                label="Date"
                mandatory
                type="date"
                value={form?.voucherDate || ""}
                placeholder="Date"
                error={errors?.voucherDate}
                onChange={(e: any) =>
                  handleMainChange("voucherDate", e.target.value)
                }
              />

              <SelectInput
                label="Status"
                value={form?.status || "open"}
                placeholder="Status"
                disabled
                error={errors?.status}
                onChange={(e: any) =>
                  handleMainChange("status", e.target.value)
                }
                options={[
                  { label: "Open", value: "open" },
                  { label: "Close", value: "close" },
                ]}
              />

              <div className="md:col-span-3">
                <SelectInput
                  label="Customer"
                  mandatory
                  value={form?.customerCode || ""}
                  placeholder="Select Customer"
                  error={errors?.customerCode}
                  onChange={(e: any) => {
                    const value = e?.target?.value ?? e?.value ?? e;
                    handleCustomerChange(value);
                  }}
                  options={[
                    { label: "Select Customer", value: "" },
                    ...customerOptions,
                  ]}
                />
              </div>

              <div className="md:col-span-3">
                <TextInput
                  label="Remarks"
                  value={form?.remarks || ""}
                  placeholder="Remarks"
                  error={errors?.remarks}
                  onChange={(e: any) =>
                    handleMainChange("remarks", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* ================= PRODUCTS CARD ================= */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">
                Products
              </h3>

              <button
                type="button"
                onClick={openAddProductModal}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Products
              </button>
            </div>

            {errors?.products && (
              <p className="mb-2 text-sm text-red-500">
                {errors.products}
              </p>
            )}

            <ColumnWiseTable
              data={form?.products || []}
              fields={productTableFields}
              emptyMessage="No products added"
              onEdit={(item: any, index: number) =>
                handleEditProduct(item, index)
              }
              onDelete={(_: any, index: number) =>
                handleDeleteProduct(index)
              }
            />
          </div>

          {/* ================= TOTAL SUMMARY CARD ================= */}
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">
                  Gross Total:
                </span>
                <span className="text-base font-bold text-slate-900">
                  ₹{fmtMoney(grossAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">
                  Discount Total:
                </span>
                <span className="text-base font-bold text-slate-900">
                  ₹{fmtMoney(discountAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">
                  CGST Total:
                </span>
                <span className="text-base font-bold text-slate-900">
                  ₹{fmtMoney(cgstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">
                  SGST Total:
                </span>
                <span className="text-base font-bold text-slate-900">
                  ₹{fmtMoney(sgstAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700">
                  IGST Total:
                </span>
                <span className="text-base font-bold text-slate-900">
                  ₹{fmtMoney(igstAmount)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">
                    Net Amount:
                  </span>
                  <span className="text-lg font-extrabold text-slate-950">
                    ₹{fmtMoney(netAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default SalesOrderFormModel;