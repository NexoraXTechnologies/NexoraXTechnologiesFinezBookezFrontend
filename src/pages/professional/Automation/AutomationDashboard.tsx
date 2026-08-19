import { useEffect, useMemo, useState } from 'react';
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
  const [selectedJob, setSelectedJob]: any = useState(null);
  const openDetails = (job: any) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedJob(null);
  };
  const dispatch = useDispatch();
  const [confirmTooltip, setConfirmTooltip]: any = useState({
    show: false,
    x: null,
    y: null,
    commonId: null,
  });

  const fmt = (v: any) => (v === null || v === undefined || v === '' ? '—' : String(v));

  const fmtDateTime = (v: any) => {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  // const mask = (val, showStart = 3, showEnd = 2) => {
  //   const s = String(val ?? '');
  //   if (!s) return '—';
  //   if (s.length <= showStart + showEnd) return '•'.repeat(s.length);
  //   return `${s.slice(0, showStart)}${'•'.repeat(Math.max(4, s.length - (showStart + showEnd)))}${s.slice(-showEnd)}`;
  // };

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

  // const getProfessionalHeader = (key:any) => {
  //   const data = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');
  //   return data?.[key] ?? '';
  // };

  // const Authtoken = getProfessionalHeader('authtoken');
  // const LoginUser = getProfessionalHeader('loginuser');
  // const parent = getProfessionalHeader('x-db-name');

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
  const openDeleteConfirm = (e: any, job: any) => {
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
      // @ts-ignore
      await dispatch(deleteJobQueueAutomationByCommonId({ commonId: confirmTooltip.commonId })).unwrap();
      toast.success('Job deleted successfully');

      // ✅ refresh list (recommended so pagination counts stay correct)
      await loadJobs();
    } catch (err: any) {
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
      return <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">CHECKING…</span>;
    }
    if (runner === 'RUNNING') {
      return <span className="rounded-full border border-success/20 bg-success/10 px-2 py-1 text-xs font-semibold text-success">RUNNING</span>;
    }
    if (runner === 'STOPPED') {
      return <span className="rounded-full border border-warning/20 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">STOPPED</span>;
    }
    if (runner === 'NOT_DETECTED') {
      return <span className="rounded-full border border-danger/20 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">NOT DETECTED</span>;
    }
    return <span className="rounded-full border border-border bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground">{runner}</span>;
  };

  const statusBadge = (status: any) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED') return <span className="rounded-full border border-success/20 bg-success/10 px-2 py-1 text-xs font-semibold text-success">COMPLETED</span>;
    if (s === 'IN_PROGRESS') return <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">IN PROGRESS</span>;
    if (s === 'PENDING') return <span className="rounded-full border border-warning/20 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">PENDING</span>;
    if (s === 'FAILED' || s === 'ERROR') return <span className="rounded-full border border-danger/20 bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">{s}</span>;
    return <span className="rounded-full border border-border bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground">{s || '—'}</span>;
  };

  // ✅ variables for pagination block (same as Users)
  const totalCount = pagination?.totalDocs || 0;
  const totalPages = pagination?.totalPages || 1;

  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(page * limit, totalCount);

  return (
    <div className="flex h-full min-h-0 w-full flex-col  border border-border bg-card p-4 text-card-foreground shadow-sm">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 mb-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 py-1">
            <Laptop size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Runner</span>
            {runnerPill()}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleRefresh} className="flex h-9 items-center rounded-md border border-border px-3 text-foreground transition hover:bg-muted" title="Refresh">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-primary' : ''} />
          </button>

          <button
            onClick={handleStart}
            disabled={runner === 'RUNNING' || runner === 'CHECKING'}
            className="flex h-9 items-center justify-center rounded-md border border-success bg-success px-3 text-white transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
            title="Start Runner">
            <Play size={16} className="mr-2" />
            Start
          </button>

          <button
            onClick={handleStop}
            disabled={runner !== 'RUNNING'}
            className="flex h-9 items-center justify-center rounded-md border border-danger bg-danger px-3 text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
            title="Stop Runner">
            <Square size={16} className="mr-2" />
            Stop
          </button>
        </div>
      </div>

      {/* Runner not detected box */}
      {runner === 'NOT_DETECTED' && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
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
            className={['px-4 h-9 rounded-md text-sm font-semibold border transition', tab === t.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm text-foreground">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted">
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
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : jobs?.length ? (
                  jobs.map((j: any, idx: any) => {
                  const commonId = j.commonId || j.jobCommonId || j.jobId; // commonId fallback
                  return (
                    <tr key={j._id || commonId || idx} className="border-b border-border transition hover:bg-muted/50">
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
                          <button onClick={() => openDetails(j)} className="text-primary transition hover:text-primary/80" title="View Details">
                            <Eye size={18} />
                          </button>

                          {/* Delete */}
                          <button onClick={(e) => openDeleteConfirm(e, j)} className="text-danger transition hover:text-danger/80" title="Delete Job">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center italic text-muted-foreground">
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
            className="sticky bottom-0 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 text-sm text-foreground">
            <div className="flex items-center gap-2">
              <label htmlFor="limit" className="text-muted-foreground">
                Rows per page:
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground">
                {[10, 20, 50, 100].map((v) => (
                  <option key={v} value={v} className="bg-card text-card-foreground">
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
              <button onClick={() => setPage(1)} disabled={page === 1} className="rounded-md border border-border bg-card px-3 py-1 text-foreground transition hover:bg-muted disabled:opacity-50">
                First
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border bg-card px-3 py-1 text-foreground transition hover:bg-muted disabled:opacity-50">
                Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="rounded-md border border-border bg-card px-3 py-1 text-foreground transition hover:bg-muted disabled:opacity-50">
                Next
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded-md border border-border bg-card px-3 py-1 text-foreground transition hover:bg-muted disabled:opacity-50">
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
              <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl">
                {/* header */}
                <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground">Automation Job Details</div>
                    <div className="truncate font-semibold text-foreground">{selectedJob?.commonId || selectedJob?.jobCommonId || '—'}</div>

                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{fmt(selectedJob?.jobType)}</span>
                      {statusBadge(selectedJob?.status)}
                      <span className="text-xs text-muted-foreground">Updated: {fmtDateTime(selectedJob?.progress?.lastUpdatedOn || selectedJob?.modifiedOn || selectedJob?.updatedAt)}</span>
                    </div>
                  </div>

                  <button onClick={closeDetails} className="shrink-0 rounded-md border border-border p-2 text-foreground transition hover:bg-muted" title="Close">
                    <X size={16} />
                  </button>
                </div>

                {/* content */}
                <div className="p-4 max-h-[75vh] overflow-auto space-y-4">
                  {/* Top cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Job ID</div>
                      <div className="font-semibold text-gray-900">{fmt(selectedJob?.jobId)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Stage</div>
                      <div className="text-sm font-medium">{fmt(selectedJob?.progress?.stage)}</div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Progress</div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-2 bg-primary" style={{ width: `${Math.min(100, Number(selectedJob?.progress?.percent || 0))}%` }} />
                        </div>
                        <div className="text-sm font-semibold w-12 text-right">{fmt(selectedJob?.progress?.percent)}%</div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">Message</div>
                      <div className="text-sm text-foreground">{fmt(selectedJob?.progress?.message || selectedJob?.message)}</div>
                    </div>
                  </div>

                  {/* Execution */}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground">Execution</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {/* ✅ System Id - full width */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">System Id</div>
                        <div className="font-medium break-all">{fmt(selectedJob?.execution?.assignedAgentId)}</div>
                        {/* System Name */}
                        <div>
                          <div className="text-xs text-muted-foreground">System Name</div>
                          <div className="font-medium">{fmt(selectedJob?.execution?.targetAgentId)}</div>
                        </div>
                      </div>

                      {/* Assigned On */}
                      <div>
                        <div className="text-xs text-muted-foreground">Assigned On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.execution?.assignedOn)}</div>
                      </div>

                      {/* Started → Ended */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-muted-foreground">Started → Ended</div>
                        <div className="font-medium">
                          {fmtDateTime(selectedJob?.execution?.startedOn)} → {fmtDateTime(selectedJob?.execution?.endedOn)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input (masked) */}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground">Input</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">PAN</div>
                        <div className="font-medium">{selectedJob?.input?.pan}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Assessment Year</div>
                        <div className="font-medium">{fmt(selectedJob?.input?.assessmentYear)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground">Meta</div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Requested By (cloudUserRef)</div>
                        <div className="font-medium">{fmt(selectedJob?.requestedBy?.cloudUserRef)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tenant Ref</div>
                        <div className="font-medium">{fmt(selectedJob?.requestedBy?.tenantRef)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Created On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.createdOn)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Modified On</div>
                        <div className="font-medium">{fmtDateTime(selectedJob?.modifiedOn)}</div>
                      </div>
                      {selectedJob?.error ? (
                        <div className="md:col-span-2">
                          <div className="text-xs text-muted-foreground">Error</div>
                          <div className="font-medium text-danger">{fmt(selectedJob?.error)}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* footer */}
                <div className="flex justify-end border-t border-border bg-card px-4 py-3">
                  <button onClick={closeDetails} className="rounded-md border border-primary bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90">
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