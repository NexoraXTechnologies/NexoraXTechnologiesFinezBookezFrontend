import { useEffect, useState } from "react";
import { Edit, Eye, ArrowRightCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
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
import Badge from "../../../../components/badge";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";

const columns = [
	{ key: 'accountCode', title: 'PAN', },
	{ key: 'accountName', title: 'Mobile', },
	{ key: 'accountEmail', title: 'Email', },
	{ key: 'accountEmail', title: 'Name', },
	{ key: 'accountMobile', title: 'Created By', },
	{ key: 'accountMobile', title: 'Modified By', }
];

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
	const [prefillForAdd, setPrefillForAdd] = useState(null);

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
			limit: localLimit,
        })
      );
    } else {
      dispatch(
        getAllTaxPayers({
          search: debouncedSearch,
          page,
			limit: localLimit,
        })
      );
    }
  }, [debouncedSearch, page, localLimit, showInactive]);

  /* =========================================
      REFRESH
  ========================================== */
  const handleRefresh = async () => {
    if (showInactive) {
      await dispatch(
        getInactiveTaxPayers({
          search: debouncedSearch,
          page,
			limit: localLimit,
        })
      );
    } else {
      await dispatch(
        getAllTaxPayers({
          search: debouncedSearch,
          page,
			limit: localLimit,
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
			  limit: localLimit,
          })
        );
      } else {
        dispatch(
          getAllTaxPayers({
            search: debouncedSearch,
            page,
			  limit: localLimit,
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
	  <div className="w-full bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
      {/* ================= HEADER ================= */}
      <div className="flex items-center mb-3">
			  <div id="account-summary" className="flex items-start gap-3">
				  <Badge {...{ count: pagination?.totalDocs ?? 0, text: "Total Taxpayers:", varient: "primary" }} />
        </div>

        <div className="ml-auto flex items-center gap-2">
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
				  <SearchInput {...{ search: searchTerm, setSearch: setSearchTerm }} />
				  <DataREfreshButton {...{ callBackFn: handleRefresh }} />
				  <DataCreateButton {...{ callBackFn: () => setShowAddModal(true), text: "Add Taxpayer" }} />
        </div>
      </div>
		  <DataTable
			  columns={columns}
			  data={taxpayers}
			  loading={loading}
			  emptyMessage="No taxpayers found."
			  actions={(acc) => (
				  <div className="flex items-center gap-2">
					  <label className="relative inline-flex items-center cursor-pointer taxpayer-status-toggle" title={acc.status !== 'inactive' ? 'Inactive TaxPayer' : 'Active TaxPayer'}>
						  <input type="checkbox" className="sr-only peer" checked={acc.status !== 'inactive'} onChange={() => handleToggleStatus(acc)} />

						  <div
							  className="w-7 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px]  after:bg-white after:border-gray-300 after:border after:rounded-full  after:h-3 after:w-3 after:transition-all  peer-checked:after:translate-x-3 peer-checked:after:border-white">
						  </div>
					  </label>

					  {/* VIEW */}
					  <button className="text-blue-600 hover:text-blue-800 taxpayer-view-btn" title="View  details" onClick={() => handleView(acc.pan)}>
						  <Eye size={16} />
					  </button>

					  {/* EDIT */}
					  <button className="text-blue-600 hover:text-blue-800 taxpayer-edit-btn" title="Edit" onClick={() => handleEdit(acc)}>
						  <Edit size={16} />
					  </button>
					  <button
						  className="text-blue-600 hover:text-blue-800 taxpayer-redirect-btn"
						  title="File ITR"
						  onClick={() =>
							  navigate('/professional/incometax/fileitr', {
								  state: {
									  taxpayer: acc,
								  },
							  })
						  }>
						  <ArrowRightCircle size={16} />
					  </button>
				  </div>
			  )}
		  />

		  {pagination.totalDocs > 0 && <Pagination  {...{
			  localLimit, selectCb: (e) => {
				  setLocalLimit(Number(e.target.value));
				  setPage(1);
			  },
			  preDisabled: pagination?.page === 1,
			  nextDisabled: !pagination?.hasNextPage,
			  setLocalOffset: setPage, pagination
		  }} />}

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
