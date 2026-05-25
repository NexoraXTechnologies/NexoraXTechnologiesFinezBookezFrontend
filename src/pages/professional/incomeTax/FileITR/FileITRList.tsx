import React, { useEffect, useState } from 'react';
import { RefreshCcw, Trash2, Download, Edit, FileArchive } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ConfirmTooltip from '../../../../components/common/ConfirmTooltip';
import { useNavigate } from 'react-router-dom';

// ✅ update this import path to where you placed the slice
import { getAllItrFilingWeb, getItrFilingWebById, deleteItrFilingWeb } from '../../../../redux/slices/professionalSlice/fileITRweb/itrFilingWebMgtSlice';

const FileITRList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ update selector key as per your store
  const { records, loading, pagination, summary } = useSelector((s) => s.itrFilingWebMgt);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  // Filters (same UX as documents)
  const [pan, setPan] = useState('');
  const [debouncedPan, setDebouncedPan] = useState('');

  const [objectKey, setObjectKey] = useState('');
  const [debouncedObjectKey, setDebouncedObjectKey] = useState('');

  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    id: null,
  });

  // ==================================================
  // Load list
  // ==================================================
  useEffect(() => {
    dispatch(
      getAllItrFilingWeb({
        page,
        limit,
        pan: debouncedPan.trim(),
        objectKey: debouncedObjectKey.trim(),
      })
    );
  }, [dispatch, page, limit, debouncedPan, debouncedObjectKey]);

  // ==================================================
  // Debounce filters
  // ==================================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPan(pan);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [pan]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedObjectKey(objectKey);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [objectKey]);

  // ==================================================
  // Refresh
  // ==================================================
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(
        getAllItrFilingWeb({
          page,
          limit,
          pan: debouncedPan.trim(),
          objectKey: debouncedObjectKey.trim(),
        })
      ).unwrap();
      toast.success('ITR list refreshed');
    } catch (err) {
      toast.error(err?.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  // ==================================================
  // Download (placeholder)
  // ==================================================
  const isTrue = (v) => v === true || v === 'true' || v === 1 || v === '1';
  const downloadJsonFile = (fileName, data) => {
    const jsonText = JSON.stringify(data, null, 2); // pretty format
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };
const handleDownload = async (row) => {
  const verifyPay = row?.payload?.sections?.verifyPay;

  const verified = isTrue(verifyPay?.isVerify);
  const feePaid = isTrue(verifyPay?.isPlatformFee);

  if (!verified || !feePaid) {
    toast.error('Please verify before downloading JSON.');
    return;
  }

  const jsonData = verifyPay?.incomeTaxJson;

  if (!jsonData) {
    toast.error('JSON not found for this record.');
    return;
  }

  // pick a good filename (change as you like)
  const fileName = row?.pan || row?.PAN || row?.payload?.PAN || `income-tax-${Date.now()}`;

  downloadJsonFile(fileName, jsonData);
  toast.success('JSON downloaded.');
};
  // ==================================================
  // Edit (fetch single record & navigate)
  // ==================================================

  const handleEdit = (row) => {
    const rowPan = row?.pan || row?.panCard;
    const rowAy = row?.assessmentYear;

    if (!rowPan || !rowAy) {
      toast.error('PAN / Assessment Year missing in row data');
      return;
    }

    navigate(`/professional/incometax/fileitr/edit/${rowPan}/${encodeURIComponent(rowAy)}`);
  };
  // const handleEdit = async (row) => {
  //   // needs PAN + AY route: /get/:pan/:assessmentYear
  //   const rowPan = row?.pan || row?.PAN;
  //   const rowAy = row?.assessmentYear || row?.AssessmentYear || row?.ay;

  //   if (!rowPan || !rowAy) {
  //     toast.error("PAN / Assessment Year missing in row data");
  //     return;
  //   }

  //   try {
  //     await dispatch(getItrFilingWebById({ pan: rowPan, assessmentYear: rowAy })).unwrap();
  //     toast.success("Record loaded. Navigate to edit screen.");
  //     // Example:
  //     // navigate(`/file-itr/edit/${rowPan}/${rowAy}`);
  //   } catch (err) {
  //     toast.error(err?.message || "Failed to load record");
  //   }
  // };

  // ==================================================
  // Delete
  // ==================================================
  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteItrFilingWeb(confirmTooltip.id)).unwrap();
      toast.success('Record deleted');

      dispatch(
        getAllItrFilingWeb({
          page,
          limit,
          pan: debouncedPan.trim(),
          objectKey: debouncedObjectKey.trim(),
        })
      );
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, id: null });
    }
  };

  return (
    <div id="itr-page-container" className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[85vh]">
      {/* ================= Header ================= */}
      <div className="flex items-center mb-3">
        {/* Left: summary cards (kept same style as DocumentMangement) */}
        <div id="itr-summary-section" className="flex items-start gap-3">
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Total Records:</span>
            <span className="text-sm font-semibold text-blue-700">{pagination?.totalDocs ?? 0}</span>
          </div>

          {/* <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Active:</span>
            <span className="text-sm font-semibold text-green-700">{pagination?.activeRecords ?? summary?.activeDocuments ?? 0}</span>
          </div>

          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Deleted:</span>
            <span className="text-sm font-semibold text-red-700">{pagination?.deletedRecords ?? summary?.totalDeletedDocuments ?? 0}</span>
          </div> */}
        </div>

        {/* Right: controls */}
        <div className="ml-auto flex items-center gap-2">
          <input id="itr-pan-input" type="text" placeholder="Filter by PAN..." className="border px-3 py-2 h-9 rounded-md w-56 text-sm" value={pan} onChange={(e) => setPan(e.target.value)} />

          <input id="itr-objectKey-input" type="text" placeholder="Filter by Object Key..." className="border px-3 py-2 h-9 rounded-md w-64 text-sm" value={objectKey} onChange={(e) => setObjectKey(e.target.value)} />

          {/* ✅ FILE ITR BUTTON (LEFT of Refresh) */}
          <button id="itr-file-button" onClick={() => navigate('/professional/incometax/fileitr')} className="flex items-center gap-1 bg-blue-600 text-white px-3 h-9 rounded-md hover:bg-blue-700">
            <FileArchive size={16} />
            File ITR
          </button>

          {/* Refresh */}
          <button id="itr-refresh-button" onClick={handleRefresh} className="border px-3 h-9 rounded-md flex items-center justify-center hover:bg-gray-100">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ================= Table ================= */}
      <div className="flex-1 w-full">
        <div className="max-h-[78vh] overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left w-[70px]">Sr No</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">PAN</th>
                <th className="px-3 py-2 text-left">ITR Type</th>
                <th className="px-3 py-2 text-left">Assessment Year</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-center w-[110px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {records?.length ? (
                records.map((row, idx) => {
                  const rowPan = row?.pan || row?.panCard || '-';
                  const rowAy = row?.assessmentYear || row?.AssessmentYear || row?.ay || '-';
                  const rowStatus = row?.status || row?.payload?.status || row?.Status || '—';
                  const rowId = row?._id || row?.id;
                  const name = row?.payload?.meta?.taxpayer?.name;
                  const itrForm = row?.payload?.meta?.itrForm;
                  return (
                    <tr key={rowId || `${rowPan}-${rowAy}-${idx}`} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{(pagination?.offset ?? 0) + idx + 1}</td>
                      <td className="px-3 py-2">{name}</td>
                      <td className="px-3 py-2">{rowPan}</td>
                      <td className="px-3 py-2">{itrForm}</td>
                      <td className="px-3 py-2">{rowAy}</td>
                      <td className="px-3 py-2">{rowStatus}</td>

                      <td className="px-3 py-2 flex items-center gap-3 justify-center">
                        <button id="itr-download-button" onClick={() => handleDownload(row)} className="text-blue-600 hover:text-blue-800" title="Download">
                          <Download size={16} />
                        </button>

                        <button id="itr-edit-button" onClick={() => handleEdit(row)} className="text-gray-700 hover:text-gray-900" title="Edit">
                          <Edit size={16} />
                        </button>

                        <button
                          id="itr-delete-button"
                          onClick={(e) => {
                            if (!rowId) {
                              toast.error('Record ID missing');
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const tooltipWidth = 130;
                            let x = rect.left - tooltipWidth;
                            if (x < 10) x = 10;
                            const y = rect.top + window.scrollY - 5;

                            setConfirmTooltip({
                              show: true,
                              x,
                              y,
                              id: rowId,
                            });
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                    {loading ? 'Loading...' : 'No records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= Pagination ================= */}
      {pagination?.totalDocs > 0 && records?.length > 0 && (
        <div id="itr-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rows per page:</label>

            <select
              value={pagination.limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              {[10, 20, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Showing info */}
          <div>
            Showing{' '}
            <strong>
              {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.totalDocs)}
            </strong>{' '}
            of <strong>{pagination.totalDocs}</strong> | Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={pagination.currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              First
            </button>

            <button onClick={() => setPage(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Prev
            </button>

            <button onClick={() => setPage(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Next
            </button>

            <button onClick={() => setPage(pagination.totalPages)} disabled={pagination.currentPage === pagination.totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Last
            </button>
          </div>
        </div>
      )}

      {/* ================= Delete Tooltip ================= */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this record?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, id: null })}
        />
      )}
    </div>
  );
};

export default FileITRList;
