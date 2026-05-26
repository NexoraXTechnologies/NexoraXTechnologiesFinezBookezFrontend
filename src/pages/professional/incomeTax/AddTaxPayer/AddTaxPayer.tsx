import React, { useEffect, useState } from "react";
import { RefreshCcw, Edit, Eye, Plus, ArrowRightCircle } from "lucide-react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  getAllTaxPayers,
  getTaxPayerDetails,
  updateTaxpayerStatus,
  getInactiveTaxPayers,
} from "../../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import AddMultipleTaxpayerModal from "./AddMultipleTaxpayerModal";
import ViewTaxpayerModal from "./ViewTaxpayerModal";
import AddNewTaxpayerModal from "./AddNewTaxpayerModal";
import AddExistingTaxpayerModal from "./AddExistingTaxpayerModal";
import { mapPrefillToTaxpayerForm } from './HelperForPrefillMaper';
const AddTaxPayer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { taxpayers, pagination, loading } = useSelector((s) => s.taxpayer);

  // pagination controls
  const [localLimit, setLocalLimit] = useState(10);
  const [localOffset, setLocalOffset] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
    const [prefillForAdd, setPrefillForAdd] = useState(null);
    const [prefillPassword, setPrefillPassword] = useState('');

  // modal for add taxpayer
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  /* =========================================
      DEBOUNCE SEARCH
  ========================================== */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (showInactive) {
      dispatch(
        getInactiveTaxPayers({
          search: debouncedSearch,
          page,
          limit,
        })
      );
    } else {
      dispatch(
        getAllTaxPayers({
          search: debouncedSearch,
          page,
          limit,
        })
      );
    }
  }, [debouncedSearch, page, limit, showInactive]);

  /* =========================================
      REFRESH
  ========================================== */
  const handleRefresh = async () => {
    if (showInactive) {
      await dispatch(
        getInactiveTaxPayers({
          search: debouncedSearch,
          page,
          limit,
        })
      );
    } else {
      await dispatch(
        getAllTaxPayers({
          search: debouncedSearch,
          page,
          limit,
        })
      );
    }
    toast.success("Taxpayer list refreshed");
  };

  /* =========================================
      ACTION: VIEW TAXPAYER
  ========================================== */
  const handleView = (pan) => {
    dispatch(getTaxPayerDetails(pan))
      .unwrap()
      .then(() => {
        setShowViewModal(true);
      })
      .catch(() => toast.error("Failed to load taxpayer details"));
  };

  /* =========================================
      ACTION: EDIT TAXPAYER
  ========================================== */
  const handleEdit = (taxpayer) => {
    toast.info("Loading taxpayer...");

    dispatch(getTaxPayerDetails(taxpayer.pan))
      .unwrap()
      .then(() => {
        setShowEditModal(true); // open edit modal
      })
      .catch(() => toast.error("Failed to load taxpayer details"));
  };

  const handleToggleStatus = async (taxpayer) => {
    const currentStatus = taxpayer.status || "active";
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      await dispatch(
        updateTaxpayerStatus({
          pan: taxpayer.pan,
          status: newStatus,
        })
      ).unwrap();

      toast.success(
        `Tax Payer ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`
      );

      // 🔥 Refresh correct list (active OR inactive)
      if (showInactive) {
        dispatch(
          getInactiveTaxPayers({
            search: debouncedSearch,
            page,
            limit,
          })
        );
      } else {
        dispatch(
          getAllTaxPayers({
            search: debouncedSearch,
            page,
            limit,
          })
        );
      }
    } catch (error) {
      toast.error(error?.message || "Failed to update Tax Payer status");
    }
  };

  /* =========================================
      PAGINATION VALUES
  ========================================== */
  const startIndex =
    pagination.totalDocs > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;

  const endIndex =
    pagination.totalDocs > 0
      ? Math.min(pagination.page * pagination.limit, pagination.totalDocs)
      : 0;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div id="taxpayer-total-box" className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md">
          <span className="text-xs text-gray-600">Total Taxpayers:</span>
          <span className="text-sm font-semibold text-blue-700">{pagination?.totalDocs ?? 0}</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Mobile search */}
          <button
            id="taxpayer-toggle-inactive"
            onClick={() => {
              setShowInactive((prev) => !prev);
              setPage(1); // reset pagination
            }}
            className={`px-3 h-9 rounded-md border ${showInactive ? 'bg-red-200 border-red-400 text-red-700' : 'bg-green-200 border-green-400 text-green-700'}`}>
            {showInactive ? 'Show Active' : 'Show Inactive'}
          </button>
          <input id="taxpayer-search-input" placeholder="Search by mobile email pan." className="border px-3 py-2 h-9 rounded-md text-sm w-60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

          {/* Refresh */}
          <button id="taxpayer-refresh-button" onClick={handleRefresh} className="border px-3 h-9 rounded-md hover:bg-gray-100 flex items-center">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Add Taxpayer Button */}
          <button id="taxpayer-add-button" onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-3 h-9 rounded-md flex items-center gap-1 hover:bg-blue-700">
            <Plus size={16} /> Add Taxpayer
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="flex-1 overflow-x-auto w-full">
        <div id="taxpayer-table" className="max-h-[78vh] overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left w-[130px]">PAN</th>
                <th className="px-3 py-2 text-left w-[130px]">Mobile</th>
                <th className="px-3 py-2 text-left w-[200px]">Email</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">created By </th>
                <th className="px-3 py-2 text-left">Modified By</th>
                <th className="px-3 py-2 text-center w-[100px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : taxpayers?.length ? (
                taxpayers?.map((t) => (
                  <tr key={t._id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{t.pan}</td>
                    <td className="px-3 py-2">{t.mobileNumber}</td>
                    <td className="px-3 py-2">{t.emailId}</td>

                    <td className="px-3 py-2">
                      {t?.payload?.PersonalDetails?.firstName} {t?.payload?.PersonalDetails?.middleName} {t?.payload?.PersonalDetails?.lastName}
                    </td>
                    <td className="px-3 py-2">{t.createdBy}</td>
                    <td className="px-3 py-2">{t?.modifiedBy}</td>

                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center items-center gap-3 mr-5">
                        {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer taxpayer-status-toggle" title={t.status !== 'inactive' ? 'Inactive TaxPayer' : 'Active TaxPayer'}>
                          <input type="checkbox" className="sr-only peer" checked={t.status !== 'inactive'} onChange={() => handleToggleStatus(t)} />

                          <div
                            className="
                                  w-7 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500
                                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                  after:bg-white after:border-gray-300 after:border after:rounded-full 
                                  after:h-3 after:w-3 after:transition-all 
                                  peer-checked:after:translate-x-3 peer-checked:after:border-white
                                "></div>
                        </label>

                        {/* VIEW */}
                        <button className="text-blue-600 hover:text-blue-800 taxpayer-view-btn" title="View  details" onClick={() => handleView(t.pan)}>
                          <Eye size={16} />
                        </button>

                        {/* EDIT */}
                        <button className="text-blue-600 hover:text-blue-800 taxpayer-edit-btn" title="Edit" onClick={() => handleEdit(t)}>
                          <Edit size={16} />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-800 taxpayer-redirect-btn"
                          title="File ITR"
                          onClick={() =>
                            navigate('/professional/incometax/fileitr', {
                              state: {
                                taxpayer: t,
                              },
                            })
                          }>
                          <ArrowRightCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                    No taxpayers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      {pagination?.totalDocs > 0 && (
        <div id="taxpayer-pagination" className="flex justify-between items-center mt-4 text-sm flex-wrap gap-2">
          {/* Limit */}
          <div className="flex items-center gap-2">
            <label>Rows:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border px-2 py-1 rounded">
              {[10, 20, 50, 100].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Page Summary */}
          <div>
            Showing{' '}
            <strong>
              {startIndex}–{endIndex}
            </strong>{' '}
            of <strong>{pagination.totalDocs}</strong> | Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={pagination?.page === 1} className="border px-3 py-1 rounded disabled:opacity-40">
              First
            </button>

            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination?.hasPrevPage} className="border px-3 py-1 rounded disabled:opacity-40">
              Prev
            </button>

            <button onClick={() => setPage((p) => Math.min(p + 1, pagination?.totalPages))} disabled={!pagination?.hasNextPage} className="border px-3 py-1 rounded disabled:opacity-40">
              Next
            </button>

            <button onClick={() => setPage(pagination?.totalPages)} disabled={pagination?.page === pagination?.totalPages} className="border px-3 py-1 rounded disabled:opacity-40">
              Last
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD MENU MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] shadow-lg relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-3 text-gray-600 text-xl">
              ×
            </button>

            <h2 className="text-lg font-semibold mb-4">Add Taxpayer</h2>

            <div className="flex flex-col gap-4">
              {/* Button 1 */}
              <button
                className="border-2 border-blue-600 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-50"
                onClick={() => {
                  setShowAddModal(false);
                  setShowMultipleModal(true);
                }}>
                Add Multiple Taxpayer
              </button>

              {/* Button 2 */}
              <button
                className="border-2 border-green-600 text-green-700 py-3 rounded-lg font-medium hover:bg-green-50"
                onClick={() => {
                  setShowAddModal(false);
                  setShowNewModal(true);
                }}>
                Add New Taxpayer
              </button>

              {/* Button 3 */}

              <button
                className="border-2 border-purple-600 text-purple-700 py-3 rounded-lg font-medium hover:bg-purple-50"
                onClick={() => {
                  setShowAddModal(false);
                  setShowExistingModal(true);
                }}>
                Add Existing Taxpayer
              </button>
            </div>
          </div>
        </div>
      )}
      {showMultipleModal && <AddMultipleTaxpayerModal onClose={() => setShowMultipleModal(false)} />}
      {showViewModal && <ViewTaxpayerModal onClose={() => setShowViewModal(false)} />}
      {showNewModal && (
        <AddNewTaxpayerModal
          mode="add"
          onClose={() => {
            setShowNewModal(false);

            // clear after modal closes
            setTimeout(() => setPrefillForAdd(null), 200);
          }}
          initialForm={prefillForAdd}
        />
      )}
      {showEditModal && <AddNewTaxpayerModal mode="edit" onClose={() => setShowEditModal(false)} />}
      {showExistingModal && (
        <AddExistingTaxpayerModal
          onClose={() => setShowExistingModal(false)}
          onSave={({ password, prefillRes }) => {
            setShowExistingModal(false);

            const mapped = mapPrefillToTaxpayerForm(prefillRes, password);

            setPrefillForAdd(mapped);

            // 🔥 CRITICAL: open modal in next tick
            setTimeout(() => {
              setShowNewModal(true);
            }, 0);
          }}
        />
      )}
    </div>
  );
};

export default AddTaxPayer;
