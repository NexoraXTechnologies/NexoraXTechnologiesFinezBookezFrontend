// src/components/common/EnquiryViewModal.jsx
import React from "react";
import { X } from "lucide-react";

const EnquiryViewModal = ({ open, onClose, enquiry, extraTop, extraBottom }) => {
  if (!open) return null;

  const loading = !enquiry;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
      <div className="bg-white w-[600px] rounded-lg shadow-lg border p-5 relative max-w-[95vw]">
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4 border-b pb-2">
          Enquiry Details
        </h2>

        {/* ----- injection point 1 ----- */}
        {extraTop && <div className="mb-4">{extraTop}</div>}

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {/* Enquiry Number */}
            <div>
              <p className="text-gray-500 font-medium">Enquiry #</p>
              <p className="text-gray-800">{enquiry.enquiryNumber}</p>
            </div>

            {/* Status */}
            <div>
              <p className="text-gray-500 font-medium">Status</p>
              <p
                className={`inline-block text-xs px-2 py-1 rounded capitalize ${
                  enquiry.status === "open"
                    ? "bg-red-100 text-red-700"
                    : enquiry.status === "inprogress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {enquiry.status}
              </p>
            </div>

            {/* Name */}
            <div>
              <p className="text-gray-500 font-medium">Name</p>
              <p className="text-gray-800">{enquiry.name}</p>
            </div>

            {/* Email */}
            <div>
              <p className="text-gray-500 font-medium">Email</p>
              <p className="text-gray-800">{enquiry.email}</p>
            </div>

            {/* Contact Number */}
            <div>
              <p className="text-gray-500 font-medium">Contact Number</p>
              <p className="text-gray-800">{enquiry.contactNumber}</p>
            </div>

            {/* Assigned To */}
            <div>
              <p className="text-gray-500 font-medium">Assigned To</p>
              <p className="text-gray-800">{enquiry.assignedTo || "NA"}</p>
            </div>

            {/* Assigned On */}
            <div>
              <p className="text-gray-500 font-medium">Assigned On</p>
              <p className="text-gray-800">
                {enquiry.assignedOn
                  ? new Date(enquiry.assignedOn).toLocaleString()
                  : "NA"}
              </p>
            </div>

            {/* Created At */}
            <div>
              <p className="text-gray-500 font-medium">Created At</p>
              <p className="text-gray-800">
                {new Date(enquiry.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Updated At */}
            <div>
              <p className="text-gray-500 font-medium">Updated At</p>
              <p className="text-gray-800">
                {new Date(enquiry.updatedAt).toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <p className="text-gray-500 font-medium">Description</p>
              <p className="text-gray-800 whitespace-pre-line">
                {enquiry.description}
              </p>
            </div>
          </div>
        )}

        {/* ----- injection point 2 ----- */}
        {extraBottom && <div className="mt-4">{extraBottom}</div>}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryViewModal;