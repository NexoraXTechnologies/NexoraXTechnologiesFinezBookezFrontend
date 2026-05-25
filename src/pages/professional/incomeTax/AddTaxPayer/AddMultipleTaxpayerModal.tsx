import React, { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Download, Upload } from "lucide-react";
import { useDispatch } from "react-redux";

import { addTaxpayer } from "../../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";

const TEMPLATE_URL =
  "https://drive.google.com/uc?export=download&id=175DSkSzuY2TczUsKCglLuknOonPjT5Go";

const REQUIRED_HEADERS = [
  "firstName",
  "middleName",
  "lastName *",
  "typeOfTaxPayer *",
  "residentialStatus",
  "dob *",
  "gender *",
  "aadharNumber *",
  "pan *",
  "passportNumber",
  "itlPassword",
  "mobileNumber *",
  "emailId *",
  "address1",
  "address2",
  "address3",
  "city *",
  "pin *",
  "landLine",
  "state *",

  "bank1_accountNumber *",
  "bank1_cnfaccountNumber *",
  "bank1_bankName *",
  "bank1_bankAddress *",
  "bank1_ifscCode *",
  "bank1_accountType *",
  "bank1_accountHolderType *",
  "bank1_nominate *",
  "bank1_isDefaultACC *",

  "bank2_accountNumber",
  "bank2_cnfaccountNumber",
  "bank2_bankName",
  "bank2_bankAddress",
  "bank2_ifscCode",
  "bank2_accountType",
  "bank2_accountHolderType",
  "bank2_nominate",
  "bank2_isDefaultACC",
];

const AddMultipleTaxpayerModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [fileData, setFileData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableHeaders, setTableHeaders] = useState([]);
  const cleanHeader = (header) => {
    return header.replace("*", "").trim();
  };

  const handleDownloadTemplate = () => {
    const a = document.createElement("a");
    a.href = TEMPLATE_URL;
    a.setAttribute("download", "MultipleTaxPayerTemplate.xlsx");
    document.body.appendChild(a);
    a.click();
    a.remove();

    toast.success("Template downloading…");
  };

  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Please upload a valid Excel file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      // Read sheet with header: 1 to get raw rows
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const excelHeaders = raw[0].map((h) => cleanHeader(h));

      // Final headers = Excel headers OR optionally REQUIRED_HEADERS
      // const finalHeaders = excelHeaders;

      // Convert rows to objects, preserving all headers even if empty
      const data = raw.slice(1).map((row) => {
        const obj = {};
        excelHeaders.forEach((h, i) => {
          obj[h] = row[i] !== undefined ? row[i] : "";
        });
        return obj;
      });

      if (!data.length) {
        toast.error("Excel is empty");
        return;
      }

      const headers = Object.keys(data[0]);
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));

      if (missing.length > 0) {
        toast.warn("Some optional headers are missing: " + missing.join(", "));
      }

      setTableHeaders(excelHeaders);
      setFileData(data);
      toast.success("Excel uploaded successfully!");
    };

    reader.readAsBinaryString(file);
  };

  const handleSubmitAll = async () => {
    if (!fileData.length) {
      toast.error("Upload Excel file first");
      return;
    }

    setLoading(true);

    let success = 0;
    let failed = 0;

    for (const row of fileData) {
      const payload = {
        PersonalDetails: {
          firstName: row.firstName || "",
          middleName: row.middleName || "",
          lastName: row.lastName || "",
          typeOfTaxPayer: row.typeOfTaxPayer || "",
          residentialStatus: row.residentialStatus || "",
          dob: row.dob || "",
          gender: row.gender || "",
          aadharNumber: row.aadharNumber || "",
          pan: row.pan || "",
          passportNumber: row.passportNumber || "",
          itlPassword: row.itlPassword || "",
        },
        ContactAddressDetails: {
          mobileNumber: row.mobileNumber || "",
          emailId: row.emailId || "",
          address1: row.address1 || "",
          address2: row.address2 || "",
          address3: row.address3 || "",
          city: row.city || "",
          pin: row.pin || "",
          landLine: row.landLine || "",
          state: row.state || "",
        },
        BankDetails: {
          array: [
            {
              accountNumber: row["bank1_accountNumber"] || "",
              cnfaccountNumber: row["bank1_cnfaccountNumber"] || "",
              bankName: row["bank1_bankName"] || "",
              bankAddress: row["bank1_bankAddress"] || "",
              ifscCode: row["bank1_ifscCode"] || "",
              accountType: row["bank1_accountType"] || "",
              accountHolderType: row["bank1_accountHolderType"] || "",
              nominate: row["bank1_nominate"] || "",
              isDefaultACC: row["bank1_isDefaultACC"] || "",
            },
            ...(row["bank2_accountNumber"]
              ? [
                  {
                    accountNumber: row["bank2_accountNumber"] || "",
                    cnfaccountNumber: row["bank2_cnfaccountNumber"] || "",
                    bankName: row["bank2_bankName"] || "",
                    bankAddress: row["bank2_bankAddress"] || "",
                    ifscCode: row["bank2_ifscCode"] || "",
                    accountType: row["bank2_accountType"] || "",
                    accountHolderType: row["bank2_accountHolderType"] || "",
                    nominate: row["bank2_nominate"] || "",
                    isDefaultACC: row["bank2_isDefaultACC"] || "",
                  },
                ]
              : []),
          ],
        },
      };
      try {
        await dispatch(addTaxpayer(payload)).unwrap();
        success++;
      } catch (err) {
        failed++;

        // 🔥 Show backend error message
        toast.error(err?.message || "Failed to add taxpayer");
      }
    }

    setLoading(false);
    toast.success(`Upload complete. Success: ${success}, Failed: ${failed}`);

    if (failed === 0) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[85vw] max-w-[900px] rounded-lg p-6 shadow-xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-700 text-2xl hover:text-red-500"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Upload Multiple Taxpayers
        </h2>

        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className="w-full border-2 border-blue-600 text-blue-700 py-3 rounded-lg font-medium flex items-center justify-between px-4 hover:bg-blue-50"
        >
          <span>Download Excel Template</span>
          <Download size={18} />
        </button>

        {/* Upload Excel */}
        <div className="mt-4">
          <label className="w-full bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-green-700">
            <Upload size={18} />
            Upload Excel File
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleUploadExcel}
            />
          </label>
        </div>

        {/* TABLE PREVIEW (HORIZONTAL + VERTICAL SCROLL) */}
        {fileData.length > 0 && (
          <div className="mt-6 border rounded shadow-inner overflow-hidden">
            {/* Horizontal Scroll */}
            <div className="overflow-x-auto">
              {/* Vertical Scroll */}
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-max border-collapse text-sm">
                  {/* Header */}
                  <thead className="bg-blue-600 text-white sticky top-0 z-10">
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 font-semibold border-b whitespace-nowrap min-w-[150px] text-left"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Rows */}
                  <tbody>
                    {fileData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}
                      >
                        {tableHeaders.map((header, i) => (
                          <td
                            key={i}
                            className="px-4 py-2 border-b whitespace-nowrap min-w-[150px]"
                          >
                            {row[header] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        {fileData.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitAll}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-md"
            >
              {loading ? "Uploading…" : "Submit All Taxpayers"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMultipleTaxpayerModal;
