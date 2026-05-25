import React, { useMemo, useRef, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { BeatLoader } from 'react-spinners';
import { useDispatch, useSelector } from 'react-redux';

import { getPreFillTaxPayers } from '../../../../redux/slices/professionalSlice/preFillTaxPayers/preFillTaxPayersSlice';
import { runAutomationAis, getJobQueueAutomationByCommonId } from '../../../../redux/slices/professionalSlice/automation/automatioinSlice';
import { getTaxPayerDetails } from '../../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';
import { useNavigate } from 'react-router-dom';
import { ensureAppSettings, ensureRunnerRunning } from '../../../../services/ensureRunnerRunning';
import { runnerService } from '../../../../services/runnerService';
import { getProfessionalHeader, makeJobId } from '../AISTISForm26PayloadBuilder';

const AddExistingTaxpayerModal = ({ onClose, onSave }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ If FY already in parent state, you can pass it as prop instead.
  // Here I’m taking it from your dropdown list selection (replace with your real store path).
  const { assessmentYears } = useSelector((s) => s.alldropdown);
  const fy = assessmentYears?.find((x) => x.status === 'active')?.assessmentYear || '2025-2026';

  const [pan, setPan] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const aliveRef = useRef(true);

  const panRegex = useMemo(() => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, []);

  const panError = useMemo(() => {
    if (!pan) return '';
    if (pan.length !== 10) return 'PAN must be 10 characters.';
    if (!panRegex.test(pan)) return 'Enter a valid PAN (e.g. ABCDE1234F).';
    return '';
  }, [pan, panRegex]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }, [password]);

  const canSubmit = useMemo(() => {
    return pan && password && consent && !panError && !passwordError && !loading;
  }, [pan, password, consent, panError, passwordError, loading]);

  const makePrefillFileName = (p) => `${String(p || '').toUpperCase()}_Prefill.json`;

  const isNotFound = (err) => {
    const status = err?.status || err?.response?.status;
    const msg = String(err?.message || err?.response?.data?.message || '').toLowerCase();
    return status === 404 || msg.includes('not found') || msg.includes('no file') || msg.includes('no data');
  };

  // ✅ Taxpayer exists check using dispatch(getTaxPayerDetails)
  const checkTaxpayerExistsByPan = async (panValue) => {
    try {
      const full = await dispatch(getTaxPayerDetails(panValue)).unwrap();
      // If unwrap succeeded and returns object => exists
      return !!full;
    } catch (err) {
      // If your API throws 404 when not found => treat as NOT existing
      if (isNotFound(err)) return false;
      // else real error
      throw err;
    }
  };

  // ✅ Prefill payload builder (separate from AIS builder)
  const buildPrefillJobQueuePayload = ({ panValue, itlPassword, machineInfo }) => {
    const Authtoken = getProfessionalHeader('authtoken');
    const LoginUser = getProfessionalHeader('loginuser');
    const parent = getProfessionalHeader('x-db-name');

    return {
      jobId: makeJobId('PREFILL'),
      jobType: 'PREFILL',
      status: 'PENDING',
      input: {
        pan: panValue,
        password: String(itlPassword || '').trim(),
        taxPayerPWD: null,
        assessmentYear: '2024-25',
        authToken: Authtoken,
      },
      requestedBy: {
        cloudUserRef: LoginUser,
        tenantRef: LoginUser,
      },
      execution: {
        targetAgentId: machineInfo?.machineId || parent,
        assignedAgentId: machineInfo?.hostname || null,
        assignedOn: null,
        startedOn: null,
        endedOn: null,
      },
      progress: {
        stage: 'QUEUED',
        percent: 0,
        message: 'Waiting for client runner',
        lastUpdatedOn: new Date().toISOString(),
      },
      error: null,
      createdOn: new Date().toISOString(),
      createdBy: LoginUser,
      modifiedOn: new Date().toISOString(),
      modifiedBy: LoginUser,
    };
  };
  const fetchAndOpenPrefill = async (panArg, fileNameArg, itlPasswordArg) => {
    try {
      const finalPan =
        String(panArg || pan || '')
          .toUpperCase()
          .trim();

      if (!finalPan) {
        toast.error('PAN missing');
        return;
      }

      const finalPwd = String(itlPasswordArg || password || '').trim();

      const finalFileName =
        fileNameArg || makePrefillFileName(finalPan);

      const prefillRes = await dispatch(
        getPreFillTaxPayers(finalFileName)
      ).unwrap();

      toast.success('Prefill data loaded');

      onSave?.({
      pan: finalPan,
      password: finalPwd,
      consent,
      fileName: finalFileName,
      prefillRes,
      source: 'PREFILL_FETCH',
    });

      onClose?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to load Prefill JSON');
    }
  };
  const pollPrefillJobStatus = async (commonId, panValue, fileName, itlPassword) => {
    const MAX_TRIES = 60;
    const INTERVAL = 5000;

    let tries = 0;

    while (tries < MAX_TRIES) {
      tries++;

      try {
        const res = await dispatch(getJobQueueAutomationByCommonId({ commonId })).unwrap();
        const job = res?.data;

        if (!job) throw new Error('Invalid job response');

        const status = job.status;

        if (status === 'FAILED') {
          toast.error('Prefill automation failed');
          return;
        }

        if (status === 'COMPLETED') {
          toast.success('Prefill automation completed!');

          // ✅ fetch prefill and open next modal via onSave
          await fetchAndOpenPrefill(panValue, fileName, itlPassword);
          return;
        }

        await new Promise((r) => setTimeout(r, INTERVAL));
      } catch (err) {
        toast.error(err?.message || 'Job status check failed');
        return;
      }
    }

    toast.error('Job timeout. Please try again.');
  };
  const runPrefillAutomationNow = async ({ panValue, itlPassword, machineInfo, fileName }) => {
    const payload = buildPrefillJobQueuePayload({ panValue, itlPassword, machineInfo });

    if (!payload?.input?.pan) throw new Error('PAN missing');
    if (!payload?.input?.password) throw new Error('Password missing');
    if (!payload?.input?.authToken) throw new Error('Missing AuthToken');

    const res = await dispatch(runAutomationAis(payload)).unwrap();
    const commonId = res?.data?.commonId;

    if (!commonId) throw new Error('Job ID not received');

    toast.success('Prefill job started');

    // ✅ Start polling with required args
    await pollPrefillJobStatus(commonId, panValue, fileName, itlPassword);

    return commonId;
  };

  const isAutomationEnabledLocal = () => localStorage.getItem('nx_enable_automation') === 'true';

  const handleSubmit = async () => {
    console.log('im in submit ');
    if (!pan) return toast.error('PAN is required');
    if (panError) return toast.error(panError);
    if (!password) return toast.error('Password is required');
    if (passwordError) return toast.error(passwordError);
    if (!consent) return toast.error('Please provide consent to proceed');

    const cleanPan = String(pan || '')
      .toUpperCase()
      .trim();
    const cleanPwd = String(password || '').trim();
    const fileName = makePrefillFileName(cleanPan);
    console.log('fileName of the prefilled ', fileName);
    try {
      setLoading(true);

      // 1) taxpayer exists?
      const exists = await checkTaxpayerExistsByPan(cleanPan);

      if (exists) {
        toast.info('Taxpayer already exists');
        return;
      }

      // 2) prefill exists?
      try {
        const prefillRes = await dispatch(getPreFillTaxPayers(fileName)).unwrap();
        toast.info('Prefill already exists');

        // ✅ send to parent so parent opens AddNewTaxpayerModal
        onSave?.({
          pan: cleanPan,
          password: cleanPwd,
          consent,
          fileName,
          prefillRes, // send full response
        });

        onClose?.();
        return;
      } catch (err) {
        if (!isNotFound(err)) {
          toast.error(err?.message || 'Prefill check failed');
          return;
        }
      }

      // 3) run automation
      if (!isAutomationEnabledLocal()) {
        toast.error('Please enable Automation by navigating in Settings tab', {
          autoClose: 5000,
        });
        navigate('/professional/configuration');
        return;
      }

      // ✅ Ensure appsettings.json exists
      const cfg = await ensureAppSettings();
      if (!cfg.ok) {
        toast.error('Runner is may not started for appsettings. Please install/open NexoraX Runner.');
        return;
      }

      // // ✅ Ensure runner running first
      const rr = await ensureRunnerRunning();
      if (!rr.ok) {
        if (rr.status === 'NOT_DETECTED') {
          toast.error('Runner not detected. Please install/open NexoraX Runner.');
        } else {
          toast.error('Runner could not be started. Please open NexoraX Runner and try again.');
        }
        return;
      }

      let machineInfo = null;
      try {
        const mi = await runnerService.getMachineInfo();
        machineInfo = mi?.data || null;
      } catch {
        toast.error('Unable to get Runner machine info');
        return;
      }

      toast.info('Starting Prefill automation…');

      await runPrefillAutomationNow({
        panValue: cleanPan,
        itlPassword: cleanPwd,
        machineInfo,
      });

      // 4) fetch prefill after completed
      const prefillRes2 = await dispatch(getPreFillTaxPayers(fileName)).unwrap();

      toast.success('Prefill ready');

      if (!aliveRef.current) return;

      onSave?.({
        pan: cleanPan,
        password: cleanPwd,
        consent,
        fileName,
        prefillJson: prefillRes2,
        source: 'AUTOMATION_PREFILL',
      });

      onClose?.();
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-3 z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-xl p-6 relative">
        <button
          onClick={() => {
            aliveRef.current = false;
            onClose?.();
          }}
          className="absolute right-3 top-3 text-gray-600 hover:text-black"
          aria-label="Close"
          disabled={loading}>
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-1">Add Existing Taxpayer</h2>
        <p className="text-sm text-gray-500 mb-5">Enter PAN and password, then provide consent to download your data.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700">PAN</label>
            <input
              maxLength={10}
              className={`border rounded-md px-3 py-2 w-full outline-none focus:ring-2 focus:ring-blue-200 ${panError ? 'border-red-400' : 'border-gray-300'}`}
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="ABCDE1234F"
              inputMode="text"
              autoComplete="off"
              disabled={loading}
            />
            {!!panError && <p className="text-xs text-red-500 mt-1">{panError}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Password</label>
            <div className={`flex items-center border rounded-md px-3 py-2 w-full focus-within:ring-2 focus-within:ring-blue-200 ${passwordError ? 'border-red-400' : 'border-gray-300'}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="taxpayer-password"
                autoComplete="new-password"
                className="w-full outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-gray-500 hover:text-gray-700 ml-2" aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={loading}>
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {!!passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={loading} />
            <span className="text-sm text-gray-700">I consent to download my taxpayer data and save.</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`py-2 h-[42px] rounded-md mt-1 flex justify-center items-center ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-200 text-white cursor-not-allowed'}`}>
            {loading ? <BeatLoader size={8} color="#ffffff" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExistingTaxpayerModal;
