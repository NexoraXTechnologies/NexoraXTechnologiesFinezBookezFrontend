import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// ✅ You should create/import these from your slice
import { getAllProfessionalIncomeTaxLaw, getProfessionalIncomeTaxLawById, clearSelectedProfessionalIncomeTaxLaw } from '../../../redux/slices/professionalSlice/professionIntxLaw/professionalIncomeTaxLawSlice';
import ReadMoreText from '../../../components/common/ReadMoreText';

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
    <div id="income-tax-law-page-container" className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[85vh]">
      {/* ================= Header ================= */}
      <div className="flex items-center mb-3 gap-2 flex-wrap shrink-0">
        {/* Left: basic info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Total:</span>
            <span className="text-sm font-semibold text-blue-700">{pagination?.totalDocs ?? 0}</span>
          </div>
        </div>

        {/* Right: controls */}
        <div className="ml-auto flex items-center gap-2">
          <input id="income-tax-law-search-input" type="text" placeholder="Search (lawId / section / title)..." className="border px-3 py-2 h-9 rounded-md w-64 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border px-2 h-9 rounded-md text-sm">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="">All</option>
          </select>

          <button id="income-tax-law-refresh-button" onClick={handleRefresh} className="border px-3 h-9 rounded-md flex items-center justify-center hover:bg-gray-100" title="Refresh">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ================= Table ================= */}
      <div className="flex-1 min-h-0 overflow-x-auto w-full">
        <div className="h-full overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left w-[140px]">Law ID</th>
                <th className="px-3 py-2 text-left w-[143px]">Section</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left w-[110px]">Status</th>
                <th className="px-3 py-2 text-center w-[90px]">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                    Loading...
                  </td>
                </tr>
              ) : rows?.length ? (
                rows.map((row) => (
                  <tr key={row.lawId || row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{row.lawId ?? '-'}</td>
                    <td className="px-3 py-2">{row.section ?? '-'}</td>
                    <td className="px-3 py-2 truncate" title={row.title}>
                      <ReadMoreText text={row.title || 'NA'} charLimit={50} />
                    </td>
                    <td className="px-3 py-2">{row.status ?? '-'}</td>

                    <td className="px-3 py-4 flex items-center gap-3 justify-center">
                      <button id="income-tax-law-view-button" onClick={() => handleView(row.lawId)} className="text-blue-600 hover:text-blue-800" title="View">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                    No law sections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= Pagination ================= */}
      {(pagination?.totalDocs ?? 0) > 0 && rows?.length > 0 && (
        <div id="income-tax-law-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2 shrink-0">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rows per page:</label>

            <select
              value={limit}
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
              {(pagination?.offset ?? 0) + 1}–{Math.min((pagination?.offset ?? 0) + (pagination?.limit ?? limit), pagination?.totalDocs ?? 0)}
            </strong>{' '}
            of <strong>{pagination?.totalDocs ?? 0}</strong> | Page <strong>{pagination?.currentPage ?? page}</strong> of <strong>{pagination?.totalPages ?? 1}</strong>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={(pagination?.currentPage ?? 1) === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              First
            </button>

            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(pagination?.currentPage ?? 1) === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Prev
            </button>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination?.totalPages ?? 1))}
              disabled={(pagination?.currentPage ?? 1) === (pagination?.totalPages ?? 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Next
            </button>

            <button onClick={() => setPage(pagination?.totalPages ?? 1)} disabled={(pagination?.currentPage ?? 1) === (pagination?.totalPages ?? 1)} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Last
            </button>
          </div>
        </div>
      )}

      {/* ================= View Modal ================= */}
      <ViewLawModal open={viewOpen} onClose={closeView} law={selectedRecord} loading={viewLoading} />
    </div>
  );
};

export default IncomeTaxLaw;
