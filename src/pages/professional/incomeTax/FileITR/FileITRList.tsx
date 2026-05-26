import { useEffect, useState } from 'react';
import {  Trash2, Download, Edit, FileArchive } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ConfirmTooltip from '../../../../components/common/ConfirmTooltip';
import { useNavigate } from 'react-router-dom';

// ✅ update this import path to where you placed the slice
import { getAllItrFilingWeb, deleteItrFilingWeb } from '../../../../redux/slices/professionalSlice/fileITRweb/itrFilingWebMgtSlice';
import Badge from '../../../../components/badge';
import SearchInput from '../../../../components/searchInput';
import { DataCreateButton, DataREfreshButton } from '../../../../components/buttons';
import DataTable from '../../../../components/DataTable';
import Pagination from '../../../../components/pagination';

const columns = [
  {
    key: 'accountCode', title: 'Sr No.',
    render: (row: any, idx: number) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {(pagination?.offset ?? 0) + idx + 1}
      </span>
    ),
  },
  {
    key: 'accountName', title: 'Name',
    render: (row: any) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {row?.payload?.meta?.taxpayer?.name}
      </span>
    ),
  },
  {
    key: 'accountMobile', title: 'PAN',
    render: (row: any) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {row?.pan || row?.panCard || '-'}
      </span>
    ),
  },
  {
    key: 'accountEmail', title: 'ITR Type',
    render: (row: any) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {row?.payload?.meta?.itrForm}
      </span>
    ),
  },
  {
    key: 'accountEmail', title: 'Assessment Year',
    render: (row: any) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {row?.assessmentYear || row?.AssessmentYear || row?.ay || '-'}
      </span>
    )
  },
  {
    key: 'accountEmail', title: 'Status',
    render: (row: any) => (
      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
        {row?.status || row?.payload?.status || row?.Status || '—'}
      </span>
    )
  },
];

const FileITRList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ update selector key as per your store
  const { records, loading, pagination } = useSelector((s) => s.itrFilingWebMgt);

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

  // Load list
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

  // Debounce filters
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

  // Refresh
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

  // Download (placeholder)
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
  // Edit (fetch single record & navigate)

  const handleEdit = (row) => {
    const rowPan = row?.pan || row?.panCard;
    const rowAy = row?.assessmentYear;

    if (!rowPan || !rowAy) {
      toast.error('PAN / Assessment Year missing in row data');
      return;
    }

    navigate(`/professional/incometax/fileitr/edit/${rowPan}/${encodeURIComponent(rowAy)}`);
  };

  // Delete
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
    <div id="itr-page-container" className="bg-white border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
      {/* ================= Header ================= */}
      <div className="flex items-center mb-3">
        {/* Left: summary cards (kept same style as DocumentMangement) */}

        <div id="account-summary" className="flex items-start gap-3">
          <Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Records:", varient: "primary" }} />
        </div>

        {/* Right: controls */}
        <div className="ml-auto flex items-center gap-2">
          <SearchInput {...{ search: pan, setSearch: setPan, placeholder: "Filter by PAN..." }} />
          <SearchInput {...{ search: objectKey, setSearch: setObjectKey, placeholder: "Filter by Object Key..." }} />
          <DataREfreshButton {...{ callBackFn: handleRefresh }} />
          <DataCreateButton {...{ callBackFn: () => navigate('/professional/incometax/fileitr'), text: "File ITR", icon: <FileArchive size={16} /> }} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No records found"
        actions={(acc) => {
          const rowId = acc?._id || acc?.id;
          return (
            <div className="flex items-center gap-2">
              {/* EDIT */}
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
            </div>
          )
        }}
      />

      {pagination?.totalDocs > 0 && records?.length > 0 && <Pagination  {...{
        localLimit: limit, selectCb: (e: any) => {
          setLimit(Number(e.target.value));
          setPage(1);
        },
        preDisabled: pagination.currentPage === 1,
        nextDisabled: pagination.currentPage === pagination.totalPages,
        setLocalOffset: setPage, pagination
      }} />}

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
