import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { getAllTaxPayers } from '../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';
import {
  resetItrPassword,
  verifyResetItrPasswordOtp,
  startResetPasswordAutomation,
  fetchResetPasswordStatusById,
  deleteResetPasswordJobById,
  resetResetItrPasswordState,
} from '../../../redux/slices/professionalSlice/resetitrpassword/resetItrPasswordSlice';

import { FaEye, FaEyeSlash } from 'react-icons/fa';

/* ===================================================
   CONSTANTS
=================================================== */
const OTP_LEN = 6;
const OTP_MAX_WRONG = 3;
const OTP_MAX_SENDS = 4;

const STATUS_POLL_MS = 2500;
const BG_STATUS_WHILE_OTP_MS = 3000;
const POLL_MAX_ROUNDS = 300;
const DELAY_AFTER_RESETPWD_MS = 1000;

const SPECIAL_RE = /[!@#$%^&*()_\-+=[\]{}|;:,.<>?/~`]/;

const RATE_KEY_DAY = 'ResetITR.rate.day';
const RATE_KEY_COUNT = 'ResetITR.rate.count';
const RATE_KEY_LAST_SESSION_END_MS = 'ResetITR.rate.lastSessionEndMs';

const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS_PER_DAY = 3;

/* ===================================================
   HELPERS
=================================================== */
function nextLocalMidnightMs() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatDurationCountdown(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function readLimiterState() {
  const today = new Date().toISOString().slice(0, 10);
  const storedDay = localStorage.getItem(RATE_KEY_DAY);
  let count = parseInt(localStorage.getItem(RATE_KEY_COUNT), 10) || 0;

  if (storedDay !== today) count = 0;

  const lastSessionEndMs = parseInt(localStorage.getItem(RATE_KEY_LAST_SESSION_END_MS), 10) || 0;

  return { count, today, lastSessionEndMs };
}

async function recordResetAttempt() {
  const today = new Date().toISOString().slice(0, 10);
  const s = await readLimiterState();
  const nextCount = s.today === today ? s.count + 1 : 1;

  localStorage.setItem(RATE_KEY_DAY, today);
  localStorage.setItem(RATE_KEY_COUNT, String(nextCount));
}

async function recordSessionEnd() {
  localStorage.setItem(RATE_KEY_LAST_SESSION_END_MS, String(Date.now()));
}

function evaluateLimiter(s) {
  const now = Date.now();

  if (s.count >= MAX_ATTEMPTS_PER_DAY) {
    const dailyResetAtMs = nextLocalMidnightMs();
    const secsUntilReset = Math.max(0, (dailyResetAtMs - now) / 1000);

    return {
      ok: false,
      message: 'Daily reset limit reached. Please try again tomorrow.',
      kind: 'daily',
      dailyResetAtMs,
      dailySecsRemaining: secsUntilReset,
    };
  }

  const lastEnd = s.lastSessionEndMs || 0;
  if (lastEnd > 0 && now - lastEnd < COOLDOWN_MS) {
    const cooldownEndsAtMs = lastEnd + COOLDOWN_MS;
    const secsLeft = Math.max(0, (cooldownEndsAtMs - now) / 1000);

    return {
      ok: false,
      message: 'Please wait before trying again.',
      kind: 'cooldown',
      cooldownEndsAtMs,
      cooldownSecsRemaining: secsLeft,
    };
  }

  return { ok: true, message: '', kind: 'ok' };
}

function checkPasswordRules(pwd) {
  const lenOk = pwd.length >= 8 && pwd.length <= 15;

  return {
    lenOk,
    upperOk: /[A-Z]/.test(pwd),
    lowerOk: /[a-z]/.test(pwd),
    digitOk: /\d/.test(pwd),
    specialOk: SPECIAL_RE.test(pwd),
    allOk: lenOk && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && SPECIAL_RE.test(pwd),
  };
}

function getPasswordStrength(pwd, r) {
  if (!pwd?.length) return { level: 'none', label: '' };

  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (r.upperOk) score += 1;
  if (r.lowerOk) score += 1;
  if (r.digitOk) score += 1;
  if (r.specialOk) score += 1;

  if (r.allOk) return { level: 'strong', label: 'Strong' };
  if (score <= 2) return { level: 'weak', label: 'Weak' };
  if (score <= 4) return { level: 'medium', label: 'Medium' };
  return { level: 'strong', label: 'Strong' };
}

function extractMessage(obj) {
  if (!obj || typeof obj !== 'object') return String(obj ?? '');
  return String(obj.message ?? obj.Message ?? obj.msg ?? obj.data?.message ?? obj.body ?? '');
}

function pickResetPwdOtpField(data, key) {
  if (!data || typeof data !== 'object') return undefined;
  if (data[key] !== undefined) return data[key];

  const inner = data.data;
  if (inner && typeof inner === 'object' && inner[key] !== undefined) {
    return inner[key];
  }
  return undefined;
}

function extractResetPwdOtpErrorText(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();

  const inner = data.data;
  if (inner && typeof inner === 'object' && typeof inner.error === 'string') {
    return inner.error.trim();
  }

  if (data.error && typeof data.error === 'object') {
    const keys = Object.keys(data.error);
    if (keys.length) {
      const v = data.error[keys[0]];
      if (typeof v === 'string') return v;
    }
  }

  const m = extractMessage(data);
  return m && String(m).trim() ? String(m).trim() : '';
}

function isResetPwdOtpSuccessResponse(data) {
  if (data == null || typeof data !== 'object') return false;

  const success = pickResetPwdOtpField(data, 'success');
  const status = pickResetPwdOtpField(data, 'status');
  const result = pickResetPwdOtpField(data, 'result');
  const verified = pickResetPwdOtpField(data, 'verified');
  const valid = pickResetPwdOtpField(data, 'valid');
  const code = pickResetPwdOtpField(data, 'code');

  if (success === false) return false;
  if (status === false || status === 'error' || status === 'failed') return false;
  if (result === false || result === 0 || result === '0') return false;
  if (verified === false || valid === false) return false;

  if (code !== undefined && code !== null) {
    if (code === 400 || code === 401 || code === 422 || code === '400' || code === '401') {
      return false;
    }
  }

  if (success === true) return true;
  if (status === true || status === 'success' || status === 'ok') return true;
  if (result === true || result === 1 || result === '1') return true;
  if (verified === true || valid === true) return true;
  if (code === 200 || code === 0 || code === '200' || code === '0') return true;

  const errStr = typeof data.error === 'string' ? data.error.trim() : typeof data.data?.error === 'string' ? data.data.error.trim() : '';

  if (errStr && success !== true) return false;

  const msg = String(extractMessage(data) || '').toLowerCase();
  if (!msg.trim()) return false;

  if ((msg.includes('invalid') && msg.includes('otp')) || (msg.includes('wrong') && msg.includes('otp')) || msg.includes('incorrect otp') || msg.includes('otp mismatch') || (msg.includes('verification') && msg.includes('fail'))) {
    return false;
  }

  const looksLikeFailure = /\b(fail|failed|failure|unable|error|invalid|incorrect|wrong|reject|rejected)\b/.test(msg);

  if (looksLikeFailure && (msg.includes('otp') || msg.includes('password') || msg.includes('reset') || msg.includes('verify'))) {
    return false;
  }

  if (
    msg.includes('success') ||
    msg.includes('updated') ||
    (msg.includes('complete') && !msg.includes('incomplete')) ||
    (msg.includes('password') && (msg.includes('reset') || msg.includes('update') || msg.includes('saved')) && !looksLikeFailure)
  ) {
    return true;
  }

  return false;
}

function textSuggestsAadhaarOtpStep(s) {
  const t = String(s ?? '').toLowerCase();
  if (!t) return false;
  if (t.includes('aadhaar') && t.includes('otp')) return true;
  return false;
}

function statusIndicatesAadhaarOtpRequested(data) {
  const stage = data?.currentStage;
  const stageMsg = String(stage?.message ?? '').toLowerCase();

  if (stageMsg.includes('aadhaar otp requested')) return true;
  if (stageMsg.includes('aadhaar') && stageMsg.includes('otp') && (stageMsg.includes('request') || stageMsg.includes('required'))) {
    return true;
  }

  if (textSuggestsAadhaarOtpStep(stage?.code)) return true;
  if (textSuggestsAadhaarOtpStep(stage?.label)) return true;

  const blob = JSON.stringify(data ?? '').toLowerCase();
  if (blob.includes('aadhaar otp requested')) return true;
  if (blob.includes('aadhaar otp selected')) return true;

  return false;
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'SUCCEEDED', 'ERROR', 'CANCELLED']);

function isTerminalAutomationStatus(data) {
  const st = String(data?.status ?? '')
    .toUpperCase()
    .trim();
  if (TERMINAL_STATUSES.has(st)) return true;

  const err = data?.error;
  if (err != null && String(err).trim() !== '') return true;

  return false;
}

function isTerminalAutomationStatusAfterOtp(data) {
  const st = String(data?.status ?? '')
    .toUpperCase()
    .trim();
  if (st === 'SUCCESS' || st === 'DONE' || st === 'COMPLETE') return true;
  return isTerminalAutomationStatus(data);
}

function automationPasswordUpdatedMessageSeen(data) {
  const blob = JSON.stringify(data ?? '').toLowerCase();
  const normalized = blob.replace(/[^a-z0-9]+/g, ' ');
  return normalized.includes('password updated successfully');
}

function isAutomationTerminalFailure(data) {
  if (!data || typeof data !== 'object') return false;

  const st = String(data.status ?? '')
    .toUpperCase()
    .trim();
  if (data.error != null && String(data.error).trim() !== '') return true;
  if (st === 'FAILED' || st === 'ERROR' || st === 'CANCELLED') return true;

  return false;
}

function getAutomationDisplayLines(data) {
  if (!data || typeof data !== 'object') {
    return { primary: '', secondary: '', progress: 0 };
  }

  const stage = data.currentStage;
  const primary = (stage?.message && String(stage.message).trim()) || (data.message && String(data.message).trim()) || (stage?.label && String(stage.label).trim()) || (stage?.code && String(stage.code).trim()) || '';

  const secondary = stage?.label && stage?.message && String(stage.label) !== String(stage.message) ? String(stage.label).trim() : '';

  const progress = typeof data.progress === 'number' ? data.progress : Number(data.progress) || 0;

  return { primary, secondary, progress };
}

function formatAutomationStatusForUser(data) {
  if (!data || typeof data !== 'object') {
    return String(data ?? 'Unknown response');
  }

  const lines = [];
  if (data.status != null && String(data.status).trim() !== '') {
    lines.push(`Status: ${data.status}`);
  }
  if (data.error != null && String(data.error).trim() !== '') {
    lines.push(`Error: ${data.error}`);
  }

  const stage = data.currentStage;
  if (stage?.message && String(stage.message).trim()) {
    lines.push(String(stage.message).trim());
  } else if (stage?.label && String(stage.label).trim()) {
    lines.push(String(stage.label).trim());
  } else if (stage?.code && String(stage.code).trim()) {
    lines.push(String(stage.code).trim());
  }

  const extra = extractMessage(data);
  if (extra && String(extra).trim() && !lines.some((l) => l.includes(extra))) {
    lines.push(String(extra).trim());
  }

  return lines.length ? lines.join('\n') : JSON.stringify(data);
}
function getProfessionalHeader(key) {
  const data = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');
  return data?.[key] ?? '';
}
function isLikelyWrongOtpError(message) {
  const m = String(message || '')
    .toLowerCase()
    .trim();
  if (!m) return false;

  if (m.includes('network') || m.includes('internet') || m.includes('timeout')) {
    return false;
  }

  if (m.includes('wrong') && m.includes('otp')) return true;
  if (m.includes('invalid') && m.includes('otp')) return true;
  if (m.includes('incorrect') && m.includes('otp')) return true;
  if (m.includes('invalid otp')) return true;
  if (m.includes('wrong otp')) return true;

  if (m.includes('otp') && (m.includes('mismatch') || m.includes('not match'))) {
    return true;
  }

  if (/(invalid|incorrect|wrong).{0,24}otp|otp.{0,24}(invalid|incorrect|wrong)/.test(m)) {
    return true;
  }

  if (m.includes('otp') && (m.includes('not valid') || m.includes('not correct'))) {
    return true;
  }

  return false;
}

/* ===================================================
   COMPONENT
=================================================== */
const ResetItrPasswordWeb = () => {
  const dispatch = useDispatch();

  const taxpayersState = useSelector((s) => s.taxpayer || {});
  const taxpayers = taxpayersState?.taxpayers || taxpayersState?.items || [];

  const resetState = useSelector((state) => state?.resetItrPassword || {});

  const [selectedPAN, setSelectedPAN] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [dob, setDob] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);

  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(''));
  const otpDigitsRef = useRef(otpDigits);
  const otpRefs = useRef([]);

  const [otpSent, setOtpSent] = useState(false);
  const [otpSendCount, setOtpSendCount] = useState(0);
  const [otpWrongAttempts, setOtpWrongAttempts] = useState(0);

  const [busySend, setBusySend] = useState(false);
  const [busyAutomation, setBusyAutomation] = useState(false);
  const [busyVerify, setBusyVerify] = useState(false);
  const [busyPostOtpStatus, setBusyPostOtpStatus] = useState(false);

  const [statusSnapshot, setStatusSnapshot] = useState(null);
  const [automationRunId, setAutomationRunId] = useState(null);
  const [automationCheckStatus, setAutomationCheckStatus] = useState(null);
  const [verifyFlowSuccess, setVerifyFlowSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [limiterGate, setLimiterGate] = useState({
    ok: true,
    message: '',
    kind: 'ok',
  });

  const pollTokenRef = useRef(0);

  useEffect(() => {
    otpDigitsRef.current = otpDigits;
  }, [otpDigits]);

  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', limit: 500, page: 1 }));
  }, [dispatch]);

  const refreshLimiter = useCallback(async () => {
    const s = await readLimiterState();
    const gate = evaluateLimiter(s);
    setLimiterGate(gate);
  }, []);

  useEffect(() => {
    refreshLimiter();
  }, [refreshLimiter]);

  useEffect(() => {
    if (limiterGate?.ok) return undefined;

    const id = setInterval(() => {
      refreshLimiter();
    }, 1000);

    return () => clearInterval(id);
  }, [limiterGate?.ok, refreshLimiter]);

  useEffect(() => {
    return () => {
      pollTokenRef.current += 1;
      dispatch(resetResetItrPasswordState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!otpSent || !automationRunId) return undefined;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;

      try {
        const data = await dispatch(fetchResetPasswordStatusById(automationRunId)).unwrap();
        if (cancelled) return;

        setStatusSnapshot(data);

        const st = String(data?.status ?? '')
          .toUpperCase()
          .trim();
        if (TERMINAL_STATUSES.has(st) || (data?.error != null && String(data.error).trim() !== '')) {
          cancelled = true;
          clearInterval(intervalId);
        }
      } catch (e) {
        // background poll fail silently
      }
    };

    const intervalId = setInterval(tick, BG_STATUS_WHILE_OTP_MS);
    tick();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [otpSent, automationRunId, dispatch]);

  const rules = useMemo(() => checkPasswordRules(newPassword), [newPassword]);
  const strength = useMemo(() => getPasswordStrength(newPassword, rules), [newPassword, rules]);
  const matchOk = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const getSelectedTaxpayer = useCallback((pan) => taxpayers?.find((t) => t.pan === pan), [taxpayers]);

  const resetOtpOnly = useCallback(() => {
    pollTokenRef.current += 1;
    setOtpSent(false);
    setOtpDigits(Array(OTP_LEN).fill(''));
    setOtpSendCount(0);
    setOtpWrongAttempts(0);
    setStatusSnapshot(null);
    setAutomationRunId(null);
    setAutomationCheckStatus(null);
    setVerifyFlowSuccess(false);
  }, []);

  const handleSelectPAN = useCallback(
    (pan) => {
      setSelectedPAN(pan);

      const found = getSelectedTaxpayer(pan);
      const personal = found?.payload?.PersonalDetails;

      const fullName = [personal?.firstName, personal?.middleName, personal?.lastName]
        .map((x) => (x || '').trim())
        .filter(Boolean)
        .join(' ');

      setSelectedName(fullName || found?.fullName || found?.name || '');
      setDob(personal?.dob || '');

      resetOtpOnly();

      if (!pan) return;
    },
    [getSelectedTaxpayer, resetOtpOnly],
  );

  const onOtpDigitChange = useCallback((index, text) => {
    const cleaned = String(text).replace(/\D/g, '');

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LEN).split('');
      setOtpDigits(() => {
        const next = Array(OTP_LEN).fill('');
        digits.forEach((d, i) => {
          if (i < OTP_LEN) next[i] = d;
        });
        return next;
      });

      const focusIdx = Math.min(digits.length, OTP_LEN - 1);
      requestAnimationFrame(() => otpRefs.current[focusIdx]?.focus());
      return;
    }

    const digit = cleaned.slice(-1);

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const onOtpKeyDown = useCallback((index, e) => {
    if (e.key !== 'Backspace') return;

    setOtpDigits((prev) => {
      if (prev[index] !== '') {
        const next = [...prev];
        next[index] = '';
        return next;
      }

      if (index > 0) {
        otpRefs.current[index - 1]?.focus();
        const next = [...prev];
        next[index - 1] = '';
        return next;
      }

      return prev;
    });
  }, []);

  const pollAutomationUntilOtpOrEnd = useCallback(
    async (runId, checkStatus) => {
      const token = ++pollTokenRef.current;
      setAutomationRunId(runId);
      setAutomationCheckStatus(typeof checkStatus === 'string' ? checkStatus : null);

      for (let round = 0; round < POLL_MAX_ROUNDS; round++) {
        if (pollTokenRef.current !== token) return;

        try {
          const data = await dispatch(fetchResetPasswordStatusById(runId)).unwrap();

          if (pollTokenRef.current !== token) return;

          setStatusSnapshot(data);

          if (statusIndicatesAadhaarOtpRequested(data)) {
            setOtpWrongAttempts(0);
            setOtpSent(true);
            setOtpSendCount((c) => c + 1);
            toast.success('OTP sent to Aadhaar-linked mobile number.');
            return;
          }

          if (isTerminalAutomationStatus(data)) {
            const st = String(data?.status || '').toUpperCase();

            if (st === 'FAILED' || st === 'ERROR') {
              toast.error(String(data?.error || data?.message || 'Automation failed'));
            } else {
              toast.success(extractMessage(data) || 'Automation finished.');
            }

            await recordSessionEnd();
            await refreshLimiter();
            return;
          }
        } catch (e) {
          toast.error(e?.message || 'Failed to fetch automation status');
          await recordSessionEnd();
          await refreshLimiter();
          return;
        }

        await new Promise((r) => setTimeout(r, STATUS_POLL_MS));
      }

      toast.error('Automation is taking too long. Please try again later.');
      await recordSessionEnd();
      await refreshLimiter();
    },
    [dispatch, refreshLimiter],
  );

  const handleSendOtp = useCallback(async () => {
    if (!selectedPAN) {
      toast.error('Please select PAN');
      return;
    }
    if (!rules.allOk) {
      toast.error('Password does not meet required rules');
      return;
    }
    if (!matchOk) {
      toast.error('Passwords do not match');
      return;
    }
    if (!consent) {
      toast.error('Please accept consent');
      return;
    }
    if (otpSent) return;

    setBusySend(true);

    try {
      await dispatch(
        resetItrPassword({
          pan: selectedPAN,
          pwd: newPassword,
        }),
      ).unwrap();

      toast.success('New password saved. Starting e-filing OTP...');

      setBusySend(false);
      setBusyAutomation(true);
      setStatusSnapshot(null);
      setOtpDigits(Array(OTP_LEN).fill(''));

      await new Promise((r) => setTimeout(r, DELAY_AFTER_RESETPWD_MS));

      const db = String(getProfessionalHeader('x-db-name') || '').trim();
      const login_user = String(getProfessionalHeader('loginuser') || '').trim();
      const auth_token = String(getProfessionalHeader('authtoken') || '').trim();

      const autoRes = await dispatch(
        startResetPasswordAutomation({
          pan: selectedPAN,
          password: '',
          assessment_year: '',
          taxpayer_pwd: '',
          db,
          auth_token,
          login_user,
        }),
      ).unwrap();

      const runId = autoRes?.runId || autoRes?.job_id || autoRes?.id;

      if (!runId) {
        throw new Error(extractMessage(autoRes) || 'Automation did not return run id');
      }

      await pollAutomationUntilOtpOrEnd(runId, autoRes?.check_status);
    } catch (e) {
      toast.error(e?.message || 'Failed to send OTP');
    } finally {
      setBusyAutomation(false);
      setBusySend(false);
    }
  }, [consent, dispatch, matchOk, newPassword, otpSent, pollAutomationUntilOtpOrEnd, rules.allOk, selectedPAN]);

  const onSendOtpPress = useCallback(async () => {
    if (!selectedPAN) {
      toast.error('Please select PAN');
      return;
    }
    if (!rules.allOk) {
      toast.error('Password does not meet required rules');
      return;
    }
    if (!matchOk) {
      toast.error('Passwords do not match');
      return;
    }
    if (!consent) {
      toast.error('Please accept consent');
      return;
    }
    if (otpSent) return;

    const s = await readLimiterState();
    const gate = evaluateLimiter(s);

    if (!gate?.ok) {
      toast.error(gate?.message || 'Try again later');
      await refreshLimiter();
      return;
    }

    await recordResetAttempt();
    await refreshLimiter();
    await handleSendOtp();
    await refreshLimiter();
  }, [selectedPAN, rules.allOk, matchOk, consent, otpSent, refreshLimiter, handleSendOtp]);

  const handleVerifyOtp = useCallback(async () => {
    const otpString = String(otpDigitsRef.current.join('')).replace(/\D/g, '').slice(0, OTP_LEN);
    const panStr = String(selectedPAN ?? '').trim();

    if (otpString.length !== OTP_LEN) {
      toast.error('Please enter 6 digit OTP');
      return;
    }

    if (!panStr) {
      toast.error('Please select PAN');
      return;
    }

    setBusyVerify(true);

    try {
      const res = await dispatch(
        verifyResetItrPasswordOtp({
          pan: panStr,
          otp: otpString,
        }),
      ).unwrap();

      if (!isResetPwdOtpSuccessResponse(res)) {
        const failMsg = extractResetPwdOtpErrorText(res) || 'Invalid OTP. Please check and try again.';
        throw new Error(failMsg);
      }

      setOtpWrongAttempts(0);

      if (automationRunId) {
        setBusyPostOtpStatus(true);
        const token = pollTokenRef.current;

        try {
          let terminalData = null;
          let lastPollData = null;
          let sawPasswordUpdated = false;

          for (let round = 0; round < POLL_MAX_ROUNDS; round++) {
            if (pollTokenRef.current !== token) return;

            const data = await dispatch(fetchResetPasswordStatusById(automationRunId)).unwrap();

            lastPollData = data;
            setStatusSnapshot(data);

            if (automationPasswordUpdatedMessageSeen(data)) {
              terminalData = data;
              sawPasswordUpdated = true;
              break;
            }

            if (isAutomationTerminalFailure(data)) {
              terminalData = data;
              sawPasswordUpdated = false;
              break;
            }

            if (isTerminalAutomationStatusAfterOtp(data)) {
              terminalData = data;
              sawPasswordUpdated = false;
              break;
            }

            await new Promise((r) => setTimeout(r, STATUS_POLL_MS));
          }

          if (pollTokenRef.current !== token) return;

          if (!terminalData) {
            toast.error(`Automation timeout\n${formatAutomationStatusForUser(lastPollData)}`);
            return;
          }

          if (sawPasswordUpdated) {
            toast.success(extractMessage(terminalData) || 'Password updated successfully');
            setVerifyFlowSuccess(true);
          } else {
            toast.error(formatAutomationStatusForUser(terminalData));
          }
        } finally {
          setBusyPostOtpStatus(false);
        }
      } else {
        toast.error('Automation run not found');
      }
    } catch (e) {
      const msg = String(e?.message || e);

      if (isLikelyWrongOtpError(msg)) {
        const nextWrong = otpWrongAttempts + 1;
        setOtpWrongAttempts(nextWrong);

        if (nextWrong >= OTP_MAX_WRONG) {
          toast.error('Maximum OTP attempts reached');

          if (automationRunId) {
            try {
              await dispatch(deleteResetPasswordJobById(automationRunId)).unwrap();
            } catch (_) {}
          }

          await recordSessionEnd();
          resetOtpOnly();
          await refreshLimiter();
        } else {
          const remaining = OTP_MAX_WRONG - nextWrong;
          toast.error(`Wrong OTP. ${remaining} attempts remaining`);
        }
      } else {
        toast.error(msg || 'Failed to verify OTP');
      }
    } finally {
      setBusyVerify(false);
    }
  }, [automationRunId, dispatch, otpWrongAttempts, refreshLimiter, resetOtpOnly, selectedPAN]);

  const handleModalClose = useCallback(async () => {
    if (verifyFlowSuccess) {
      await recordSessionEnd();
      setVerifyFlowSuccess(false);
      resetOtpOnly();
      await refreshLimiter();
      return;
    }

    setBusyAutomation(false);
    setBusySend(false);
    setBusyVerify(false);
    setBusyPostOtpStatus(false);

    if (automationRunId) {
      try {
        await dispatch(deleteResetPasswordJobById(automationRunId)).unwrap();
      } catch (_) {}
    }

    await recordSessionEnd();
    resetOtpOnly();
    await refreshLimiter();
  }, [automationRunId, dispatch, refreshLimiter, resetOtpOnly, verifyFlowSuccess]);

  const handleResendOtp = useCallback(async () => {
    if (!otpSent || otpSendCount >= OTP_MAX_SENDS) return;

    if (!rules.allOk || !matchOk || !consent) {
      toast.error('Please complete form correctly before resending');
      return;
    }

    setBusySend(true);

    try {
      await dispatch(
        resetItrPassword({
          pan: selectedPAN,
          pwd: newPassword,
        }),
      ).unwrap();

      setBusySend(false);
      setBusyAutomation(true);
      setStatusSnapshot(null);
      setOtpDigits(Array(OTP_LEN).fill(''));

      await new Promise((r) => setTimeout(r, DELAY_AFTER_RESETPWD_MS));

      const db = localStorage.getItem('dbName')?.trim() || '';
      const login_user = localStorage.getItem('loginuser')?.trim() || '';
      const auth_token = localStorage.getItem('authTokenDigest')?.trim() || localStorage.getItem('authToken')?.trim() || '';

      const autoRes = await dispatch(
        startResetPasswordAutomation({
          pan: selectedPAN,
          password: '',
          assessment_year: '',
          taxpayer_pwd: '',
          db,
          auth_token,
          login_user,
        }),
      ).unwrap();

      const runId = autoRes?.runId || autoRes?.job_id || autoRes?.id;

      if (!runId) {
        throw new Error(extractMessage(autoRes) || 'Automation did not return run id');
      }

      await pollAutomationUntilOtpOrEnd(runId, autoRes?.check_status);
    } catch (e) {
      toast.error(e?.message || 'Failed to resend OTP');
    } finally {
      setBusyAutomation(false);
      setBusySend(false);
    }
  }, [consent, dispatch, matchOk, newPassword, otpSendCount, otpSent, pollAutomationUntilOtpOrEnd, rules.allOk, selectedPAN]);

  const canSend = !!selectedPAN && rules.allOk && matchOk && consent && !busySend && !busyAutomation && !otpSent && limiterGate?.ok;

  const statusLines = statusSnapshot ? getAutomationDisplayLines(statusSnapshot) : { primary: '', secondary: '', progress: 0 };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-2xl font-semibold mb-2">Reset ITR Password</h2>
        <p className="text-sm text-gray-500 mb-6">Reset taxpayer e-filing password and complete Aadhaar OTP verification.</p>

        {/* PAN Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select PAN</label>
          <select value={selectedPAN} onChange={(e) => handleSelectPAN(e.target.value)} className="border px-3 py-2 rounded-lg w-full">
            <option value="">Select PAN</option>

            {taxpayers.map((t) => {
              const p = t.payload?.PersonalDetails;
              const name = [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ');

              return (
                <option key={t.pan} value={t.pan}>
                  {t.pan} {name ? `(${name})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {(selectedName || dob) && (
          <div className="mb-4 rounded-xl bg-gray-50 border p-3">
            {selectedName ? (
              <div className="text-sm">
                <span className="font-medium">Name:</span> {selectedName}
              </div>
            ) : null}
            {dob ? (
              <div className="text-sm mt-1">
                <span className="font-medium">DOB:</span> {dob}
              </div>
            ) : null}
          </div>
        )}
        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">New Password</label>

          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              maxLength={15}
              onChange={(e) => {
                setNewPassword(e.target.value);
                resetOtpOnly();
              }}
              className="border px-3 py-2 pr-10 rounded-lg w-full"
              placeholder="Enter new password"
            />

            <button type="button" onClick={() => setShowNewPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
              {showNewPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
            </button>
          </div>

          {strength.label ? (
            <div className="mt-2 text-sm">
              Strength: <span className={strength.level === 'strong' ? 'text-green-600 font-medium' : strength.level === 'medium' ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>{strength.label}</span>
            </div>
          ) : null}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Confirm Password</label>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              maxLength={15}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                resetOtpOnly();
              }}
              className="border px-3 py-2 pr-10 rounded-lg w-full"
              placeholder="Confirm new password"
            />

            <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
              {showConfirmPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
            </button>
          </div>

          {confirmPassword ? <div className={`mt-2 text-sm font-medium ${matchOk ? 'text-green-600' : 'text-red-600'}`}>{matchOk ? 'Passwords matched' : 'Passwords do not match'}</div> : null}
        </div>

        {/* Rules */}
        <div className="mb-4 rounded-xl border p-4 bg-slate-50">
          <div className="font-medium mb-2">Password Rules</div>
          <div className={`text-sm mb-1 ${rules.lenOk ? 'text-green-600' : 'text-gray-500'}`}>• 8 to 15 characters</div>
          <div className={`text-sm mb-1 ${rules.upperOk ? 'text-green-600' : 'text-gray-500'}`}>• At least one uppercase letter</div>
          <div className={`text-sm mb-1 ${rules.lowerOk ? 'text-green-600' : 'text-gray-500'}`}>• At least one lowercase letter</div>
          <div className={`text-sm mb-1 ${rules.digitOk ? 'text-green-600' : 'text-gray-500'}`}>• At least one digit</div>
          <div className={`text-sm ${rules.specialOk ? 'text-green-600' : 'text-gray-500'}`}>• At least one special character</div>
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span className="text-sm text-gray-700">I confirm that I want to reset the taxpayer’s ITR password and continue with Aadhaar OTP verification.</span>
        </label>

        {/* Limiter */}
        {!limiterGate?.ok && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm text-amber-800 font-medium">{limiterGate?.message}</div>

            {limiterGate?.kind === 'cooldown' && limiterGate?.cooldownEndsAtMs != null && (
              <div className="text-sm text-amber-700 mt-1">Try again in {formatDurationCountdown(Math.max(0, (limiterGate.cooldownEndsAtMs - Date.now()) / 1000))}</div>
            )}

            {limiterGate?.kind === 'daily' && limiterGate?.dailyResetAtMs != null && (
              <div className="text-sm text-amber-700 mt-1">Resets in {formatDurationCountdown(Math.max(0, (limiterGate.dailyResetAtMs - Date.now()) / 1000))}</div>
            )}
          </div>
        )}

        <button type="button" onClick={onSendOtpPress} disabled={!canSend} className={`px-5 py-3 rounded-xl text-white font-medium ${canSend ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
          {busySend ? 'Saving...' : busyAutomation ? 'Starting Automation...' : 'Send OTP'}
        </button>
      </div>

      {/* MODAL */}
      {(busyAutomation || otpSent || verifyFlowSuccess) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold">{verifyFlowSuccess ? 'Password Reset Successful' : busyAutomation && !otpSent ? 'Starting Automation' : 'Enter Aadhaar OTP'}</h3>

              <button onClick={handleModalClose} className="text-gray-500 hover:text-gray-700 text-xl">
                ×
              </button>
            </div>

            <div className="p-5">
              {verifyFlowSuccess ? (
                <div className="text-center">
                  <div className="text-green-600 text-5xl mb-3">✓</div>
                  <div className="text-xl font-semibold mb-2">Password updated successfully</div>
                  <p className="text-sm text-gray-600 mb-4">The reset workflow has completed successfully.</p>
                  <button onClick={handleModalClose} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium">
                    Done
                  </button>
                </div>
              ) : null}

              {!verifyFlowSuccess && busyAutomation && !otpSent ? (
                <div>
                  <div className="text-sm text-gray-500 mb-4">Please wait while we trigger Aadhaar OTP from the e-filing workflow.</div>

                  <div className="rounded-xl border bg-slate-50 p-4">
                    {statusSnapshot?.status ? <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-3">{String(statusSnapshot.status)}</div> : null}

                    <div className="font-medium text-gray-800">{statusLines.primary || 'Working on your request...'}</div>

                    {statusLines.secondary ? <div className="text-sm text-gray-500 mt-2">{statusLines.secondary}</div> : null}
                  </div>
                </div>
              ) : null}

              {!verifyFlowSuccess && otpSent ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Enter the 6-digit OTP sent to the Aadhaar-linked mobile number.</p>

                  <div className="flex gap-2 justify-center mb-4">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={i === 0 ? 6 : 1}
                        value={digit}
                        onChange={(e) => onOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => onOtpKeyDown(i, e)}
                        className="w-12 h-12 text-center border rounded-xl text-lg font-semibold"
                      />
                    ))}
                  </div>

                  {otpWrongAttempts > 0 && otpWrongAttempts < OTP_MAX_WRONG ? <div className="text-sm text-red-600 text-center mb-4">{OTP_MAX_WRONG - otpWrongAttempts} attempts remaining</div> : null}

                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={busyVerify || busySend || busyAutomation || otpDigits.join('').length !== OTP_LEN}
                      className={`px-5 py-3 rounded-xl text-white font-medium ${
                        busyVerify || busySend || busyAutomation || otpDigits.join('').length !== OTP_LEN ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                      }`}>
                      {busyVerify ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={busySend || busyAutomation || busyVerify || otpSendCount >= OTP_MAX_SENDS}
                      className={`px-5 py-3 rounded-xl font-medium border ${
                        busySend || busyAutomation || busyVerify || otpSendCount >= OTP_MAX_SENDS ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}>
                      {otpSendCount >= OTP_MAX_SENDS ? 'Resend Limit Reached' : 'Resend OTP'}
                    </button>
                  </div>

                  {(busyPostOtpStatus || statusSnapshot) && (
                    <div className="mt-5 rounded-xl border bg-slate-50 p-4">
                      <div className="font-medium mb-2">Automation Status</div>

                      {busyPostOtpStatus ? <div className="text-sm text-blue-600">Updating automation status...</div> : null}

                      {statusSnapshot && !busyPostOtpStatus ? (
                        <>
                          {statusSnapshot.status ? <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-3">{String(statusSnapshot.status)}</div> : null}

                          <div className="text-sm font-medium text-gray-800">{statusSnapshot?.currentStage?.message || statusLines.primary || statusSnapshot?.currentStage?.label || '—'}</div>

                          {statusLines.secondary ? <div className="text-sm text-gray-500 mt-2">{statusLines.secondary}</div> : null}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetItrPasswordWeb;
