import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { X, Folder, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  prepareAutomation,
  clearAutomationState,
  downloadAutomation,
  clearDownloadState,
} from '../../../redux/slices/professionalSlice/automation/automatioinSlice';
import { UAParser } from 'ua-parser-js';
import JSZip from 'jszip';
import { toast } from 'react-toastify';



const getOsInfo = () => {
  // Modern browsers (Chrome 89+)
  if (navigator.userAgentData?.platform) {
    const platform = navigator.userAgentData.platform.toLowerCase();

    if (platform.includes('win')) return { os: 'windows', name: 'Windows' };
    if (platform.includes('mac')) return { os: 'mac', name: 'Mac OS' };
    if (platform.includes('linux')) return { os: 'linux', name: 'Linux' };
  }

  // Fallback to UA-Parser
  const parser = new UAParser(navigator.userAgent);
  const result = parser.getResult();

  const osName = result.os.name?.toLowerCase() || '';

  let os = 'other';
  if (osName.includes('windows')) os = 'windows';
  else if (osName.includes('mac')) os = 'mac';
  else if (osName.includes('linux')) os = 'linux';
  else if (osName.includes('ios')) os = 'ios';
  else if (osName.includes('android')) os = 'windows';

  return {
    os,
    name: result.os.name,
    version: result.os.version,
    arch: result.cpu.architecture ?? 'unknown',
  };
};

export default function AutomationSetupModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();

  const osInfo = useMemo(() => getOsInfo(), []);
  const os = osInfo.os;
  console.log('os name for the backend ', os);
  const payload = useMemo(() => ({ os }), [os]);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null); // 0-100 or null
  const [dlError, setDlError] = useState(null);
  const [dlSuccess, setDlSuccess] = useState(false);

  const abortRef = useRef(null);
  const downloadExeDirect = () => {
    setDownloading(true);

    const a = document.createElement('a');
    a.href = 'https://nexorax.in/Runner.msi';
    a.setAttribute('download', 'Runner.msi');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Let animation run for 2 seconds for UX
    setTimeout(() => {
      setDownloading(false);
      setDlSuccess(true);

      toast.success('Installer download started. Run the setup after download completes.', {
        autoClose: 9000,
      });

      onSuccess?.();
      onClose?.('success');
    }, 2000);
  };

  const { prepare, download } = useSelector((s) => s.automation);
  const { status, message, error } = prepare;
  const downloadLoading = download?.loading;

  const running = downloading;

  // ✅ Refs for perfect alignment
  const animBoxRef = useRef(null);
  const sourceRef = useRef(null);
  const targetRef = useRef(null);

  const [pathD, setPathD] = useState('M 58 98 C 150 8, 270 8, 362 98'); // fallback
  const [viewBox, setViewBox] = useState('0 0 420 160');

 useEffect(() => {
   if (!open) return;

   downloadExeDirect();
 }, [open]);


  const handleDownload = async () => {
    const fileName = prepare?.data?.fileName;
    if (!fileName) return;

    try {
      const result = await dispatch(downloadAutomation({ fileName })).unwrap();
      const blob = result.data.blob; // original ZIP blob from API

      // ✅ Directly download original ZIP
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      dispatch(clearDownloadState());

      toast.success(`Downloaded: ${fileName}. Now extract the ZIP and run the script (e.g., setup.bat).`, { autoClose: 7000, pauseOnHover: true, closeOnClick: true });

      onSuccess?.();
      dispatch(clearAutomationState());
      onClose?.('success');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error(err?.message || 'Download failed. Please try again.', {
        autoClose: 6000,
      });
    }
  };

  const handleClose = () => {
    if (downloading) abortRef.current?.abort?.();
    onClose?.('cancel');
  };

  const handleRetry = () => {
    dispatch(clearAutomationState());
    dispatch(prepareAutomation(payload));
  };

  const uiMsg = downloading ? (progress != null ? `Downloading… ${progress}%` : 'Downloading…') : 'Ready.';

  const scriptNotFoundPath = error?.error?.path;

  // ✅ Measure and build path so file reaches target exactly
  const recomputePath = () => {
    const box = animBoxRef.current?.getBoundingClientRect();
    const s = sourceRef.current?.getBoundingClientRect();
    const t = targetRef.current?.getBoundingClientRect();
    if (!box || !s || !t) return;

    // centers relative to anim box
    const sx = s.left + s.width / 2 - box.left;
    const sy = s.top + s.height / 2 - box.top;
    const tx = t.left + t.width / 2 - box.left;
    const ty = t.top + t.height / 2 - box.top;

    // Control points for a nice arc
    const dx = Math.max(80, Math.abs(tx - sx) * 0.35);
    const c1x = sx + dx;
    const c1y = sy - 70;
    const c2x = tx - dx;
    const c2y = ty - 70;

    const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
    setPathD(d);

    // viewBox should match anim box size
    const vb = `0 0 ${Math.ceil(box.width)} ${Math.ceil(box.height)}`;
    setViewBox(vb);
  };

  useLayoutEffect(() => {
    if (!open) return;
    recomputePath();
    // Recompute on resize
    const onResize = () => recomputePath();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // also recompute when status changes (layout text could shift slightly)
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => recomputePath(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b">
            <div>
              <div className="font-semibold text-gray-900">Enable Automation</div>
              <div className="text-xs text-gray-500">OS detected: {os === 'windows' ? 'Windows' : os === 'mac' ? 'macOS' : 'Other'}</div>
            </div>

            <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50" onClick={handleClose} disabled={running}>
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              {status === 'running' && <Loader2 className="animate-spin" size={16} />}
              {status === 'success' && <CheckCircle2 className="text-green-600" size={16} />}
              {status === 'error' && <AlertCircle className="text-red-600" size={16} />}
              <span className="text-gray-700">{uiMsg}</span>
            </div>

            {status === 'error' && scriptNotFoundPath && (
              <div className="text-xs rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                <div className="font-semibold">Script not found</div>
                <div className="mt-1 break-all">{scriptNotFoundPath}</div>
              </div>
            )}

            {/* animation area */}
            <div ref={animBoxRef} className="rounded-2xl border border-gray-200 p-4 overflow-hidden relative bg-gradient-to-br from-blue-50 via-fuchsia-50 to-cyan-50">
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-blue-300/20 blur-2xl nx-blob" />
              <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-fuchsia-300/20 blur-2xl nx-blob2" />

              <div className="relative h-44">
                {/* left */}
                <div ref={sourceRef} className="absolute left-2 bottom-4 flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm flex items-center justify-center">
                    <Folder size={22} className="text-blue-700" />
                  </div>
                  <div className="text-[11px] text-gray-700">Source</div>
                </div>

                {/* right */}
                {/* ✅ give a tiny padding so it’s not stuck to edge */}
                <div ref={targetRef} className="absolute right-2 bottom-4 flex flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm flex items-center justify-center">
                    <Folder size={22} className="text-fuchsia-700" />
                  </div>
                  <div className="text-[11px] text-gray-700">Target</div>
                </div>

                {/* ✅ dynamic curve (visual path) */}
                <svg className="absolute inset-0" viewBox={viewBox} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="nxPathGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(37,99,235,0.7)" />
                      <stop offset="50%" stopColor="rgba(168,85,247,0.7)" />
                      <stop offset="100%" stopColor="rgba(6,182,212,0.7)" />
                    </linearGradient>

                    <filter id="nxGlow">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <path id="nxCurve" d={pathD} />
                  </defs>

                  <use href="#nxCurve" fill="none" stroke="url(#nxPathGrad)" strokeWidth="4" strokeLinecap="round" filter="url(#nxGlow)" opacity="0.55" />
                  <use href="#nxCurve" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 8" opacity="0.9" />
                </svg>

                {/* moving file */}
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className={['nx-flying-file', running ? 'nx-run' : 'nx-stop', status === 'success' ? 'opacity-80' : '', status === 'error' ? 'opacity-80' : ''].join(' ')}
                    style={{
                      offsetPath: `path("${pathD}")`, // ✅ IMPORTANT: dynamic motion path
                    }}>
                    <div className="nx-file-bubble">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="nx-trail" />
                  </div>
                </div>

                {/* {running && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-gray-700 flex items-center gap-1">
                    <Sparkles size={14} className="text-fuchsia-600" />
                    Moving files…
                  </div>
                )} */}
                {running && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-gray-700 flex items-center gap-1">
                    <Sparkles size={14} className="text-fuchsia-600" />
                    Downloading…
                  </div>
                )}
                {downloading && progress != null && (
                  <div className="mt-3 h-2 w-full rounded bg-white/60 overflow-hidden border border-white">
                    <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-700">{running ? 'Creating folders & syncing required files…' : status === 'success' ? 'Setup finished.' : status === 'error' ? 'Transfer stopped.' : null}</div>
            </div>
          </div>

          <div className="px-5 py-4 border-t flex justify-between items-center gap-2">
            <div className="flex gap-2">
              {status === 'error' && (
                <button onClick={handleRetry} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">
                  Retry
                </button>
              )}

              {status === 'success' && prepare?.data?.fileName && (
                <button
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className={['px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2', downloadLoading ? 'bg-green-500/70 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'].join(' ')}>
                  <span>{downloadLoading ? 'Downloading...' : 'Save & Download'}</span>

                  {/* ✅ right side loader */}
                  {downloadLoading && <Loader2 size={16} className="animate-spin" />}
                </button>
              )}

              <button onClick={handleClose} disabled={running} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                {running ? 'Working…' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nx-file-bubble{
          height: 44px;
          width: 44px;
          border-radius: 16px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: linear-gradient(135deg, rgba(37,99,235,0.95), rgba(168,85,247,0.95), rgba(6,182,212,0.95));
          box-shadow: 0 12px 30px rgba(59,130,246,0.25);
          border: 1px solid rgba(255,255,255,0.55);
          backdrop-filter: blur(6px);
          position: relative;
          z-index: 2;
        }

        .nx-trail{
          position:absolute;
          inset: 0;
          border-radius: 18px;
          filter: blur(10px);
          opacity: 0.65;
          background: linear-gradient(90deg, rgba(37,99,235,0.0), rgba(168,85,247,0.35), rgba(6,182,212,0.0));
          transform: scale(1.15);
          z-index: 1;
        }

        @keyframes nxBlob {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(14px,-10px) scale(1.08); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes nxBlob2 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-12px,10px) scale(1.06); }
          100% { transform: translate(0,0) scale(1); }
        }
        .nx-blob { animation: nxBlob 3.4s ease-in-out infinite; }
        .nx-blob2 { animation: nxBlob2 3.2s ease-in-out infinite; }

        .nx-flying-file{
          position:absolute;
          left: 0;
          top: 0;
          offset-rotate: 0deg;
          will-change: offset-distance, opacity, transform;
        }

        @keyframes nxFly {
          0%   { offset-distance: 0%;   opacity: 0; transform: scale(0.94); }
          6%   { offset-distance: 0%;   opacity: 1; transform: scale(0.94); }
          78%  { offset-distance: 100%; opacity: 1; transform: scale(0.94); }
          88%  { offset-distance: 100%; opacity: 1; transform: scale(0.94); }
          95%  { offset-distance: 100%; opacity: 0; transform: scale(0.94); }
          100% { offset-distance: 0%;   opacity: 0; transform: scale(0.94); }
        }

        .nx-run{ animation: nxFly 1.8s linear infinite; }
        .nx-stop{ animation: none; }

        @media (prefers-reduced-motion: reduce) {
          .nx-run{ animation: none; }
          .nx-blob, .nx-blob2{ animation: none; }
        }
      `}</style>
    </div>
  );
}
