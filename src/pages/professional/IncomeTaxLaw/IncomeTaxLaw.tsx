import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// ✅ You should create/import these from your slice
import { getAllProfessionalIncomeTaxLaw, getProfessionalIncomeTaxLawById, clearSelectedProfessionalIncomeTaxLaw } from '../../../redux/slices/professionalSlice/professionIntxLaw/professionalIncomeTaxLawSlice';
import ReadMoreText from '../../../components/common/ReadMoreText';
import SearchInput from '../../../components/searchInput';
import { DataCreateButton, DataREfreshButton } from '../../../components/buttons';
import DataTable from '../../../components/DataTable';
import Pagination from '../../../components/pagination';
import Badge from '../../../components/badge';

/**
 * Dynamic renderer for arrays like:
 * - keypoints: string[]
 * - tags: string[] | {tagName:string}[]
 * - subsections: {number,text}[]
 * - examples: {title,description}[]
 */
const ArrayField = ({ label, value }) => {
  if (!Array.isArray(value) || value.length === 0) return null;

  const renderItem = (item, idx) => {
    if (item == null) return null;

    // string
    if (typeof item === 'string') {
      return (
        <li key={idx} className="list-disc ml-5">
          {item}
        </li>
      );
    }

    // object
    if (typeof item === 'object') {
      // subsections {number,text}
      if ('number' in item || 'text' in item) {
        return (
          <li key={idx} className="ml-5">
            <div className="flex gap-2">
              <span className="font-semibold">{item.number ?? `${idx + 1}.`}</span>
              <span className="text-gray-700 whitespace-pre-wrap">{item.text ?? '-'}</span>
            </div>
          </li>
        );
      }

      // examples {title,description}
      if ('title' in item || 'description' in item) {
        return (
          <li key={idx} className="ml-5">
            <div className="font-semibold">{item.title ?? `Example ${idx + 1}`}</div>
            <div className="text-gray-700 whitespace-pre-wrap">{item.description ?? '-'}</div>
          </li>
        );
      }

      // tags like {tagName}
      if ('tagName' in item) {
        return (
          <li key={idx} className="list-disc ml-5">
            {item.tagName}
          </li>
        );
      }

      // fallback: stringify object
      return (
        <li key={idx} className="list-disc ml-5">
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 border rounded p-2">{JSON.stringify(item, null, 2)}</pre>
        </li>
      );
    }

    // number/boolean
    return (
      <li key={idx} className="list-disc ml-5">
        {String(item)}
      </li>
    );
  };

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold text-gray-800 mb-1">{label}</div>
      <ul className="space-y-2">{value.map(renderItem)}</ul>
    </div>
  );
};

const columns = [
  { key: 'lawId', title: 'Law ID', },
  { key: 'section', title: 'Section' },
  { key: 'title', title: 'Title', type: "readMoreText" },
  { key: 'status', title: 'Status' }
];

const ViewLawModal = ({ open, onClose, law, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* modal */}
      <div className="relative bg-white w-[95vw] max-w-3xl rounded-md shadow-lg border p-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">Law Section Details</div>
          <button onClick={onClose} className="ml-auto  px-3 py-1 rounded-md hover:bg-gray-50">
            X
          </button>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : !law ? (
            <div className="text-sm text-gray-600">No data</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="text-xs text-gray-500">Law ID</div>
                  <div className="font-semibold">{law.lawId ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-semibold">{law.status ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3 md:col-span-2">
                  <div className="text-xs text-gray-500">Act</div>
                  <div className="font-semibold">{law.act ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="text-xs text-gray-500">Section</div>
                  <div className="font-semibold">{law.section ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="text-xs text-gray-500">Language</div>
                  <div className="font-semibold">{law.language ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3 md:col-span-2">
                  <div className="text-xs text-gray-500">Title</div>
                  <div className="font-semibold whitespace-pre-wrap">{law.title ?? '-'}</div>
                </div>

                <div className="bg-gray-50 border rounded-md p-3 md:col-span-2">
                  <div className="text-xs text-gray-500">Chapter</div>
                  <div className="font-semibold whitespace-pre-wrap">{law.chapter ?? '-'}</div>
                </div>
              </div>

              {/* Dynamic arrays */}
              <ArrayField label="Keypoints" value={law.keypoints} />
              <ArrayField label="Examples" value={law.examples} />
              <ArrayField label="Subsections" value={law.subsections} />
              <ArrayField label="Tags" value={law.tags} />

              <div className="mt-4 text-xs text-gray-500">
                Created: {law.createdOn ? new Date(law.createdOn).toLocaleString() : '-'}
                {' • '}
                Modified: {law.modifiedOn ? new Date(law.modifiedOn).toLocaleString() : '-'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const IncomeTaxLaw = () => {
  const dispatch = useDispatch();

  // slice state
  const { records, loading, pagination, filters, selectedRecord, error } = useSelector((s) => s.professionalIncomeTaxLaw);
  console.log('selectedRecord', selectedRecord);
  // local ui state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [status, setStatus] = useState('Active');

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // ===== Load list
  useEffect(() => {
    dispatch(
      getAllProfessionalIncomeTaxLaw({
        page,
        limit,
        search: debouncedSearch.trim(),
        status,
      }),
    );
  }, [dispatch, page, limit, debouncedSearch, status]);

  // ===== Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  // ===== Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(
      getAllProfessionalIncomeTaxLaw({
        page,
        limit,
        search: debouncedSearch.trim(),
        status,
      }),
    );
    setRefreshing(false);
    toast.success('Law list refreshed');
  };

  // ===== View (GET BY ID: /.../INTXL-731967)
  const handleView = async (lawId) => {
    try {
      setViewLoading(true);
      setViewOpen(true);

      // IMPORTANT: your API example uses /INTXL-731967 (lawId), not mongo id.
      const res = await dispatch(getProfessionalIncomeTaxLawById(lawId)).unwrap();

      // Your response sample returns { law: {...} }
      // If your thunk already returns res.data.law, ignore this.
      // Otherwise keep modal tolerant:
      const law = res?.law ?? res;
      // store to slice: thunk should already do it. This line is optional.
      // (keeping UI consistent even if thunk returns different shapes)
      if (law && !selectedRecord) {
        // do nothing; slice should set selectedRecord
      }

      setViewLoading(false);
    } catch (e) {
      setViewLoading(false);
      toast.error(e?.message || 'Failed to load law section');
    }
  };

  const closeView = () => {
    setViewOpen(false);
    dispatch(clearSelectedProfessionalIncomeTaxLaw());
  };

  // list to show (API might send key as records)
  const rows = useMemo(() => records || [], [records]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div id="income-tax-law-page-container" className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[100%]">
      {/* ================= Header ================= */}
      <div className="flex items-center mb-3 gap-2 flex-wrap shrink-0">
        {/* Left: basic info */}
        <Badge {...{ count: pagination?.totalDocs ?? 0, text: "Total:", varient: "primary" }} />
        {/* Right: controls */}
        <div className="ml-auto flex items-center gap-2">
          <SearchInput {...{ search, setSearch }} />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-md border border-gray-300 bg-white px-5 text-sm text-gray-800 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 cursor-pointer">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="">All</option>
          </select>
          <DataREfreshButton {...{ callBackFn: handleRefresh }} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No products found"
        actions={(e) => (
          <div className="flex items-center gap-2">
            {/* EDIT */}
            <button id="income-tax-law-view-button" onClick={() => handleView(row.lawId)} className="text-blue-600 hover:text-blue-800" title="View">
              <Eye size={16} />
            </button>
          </div>
        )}
      />

      {(pagination?.totalDocs ?? 0) > 0 && rows?.length > 0 && <Pagination  {...{
        localLimit: limit, selectCb: (e) => {
          setLimit(Number(e.target.value));
          setPage(1);
        },
        preDisabled: (pagination?.currentPage ?? 1) === 1,
        nextDisabled: (pagination?.currentPage ?? 1) === (pagination?.totalPages ?? 1),
        setLocalOffset: setPage, pagination
      }} />}
      {/* ================= View Modal ================= */}
      <ViewLawModal open={viewOpen} onClose={closeView} law={selectedRecord} loading={viewLoading} />
    </div>
  );
};

export default IncomeTaxLaw;
