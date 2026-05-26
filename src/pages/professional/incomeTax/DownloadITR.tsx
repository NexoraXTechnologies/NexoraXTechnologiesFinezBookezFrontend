import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Download, Share2, ChevronDown, Mail, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { getAllTaxPayers, getTaxPayerDetails } from '../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';

import {
  extractGmailAttachments,
  downloadGmailAttachment,
  checkGmailConnection,
  connectToGoogleGmail,
  clearDownloadedFile,
  clearExtractedAttachments,
} from '../../../redux/slices/professionalSlice/downloaditrviagmail/downloadItrWithEmailExtractorSlice';

// =======================================================
// helpers
// =======================================================
const safeStr = (v) => String(v ?? '').trim();
const normalize = (v) => safeStr(v).toLowerCase();

const formatFileSize = (bytes) => {
  const num = Number(bytes || 0);
  if (!num) return '—';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocType = (it) => {
  const direct = normalize(it?.docType || it?.type || it?.fileType);
  if (direct) return direct;

  const file = normalize(it?.fileName || it?.filename || '');
  if (file.includes('confirmation')) return 'confirmation';
  if (file.includes('intimation')) return 'intimation';

  const subject = normalize(it?.subject || '');
  if (subject.includes('confirmation')) return 'confirmation';
  if (subject.includes('intimation')) return 'intimation';

  return '';
};

const dedupeAttachments = (arr) => {
  const map = new Map();
  (Array.isArray(arr) ? arr : []).forEach((it) => {
    const key = `${safeStr(it?.attachmentId)}__${safeStr(it?.fileName || it?.filename)}`;
    if (!map.has(key)) map.set(key, it);
  });
  return Array.from(map.values());
};

const downloadBlobFile = (blob, fileName = 'attachment.pdf') => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const getTaxpayerEmail = (t) => {
  return t?.emailId || t?.email || t?.taxpayerEmail || t?.payload?.PersonalDetails?.emailId || t?.payload?.PersonalDetails?.email || '';
};

const getTaxpayerName = (t) => {
  const p = t?.payload?.PersonalDetails || t;
  return [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ').trim();
};

// =======================================================
// filter dropdown
// =======================================================
const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Confirmation', value: 'confirmation' },
  { label: 'Intimation', value: 'intimation' },
];

const FilterDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = filterOptions.find((x) => x.value === value);

  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className="border px-3 py-2 h-9 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 bg-white">
        <Filter size={16} />
        <span className="text-sm">{selected?.label || 'Filter'}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-white border rounded-md shadow-lg z-50 overflow-hidden">
            {filterOptions.map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// =======================================================
// component
// =======================================================
const DownloadITRsWeb = () => {
  const dispatch = useDispatch();

  const { taxpayers = [] } = useSelector((s) => s.taxpayer);
  const { attachments = [], loading, extractedData } = useSelector((s) => s.downloadItrWithEmailExtractor);

  const [selectedPAN, setSelectedPAN] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedTaxpayerEmail, setSelectedTaxpayerEmail] = useState('');

  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('');

  const [downloadingId, setDownloadingId] = useState('');
  const [sharingId, setSharingId] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const skipNextTypeEffectRef = useRef(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const senderEmail = 'communication@cpc.incometax.gov.in';

  // ==================================================
  // Load taxpayers for PAN dropdown
  // ==================================================
  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', limit: 500, page: 1 }));
  }, [dispatch]);

  // ==================================================
  // Extract attachments
  // ==================================================
  const handleExtractAttachments = async ({ pan = selectedPAN, taxpayerEmail = selectedTaxpayerEmail, type = docType, showSuccessToast = true, pageNo = page, pageSize = limit } = {}) => {
    const cleanPan = safeStr(pan);
    const cleanEmail = safeStr(taxpayerEmail);

    if (!cleanPan) {
      toast.error('Please select PAN');
      return;
    }

    if (!cleanEmail) {
      toast.error('Taxpayer email not found');
      return;
    }

    try {
      await dispatch(
        extractGmailAttachments({
          type: type || '',
          payload: {
            taxpayerEmail: cleanEmail,
            taxpayerPAN: cleanPan,
            senderEmail,
            page: pageNo,
            limit: pageSize,
          },
        }),
      ).unwrap();

      if (showSuccessToast) {
        toast.success('Attachments fetched successfully');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch attachments');
    }
  };

  // ==================================================
  // PAN select -> SAME AS MOBILE
  // 1. fetch taxpayer by PAN
  // 2. get fresh email
  // 3. reset filters
  // 4. fetch all attachments immediately
  // ==================================================
  const handleSelectPAN = async (pan) => {
    setSelectedPAN(pan);
    setSearch('');
    setPage(1);
    setLimit(10);

    skipNextTypeEffectRef.current = true;
    setDocType('');

    if (!pan) {
      setSelectedName('');
      setSelectedTaxpayerEmail('');
      dispatch(clearExtractedAttachments());
      return;
    }

    try {
      const taxpayer = await dispatch(getTaxPayerDetails(pan)).unwrap();

      const fullName = getTaxpayerName(taxpayer) || taxpayer?.fullName || taxpayer?.name || '';

      const taxpayerEmail = getTaxpayerEmail(taxpayer);

      setSelectedName(fullName);
      setSelectedTaxpayerEmail(taxpayerEmail);

      if (!safeStr(taxpayerEmail)) {
        dispatch(clearExtractedAttachments());
        toast.error('Taxpayer email not found');
        return;
      }

      await handleExtractAttachments({
        pan,
        taxpayerEmail,
        type: '',
        showSuccessToast: false,
      });
    } catch (err) {
      setSelectedName('');
      setSelectedTaxpayerEmail('');
      dispatch(clearExtractedAttachments());
      toast.error(err?.message || 'Failed to fetch taxpayer details');
    }
  };

  // ==================================================
  // Google connect/check
  // ==================================================
  const handleGoogleClick = async () => {
    if (!safeStr(selectedPAN)) {
      toast.error('Please select PAN');
      return;
    }

    if (!safeStr(selectedTaxpayerEmail)) {
      toast.error('Taxpayer email not found');
      return;
    }

    try {
      setConnectingGoogle(true);

      const checkRes = await dispatch(
        checkGmailConnection({
          taxpayerEmail: selectedTaxpayerEmail,
          taxpayerPAN: selectedPAN,
        }),
      ).unwrap();

      if (checkRes?.connected) {
        await handleExtractAttachments({
          pan: selectedPAN,
          taxpayerEmail: selectedTaxpayerEmail,
          type: docType,
          showSuccessToast: true,
        });
        return;
      }

      const connectRes = await dispatch(
        connectToGoogleGmail({
          taxpayerEmail: selectedTaxpayerEmail,
          taxpayerPAN: selectedPAN,
        }),
      ).unwrap();

      if (connectRes?.url) {
        window.open(connectRes.url, '_blank', 'noopener,noreferrer');
        toast.info('Complete Google consent and then click Google again');
      } else {
        toast.error('Google consent URL not found');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to connect Gmail');
    } finally {
      setConnectingGoogle(false);
    }
  };

  // ==================================================
  // Re-fetch on type filter change
  // ==================================================
  useEffect(() => {
    if (!selectedPAN || !selectedTaxpayerEmail) return;

    handleExtractAttachments({
      pan: selectedPAN,
      taxpayerEmail: selectedTaxpayerEmail,
      type: docType,
      showSuccessToast: false,
      pageNo: page,
      pageSize: limit,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // ==================================================
  // Local search
  // ==================================================
  const filteredAttachments = useMemo(() => {
    const unique = dedupeAttachments(attachments || []);
    const q = normalize(search);

    return unique.filter((it) => {
      const fileName = normalize(it?.fileName || it?.filename);
      const subject = normalize(it?.subject);
      const snippet = normalize(it?.messageSnippet);

      const matchesSearch = !q || fileName.includes(q) || subject.includes(q) || snippet.includes(q);

      return matchesSearch;
    });
  }, [attachments, search]);
  const pagination = extractedData?.pagination || {
    offset: 0,
    limit,
    totalDocs: filteredAttachments?.length || 0,
    totalPages: 1,
    currentPage: page,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // ==================================================
  // Download
  // ==================================================
  const handleDownload = async (item) => {
    const attachmentId = safeStr(item?.attachmentId || item?._id || item?.id);

    if (!attachmentId) {
      toast.error('Attachment ID not found');
      return;
    }

    try {
      setDownloadingId(attachmentId);
      await dispatch(downloadGmailAttachment(attachmentId)).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Failed to download PDF');
    } finally {
      setDownloadingId('');
    }
  };

  // ==================================================
  // Share
  // ==================================================
  const handleShare = async (item) => {
    const attachmentId = safeStr(item?.attachmentId || item?._id || item?.id);

    if (!attachmentId) {
      toast.error('Attachment ID not found');
      return;
    }

    try {
      setSharingId(attachmentId);

      const res = await dispatch(downloadGmailAttachment(attachmentId)).unwrap();

      const file = new File([res.blob], res.fileName || item?.fileName || item?.filename || 'attachment.pdf', { type: res.blob?.type || 'application/pdf' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: file.name,
          files: [file],
        });
      } else {
        downloadBlobFile(res.blob, file.name);
        toast.info('Share not supported in this browser. File downloaded instead.');
      }

      dispatch(clearDownloadedFile());
    } catch (err) {
      toast.error(err?.message || 'Failed to share attachment');
    } finally {
      setSharingId('');
    }
  };

  return (
    <div id="download-itr-page-container" className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* ================= Top Bar ================= */}
      <div className="mb-3 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-9 whitespace-nowrap">
            <span className="text-xs text-gray-600">Total Records:</span>
            <span className="text-sm font-semibold text-blue-700">{filteredAttachments?.length ?? extractedData?.total ?? 0}</span>
          </div>

          <select id="download-itr-pan-select" value={selectedPAN} onChange={(e) => handleSelectPAN(e.target.value)} className="border px-3 py-2 h-9 rounded-md min-w-[220px] text-sm shrink-0">
            <option value="">Select PAN</option>
            {taxpayers.map((t) => {
              const name = getTaxpayerName(t);
              return (
                <option key={t.pan} value={t.pan}>
                  {t.pan} {name ? `(${name})` : ''}
                </option>
              );
            })}
          </select>

          <div className="relative shrink-0">
            <input
              id="download-itr-search-input"
              type="text"
              placeholder="Search by filename, type, subject..."
              className="border px-3 pr-9 py-2 h-9 rounded-md w-64 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!selectedPAN}
            />
          </div>

          <FilterDropdown
            value={docType}
            onChange={(value) => {
              setDocType(value);
              setPage(1);
            }}
          />

          <button
            id="download-itr-google-button"
            onClick={handleGoogleClick}
            disabled={loading || connectingGoogle}
            className="flex items-center gap-3 bg-white text-gray-700 px-4 h-9 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60 shadow-sm whitespace-nowrap shrink-0">
            {connectingGoogle ? <Loader2 size={18} className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />}
            <span className="text-sm font-medium">{connectingGoogle ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>

      {/* ================= Table ================= */}
      <div className="flex-1 overflow-x-auto w-full">
        <div className="max-h-[78vh] overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left w-[70px]">Sr No</th>
                <th className="px-3 py-2 text-left">File Name</th>
                <th className="px-3 py-2 text-left w-[130px]">Type</th>
                <th className="px-3 py-2 text-left w-[120px]">Size</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-center w-[110px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttachments?.length ? (
                filteredAttachments.map((row, idx) => {
                  const attachmentId = row?.attachmentId || row?._id || row?.id;
                  const fileName = row?.fileName || row?.filename || '—';
                  const type = getDocType(row) || '—';
                  const size = formatFileSize(row?.sizeBytes);
                  const subject = row?.subject || '—';

                  return (
                    <tr key={attachmentId || `${fileName}-${idx}`} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 truncate" title={fileName}>
                        {fileName}
                      </td>
                      <td className="px-3 py-2 capitalize">{type}</td>
                      <td className="px-3 py-2">{size}</td>
                      <td className="px-3 py-2 truncate" title={subject}>
                        {subject}
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3 justify-center">
                          <button onClick={() => handleDownload(row)} className="text-blue-600 hover:text-blue-800 disabled:opacity-60" title="Download" disabled={downloadingId === attachmentId}>
                            {downloadingId === attachmentId ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                    {loading ? 'Loading...' : 'No documents found. Select PAN and click Google.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= Pagination ================= */}
      {pagination?.totalDocs > 0 && filteredAttachments?.length > 0 && (
        <div id="download-itr-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
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

          <div>
            Showing{' '}
            <strong>
              {pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.totalDocs)}
            </strong>{' '}
            of <strong>{pagination.totalDocs}</strong> | Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
          </div>

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
    </div>
  );
};

export default DownloadITRsWeb;
