import React, { useEffect, useMemo, useState } from 'react';
import professionalAxios from '../../../services/professionalAxios';
import { runnerService } from '../../../services/runnerService';
import { Play, Square, RefreshCcw, Laptop, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Eye, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { deleteJobQueueAutomationByCommonId } from '../../../redux/slices/professionalSlice/automation/automatioinSlice';
import ConfirmTooltip from '../../../components/common/ConfirmTooltip';

const TABS = [
  { key: 'completed', label: 'Completed', status: 'COMPLETED' },
  { key: 'running', label: 'Running', status: 'IN_PROGRESS' },
  { key: 'pending', label: 'Pending', status: 'PENDING' },
  { key: 'failed', label: 'Failed', status: 'FAILED' },
];

export default function AutomationDashboard() {
  const [tab, setTab] = useState('completed'); // default
  const [runner, setRunner] = useState('CHECKING'); // RUNNING/STOPPED/NOT_DETECTED/UNKNOWN
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const openDetails = (job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedJob(null);
  };
  const dispatch = useDispatch();
  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    commonId: null,
  });

  const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

  const fmtDateTime = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  const mask = (val, showStart = 3, showEnd = 2) => {
    const s = String(val ?? '');
    if (!s) return '—';
    if (s.length <= showStart + showEnd) return '•'.repeat(s.length);
    return `${s.slice(0, showStart)}${'•'.repeat(Math.max(4, s.length - (showStart + showEnd)))}${s.slice(-showEnd)}`;
  };

  // ✅ pagination states (same concept as Users)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 100,
    totalDocs: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const getProfessionalHeader = (key) => {
    const data = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');
    return data?.[key] ?? '';
  };

  const Authtoken = getProfessionalHeader('authtoken');
  const LoginUser = getProfessionalHeader('loginuser');
  const parent = getProfessionalHeader('x-db-name');

  const baseQueryParams = useMemo(
    () => ({
      jobType: '',
      jobId: '',
      createdBy: '',
      targetAgentId: '',
    }),
    [],
  );

  const selectedTab = TABS.find((t) => t.key === tab) || TABS[0];

  const checkRunner = async (silent = false) => {
    try {
      const r = await runnerService.status();
      setRunner(r?.data?.status || 'UNKNOWN');
      if (!silent) toast.success('Runner status updated');
    } catch (e) {
      setRunner('NOT_DETECTED');
      if (!silent) toast.error('Runner not detected on this PC');
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const offset = (page - 1) * limit;

      const res = await professionalAxios.get('/eTaxSolnMongoApiBackend/users/jobQueueAutomation/getAll', {
        params: {
          ...baseQueryParams,
          status: selectedTab.status,
          offset,
          limit,
        },
        // if needed:
        // headers: { authtoken: Authtoken, loginuser: LoginUser, 'x-db-name': parent },
      });
      const docs = res?.data?.data?.docs || [];

      console.log(JSON.stringify(docs, null, 2));
      const pg = res?.data?.data?.pagination || {};
      setPagination(pg);

      setJobs(docs);
      setPagination({
        offset: pg?.offset ?? offset,
        limit: pg?.limit ?? limit,
        totalDocs: pg?.totalDocs ?? 0,
        totalPages: pg?.totalPages ?? 0,
        currentPage: pg?.currentPage ?? page,
        hasNextPage: !!pg?.hasNextPage,
        hasPrevPage: !!pg?.hasPrevPage,
      });
    } catch (e) {
      setJobs([]);
      setPagination({
        offset: 0,
        limit,
        totalDocs: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      toast.error('Failed to fetch jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkRunner(true), loadJobs()]);
    toast.success('Refreshed');
    setRefreshing(false);
  };
  const openDeleteConfirm = (e, job) => {
    e.stopPropagation();

    const commonId = job?.commonId || job?.jobCommonId || job?.jobId;
    if (!commonId) {
      toast.error('Common ID not found');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const tooltipWidth = 200; // adjust if needed
    const padding = 8;

    // ✅ position LEFT of button
    let tooltipX = rect.left + window.scrollX - tooltipWidth - padding;

    // prevent going off screen
    if (tooltipX < 10) tooltipX = 10;

    const tooltipY = rect.top + window.scrollY - 5;

    setConfirmTooltip({
      show: true,
      x: tooltipX,
      y: tooltipY,
      commonId,
    });
  };
  const handleDeleteConfirm = async () => {
    if (!confirmTooltip.commonId) return;

    try {
      await dispatch(deleteJobQueueAutomationByCommonId({ commonId: confirmTooltip.commonId })).unwrap();
      toast.success('Job deleted successfully');

      // ✅ refresh list (recommended so pagination counts stay correct)
      await loadJobs();
    } catch (err) {
      toast.error(err?.message || err || 'Failed to delete job');
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, commonId: null });
    }
  };

  const handleStart = async () => {
    try {
      await runnerService.start();
      toast.success('Runner started');
    } catch (e) {
      toast.error('Failed to start runner');
    } finally {
      checkRunner(true);
    }
  };

  const handleStop = async () => {
    try {
      await runnerService.stop();
      toast.success('Runner stopped');
    } catch (e) {
      toast.error('Failed to stop runner');
    } finally {
      checkRunner(true);
    }
  };

  useEffect(() => {
    checkRunner(true);
  }, []);

  // ✅ reset page on tab change
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // ✅ fetch on tab/page/limit changes
  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit]);

  const runnerPill = () => {
    if (runner === 'CHECKING') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border">CHECKING…</span>;
    }
    if (runner === 'RUNNING') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">RUNNING</span>;
    }
    if (runner === 'STOPPED') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">STOPPED</span>;
    }
    if (runner === 'NOT_DETECTED') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">NOT DETECTED</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">{runner}</span>;
  };

  const statusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">COMPLETED</span>;
    if (s === 'IN_PROGRESS') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">IN PROGRESS</span>;
    if (s === 'PENDING') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">PENDING</span>;
    if (s === 'FAILED' || s === 'ERROR') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">{s}</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">{s || '—'}</span>;
  };

  // ✅ variables for pagination block (same as Users)
  const totalCount = pagination?.totalDocs || 0;
  const totalPages = pagination?.totalPages || 1;

  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(page * limit, totalCount);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <Laptop size={16} className="text-blue-700" />
            <span className="text-xs text-gray-600">Runner</span>
            {runnerPill()}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleRefresh} className="border px-3 h-9 rounded-md flex items-center hover:bg-gray-100" title="Refresh">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={handleStart}
            disabled={runner === 'RUNNING' || runner === 'CHECKING'}
            className="border bg-green-600 text-white px-3 h-9 rounded-md flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start Runner">
            <Play size={16} className="mr-2" />
            Start
          </button>

          <button
            onClick={handleStop}
            disabled={runner !== 'RUNNING'}
            className="border bg-red-600 text-white px-3 h-9 rounded-md flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Stop Runner">
            <Square size={16} className="mr-2" />
            Stop
          </button>
        </div>
      </div>

      {/* Runner not detected box */}
      {runner === 'NOT_DETECTED' && (
        <div className="mb-4 border border-red-200 bg-red-50 rounded-md p-3 text-sm text-red-800 flex items-start gap-2">
          <Download size={18} className="mt-[2px]" />
          <div>
            <div className="font-semibold">Runner not detected.</div>
            <div className="opacity-90">
              Please install/open the <b>NexoraX Runner</b> desktop app on this PC. Then click Refresh.
            </div>
          </div>
        </div>
      )}

      {/* ================= TABS ================= */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={['px-4 h-9 rounded-md text-sm font-semibold border transition', tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <div className="flex-1 min-h-0 border rounded-md overflow-hidden flex flex-col bg-white">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left w-[150px]">Common ID</th>
                <th className="px-3 py-2 text-left w-[100px]">Job Type</th>
                <th className="px-3 py-2 text-left">System Id</th>
                <th className="px-3 py-2 text-left">System Name</th>
                <th className="px-3 py-2 text-left w-[140px]">Status</th>
                <th className="px-3 py-2 text-left w-[120px]">Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingJobs ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : jobs?.length ? (
                jobs.map((j, idx) => {
                  const commonId = j.commonId || j.jobCommonId || j.jobId; // commonId fallback
                  return (
                    <tr key={j._id || commonId || idx} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{commonId || '—'}</td>
                      <td className="px-3 py-2">{j.jobType || '—'}</td>

                      <td className="px-3 py-2 break-all whitespace-normal max-w-[180px] sm:max-w-none">{j?.execution?.targetAgentId || '—'}</td>
                      <td className="px-3 py-2 break-all whitespace-normal max-w-[180px] sm:max-w-none">{j?.execution?.assignedAgentId || '—'}</td>

                      {/* ✅ status moved left of action */}
                      <td className="px-3 py-2">{statusBadge(j.status)}</td>

                      {/* ✅ action: view + delete */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {/* View */}
                          <button onClick={() => openDetails(j)} className="text-blue-600 hover:text-blue-800 transition" title="View Details">
                            <Eye size={18} />
                          </button>

                          {/* Delete */}
                          <button onClick={(e) => openDeleteConfirm(e, j)} className="text-red-600 hover:text-red-800 transition" title="Delete Job">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                    No {selectedTab.label.toLowerCase()} jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination (static like Users code) */}
        {totalCount > 0 && (
          <div
            id="jobs-pagination"
            className="shrink-0 border-t bg-white px-4 py-3 flex justify-between items-center text-sm text-gray-700 flex-wrap gap-3
                 sticky bottom-0">
            <div className="flex items-center gap-2">
              <label htmlFor="limit" className="text-gray-600">
                Rows per page:
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white">
                {[10, 20, 50, 100].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="whitespace-nowrap">
              Showing{' '}
              <strong>
                {startIndex}–{endIndex}
              </strong>{' '}
              of <strong>{totalCount}</strong> | Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50">
                First
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50">
                Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50">
                Next
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 bg-white hover:bg-gray-50">
                Last
              </button>
            </div>
          </div>
        )}
        {detailsOpen && (
          <div className="fixed inset-0 z-50">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />

            {/* modal */}
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Automation Job Details</div>
                    <div className="font-semibold text-gray-900 truncate">{selectedJob?.commonId || selectedJob?.jobCommonId || '—'}</div>

                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 border">{fmt(selectedJob?.jobType)}</span>
                      {statusBadge(selectedJob?.status)}
                      <span className="text-xs text-gray-500">Updated: {fmtDateTime(selectedJob?.progress?.lastUpdatedOn || selectedJob?.modifiedOn || selectedJob?.updatedAt)}</span>
                    </div>
                  </div>

                  <button onClick={closeDetails} className="p-2 border rounded-md hover:bg-gray-100 shrink-0" title="Close">
                    <X size={16} />
                  </button>
                </div>

                {/* content */}
                <div className="p-4 max-h-[75vh] overflow-auto space-y-4">
                  {/* Top cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-gray-500">Job ID</div>
                      <div className="font-semibold text-gray-900">{fmt(selectedJob?.jobId)}</div>
                      <div className="text-xs text-gray-500 mt-1">Stage</div>
                      <div className="text-sm font-medium">{fmt(selectedJob?.progress?.stage)}</div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-gray-500">Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-2 bg-blue-600" style={{ width: `${Math.min(100, Number(selectedJob?.progress?.percent || 0))}%` }} />
                        </div>
                        <div className="text-sm font-semibold w-12 text-right">{fmt(selectedJob?.progress?.percent)}%</div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">Message</div>
                      <div className="text-sm text-gray-800">{fmt(selectedJob?.progress?.message || selectedJob?.message)}</div>
                    </div>
                  </div>

                  {/* Execution */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold text-gray-800">Execution</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {/* ✅ System Id - full width */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">System Id</div>
                        <div className="font-medium break-all">{fmt(selectedJob?.execution?.assignedAgentId)}</div>
                        {/* System Name */}
                        <div>
                          <div className="text-xs text-gray-500">System Name</div>
                          <div className="font-medium">{fmt(selectedJob?.execution?.targetAgentId)}</div>
                        </div>
                      </div>

                      {/* Assigned On */}
                      <div>
                        <div className="text-xs text-gray-500">Assigned On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.execution?.assignedOn)}</div>
                      </div>

                      {/* Started → Ended */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">Started → Ended</div>
                        <div className="font-medium">
                          {fmtDateTime(selectedJob?.execution?.startedOn)} → {fmtDateTime(selectedJob?.execution?.endedOn)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input (masked) */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold text-gray-800">Input</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">PAN</div>
                        <div className="font-medium">{selectedJob?.input?.pan}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Assessment Year</div>
                        <div className="font-medium">{fmt(selectedJob?.input?.assessmentYear)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b text-sm font-semibold text-gray-800">Meta</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Requested By (cloudUserRef)</div>
                        <div className="font-medium">{fmt(selectedJob?.requestedBy?.cloudUserRef)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tenant Ref</div>
                        <div className="font-medium">{fmt(selectedJob?.requestedBy?.tenantRef)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Created On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.createdOn)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Modified On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.modifiedOn)}</div>
                      </div>
                      {selectedJob?.error ? (
                        <div className="md:col-span-2">
                          <div className="text-xs text-gray-500">Error</div>
                          <div className="font-medium text-red-700">{fmt(selectedJob?.error)}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* footer */}
                <div className="px-4 py-3 border-t bg-white flex justify-end">
                  <button onClick={closeDetails} className="px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-800">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {confirmTooltip.show && (
          <ConfirmTooltip
            x={confirmTooltip.x}
            y={confirmTooltip.y}
            message={`Are you sure you want to delete job #${confirmTooltip.commonId}?`}
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={() =>
              setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                commonId: null,
              })
            }
          />
        )}
      </div>
    </div>
  );
}
