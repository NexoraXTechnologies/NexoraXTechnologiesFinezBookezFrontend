import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, UploadCloud, RefreshCcw, Trash2, Download } from 'lucide-react';
import { toast } from 'react-toastify';

import ConfirmTooltip from '../../../components/common/ConfirmTooltip';

import { getAllTaxPayers } from '../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';
import { fetchAssessmentYearDropdown } from '../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice';

import { uploadForm16File, fetchForm16List, downloadForm16File, deleteForm16File } from '../../../redux/slices/professionalSlice/incomeTaxSlice/form16Slice';

const UploadForm16 = () => {
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const { uploadLoading, listLoading, downloadLoading, deleteLoading, items, pagination } = useSelector((s) => s.form16);

  const { taxpayers = [], loading: panLoading } = useSelector((s) => s.taxpayer);
  const { regimes, natureOfEmployment, assessmentYears } = useSelector((s) => s.alldropdown);

  // modal states
  const [open, setOpen] = useState(false);
  const [selectedPan, setSelectedPan] = useState(null); // {pan,name}
  const [selectedAY, setSelectedAY] = useState(null);
  const [file, setFile] = useState(null);

  // list states (like document mgmt)
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    id: null,
  });

  // load dropdowns once
  useEffect(() => {
    dispatch(getAllTaxPayers());
    dispatch(fetchAssessmentYearDropdown());
  }, [dispatch]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // load list
  useEffect(() => {
    dispatch(fetchForm16List({ offset, limit, search: debouncedSearch }));
  }, [dispatch, offset, limit, debouncedSearch]);

  const panOptions = useMemo(() => {
    const rows = taxpayers ?? [];
    // IMPORTANT: SearchablePanDropdown expects {pan, name}
    return rows
      .map((t) => ({
        pan: t?.pan,
        name: t?.name || t?.fullName || '',
      }))
      .filter((x) => x.pan);
  }, [taxpayers]);

  const resetModal = () => {
    setSelectedPan(null);
    setSelectedAY(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onCancel = () => {
    resetModal();
    setOpen(false);
  };

  const validatePdf = (f) => {
    if (!f) return 'Please choose a PDF file.';
    const isPdfMime = f.type === 'application/pdf';
    const isPdfName = /\.pdf$/i.test(f.name);
    if (!isPdfMime && !isPdfName) return 'Only PDF files are allowed (Form 16).';
    return null;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchForm16List({ offset, limit, search: debouncedSearch }));
    setRefreshing(false);
    toast.success('Form16 list refreshed');
  };

  const onSave = async () => {
    if (!selectedPan?.pan) {
      toast.error('Please select PAN');
      return;
    }
    if (!selectedAY?.assYid) {
      toast.error('Please select Assessment Year');
      return;
    }

    const pdfErr = validatePdf(file);
    if (pdfErr) {
      toast.error(pdfErr);
      return;
    }

    try {
      await dispatch(
        uploadForm16File({
          name: file.name,
          uploadDate: new Date().toISOString(),
          fileType: 'form16',
          file,
          pan: selectedPan.pan,
          assessmentYear: selectedAY.assessmentYear || selectedAY.assYid,
        }),
      ).unwrap();

      toast.success('Form 16 uploaded successfully');

      // refresh list
      setOffset(0);
      dispatch(fetchForm16List({ offset: 0, limit, search: debouncedSearch }));
      onCancel();
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    }
  };

  const handleDownload = async (filename) => {
    try {
      const { blob } = await dispatch(downloadForm16File({ filename })).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || 'Download failed');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteForm16File({ id: confirmTooltip.id, fileType: 'form16' })).unwrap();
      toast.success('Form16 deleted');
      dispatch(fetchForm16List({ offset, limit, search: debouncedSearch }));
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, id: null });
    }
  };

  const total = pagination?.totalDocs ?? 0;
  const totalPages = pagination?.totalPages ?? 0;
  const currentPage = totalPages ? Math.floor((offset || 0) / (limit || 10)) + 1 : 1;

  return (
    <div className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* Header (like document mgmt) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Total Form16:</span>
            <span className="text-sm font-semibold text-blue-700">{total}</span>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Search filename..." className="border px-3 py-2 h-9 rounded-md w-48 sm:w-64 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />

          <button onClick={() => setOpen(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 h-9 rounded-md hover:bg-blue-700">
            <UploadCloud size={16} /> Upload
          </button>

          <button onClick={handleRefresh} className="border px-3 h-9 rounded-md flex items-center justify-center hover:bg-gray-100" title="Refresh">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 w-full">
        <div className="max-h-[78vh] overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left">Filename</th>
                <th className="px-3 py-2 text-left">File Type</th>
                <th className="px-3 py-2 text-left">Upload Date</th>
                <th className="px-3 py-2 text-left">Created By</th>
                <th className="px-3 py-2 text-center w-[90px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                    Loading...
                  </td>
                </tr>
              ) : items?.length ? (
                items.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{row.filename}</td>
                    <td className="px-3 py-2">{row.fileType}</td>
                    <td className="px-3 py-2">{row.uploadDate ? new Date(row.uploadDate).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">{row.createdBy ?? '-'}</td>

                    <td className="px-3 py-2 flex items-center gap-3 justify-center">
                      <button onClick={() => handleDownload(row.filename)} className="text-blue-600 hover:text-blue-800 disabled:opacity-50" disabled={downloadLoading} title="Download">
                        <Download size={16} />
                      </button>

                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipWidth = 130;
                          let x = rect.left - tooltipWidth;
                          if (x < 10) x = 10;
                          const y = rect.top + window.scrollY - 5;

                          setConfirmTooltip({
                            show: true,
                            x,
                            y,
                            id: row.id,
                          });
                        }}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={deleteLoading}
                        title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                    No Form16 files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (offset/limit style) */}
      {total > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rows per page:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              {[10, 20, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            Showing{' '}
            <strong>
              {Math.min(offset + 1, total)}–{Math.min(offset + limit, total)}
            </strong>{' '}
            of <strong>{total}</strong> | Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(0)} disabled={offset === 0} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              First
            </button>

            <button onClick={() => setOffset((o) => Math.max(0, o - limit))} disabled={offset === 0} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Prev
            </button>

            <button onClick={() => setOffset((o) => (pagination?.hasNextPage ? o + limit : o))} disabled={!pagination?.hasNextPage} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Next
            </button>

            <button
              onClick={() => {
                const lastOffset = Math.max(0, (totalPages - 1) * limit);
                setOffset(lastOffset);
              }}
              disabled={!pagination?.hasNextPage}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Last
            </button>
          </div>
        </div>
      )}

      {/* Delete Tooltip */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this Form16?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, id: null })}
        />
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onCancel}></div>

          <div className="relative w-[95vw] max-w-lg bg-white rounded-xl shadow-lg border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Upload Form 16 (PDF)</h3>
                <p className="text-xs text-gray-500 mt-1">Tip: Ensure your Form 16 is a valid PDF and the Assessment Year matches the document.</p>
              </div>

              <button onClick={onCancel} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {panLoading ? (
                <div className="text-sm text-gray-500">Loading dropdowns...</div>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">Search and select PAN, then choose Assessment Year</p>

                  <SearchablePanDropdown options={panOptions} value={selectedPan} onChange={(o) => setSelectedPan(o)} />

                  <select
                    className="w-full h-10 bg-gray-50 border border-gray-300 rounded-lg px-3 text-sm
                               focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedAY?.assYid || ''}
                    onChange={(e) => {
                      const ay = (assessmentYears || []).find((item) => item.assYid === e.target.value);
                      setSelectedAY(ay || null);
                    }}>
                    <option value="">Select Assessment Year</option>
                    {(assessmentYears || []).map((item) => (
                      <option key={item.id || item.assYid} value={item.assYid}>
                        {item.assessmentYear}
                      </option>
                    ))}
                  </select>

                  <div className="border border-dashed rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800">{file ? file.name : 'Choose Form 16 PDF'}</div>
                        <div className="text-xs text-gray-500">Only .pdf files are allowed</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50">
                          Browse
                        </button>

                        {file && (
                          <button type="button" onClick={() => setFile(null)} className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50">
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;

                        const err = validatePdf(f);
                        if (err) {
                          toast.error(err);
                          e.target.value = '';
                          return;
                        }
                        setFile(f);
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-2 border rounded-md hover:bg-gray-50" disabled={uploadLoading}>
                Cancel
              </button>

              <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60" disabled={uploadLoading}>
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Uses shape: { pan, name }
 */
const SearchablePanDropdown = ({ options, value, onChange }) => {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const q = query?.toLowerCase() || '';
  const filtered = (options || []).filter((o) => (o?.pan?.toLowerCase() || '').includes(q) || (o?.name?.toLowerCase() || '').includes(q));

  return (
    <div className="relative z-50">
      <input
        type="text"
        value={value ? `${value.pan}${value.name ? ` - ${value.name}` : ''}` : query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search PAN or Name"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50
                   focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.pan}
                onMouseDown={() => {
                  onChange(o);
                  setQuery('');
                  setOpen(false);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition">
                <p className="text-sm font-medium text-gray-800">{o.pan}</p>
                <p className="text-xs text-gray-500">{o.name}</p>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadForm16;
