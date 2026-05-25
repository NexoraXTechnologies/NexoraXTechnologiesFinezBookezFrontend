// src/components/common/TicketViewModal.jsx
import React, { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
const TicketViewModal = ({ open, onClose, ticket, extraTop, extraBottom }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!open) return null;

  const loading = !ticket;

  return (
    <>
      {/* ------------ MAIN TICKET MODAL ------------ */}
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
        <div className="bg-white w-[600px] rounded-lg shadow-xl border p-6 relative animate-fadeIn">
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <X size={22} />
          </button>

          <h2 className="text-xl font-semibold mb-4 border-b pb-3">
            Ticket Details
          </h2>

          {/* ----- injection point 1 ----- */}
          {extraTop && <div className="mb-4">{extraTop}</div>}

          {loading ? (
            <div className="text-center py-6 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {/* Ticket Number */}
              <div>
                <p className="text-gray-500 font-medium">Ticket #</p>
                <p className="text-gray-900">{ticket.ticketNumber}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-gray-500 font-medium">Status</p>
                <p
                  className={`inline-block text-xs px-2 py-1 rounded capitalize ${
                    ticket.status === "open"
                      ? "bg-red-100 text-red-700"
                      : ticket.status === "inprogress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {ticket.status}
                </p>
              </div>

              {/* User Name */}
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">User Name</p>
                <p className="text-gray-900">
                  {ticket.userContext?.userName || "NA"}
                </p>
              </div>

              {/* Title */}
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Title</p>
                <p className="text-gray-900">{ticket.title}</p>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Description</p>
                <p className="text-gray-900 whitespace-pre-line">
                  {ticket.description}
                </p>
              </div>

              {/* Remark */}
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Remark</p>
                <p className="text-gray-900">{ticket.remark || "NA"}</p>
              </div>

              {/* App Version */}
              <div>
                <p className="text-gray-500 font-medium">App Version</p>
                <p className="text-gray-900">{ticket.appversion || "NA"}</p>
              </div>

              {/* OS Version */}
              <div>
                <p className="text-gray-500 font-medium">OS Version</p>
                <p className="text-gray-900">{ticket.osversion || "NA"}</p>
              </div>

              {/* Created On */}
              <div>
                <p className="text-gray-500 font-medium">Created On</p>
                <p className="text-gray-900">
                  {new Date(ticket.createdOn).toLocaleString()}
                </p>
              </div>

              {/* Modified On */}
              <div>
                <p className="text-gray-500 font-medium">Modified On</p>
                <p className="text-gray-900">
                  {new Date(ticket.modifiedOn).toLocaleString()}
                </p>
              </div>

              {/* Screenshot Preview Button */}
              {ticket.screenshot && (
                <div className="col-span-2 mt-2">
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border text-gray-700"
                  >
                    <ImageIcon size={16} />
                    Preview Screenshot
                  </button>
                </div>
              )}
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

      {/* ------------ IMAGE PREVIEW MODAL (ZOOM ENABLED) ------------ */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-white rounded-lg p-4 relative max-w-3xl shadow-xl">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X size={22} />
            </button>

            <Zoom>
              <img
                src={ticket.screenshot}
                alt="Ticket Screenshot"
                className="max-h-[80vh] object-contain rounded cursor-zoom-in"
              />
            </Zoom>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketViewModal;
