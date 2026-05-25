import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { verifyIFSC, addTaxpayer, updateTaxpayer, getAllTaxPayers } from '../../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';

import { checkProfessionalParentUser } from '../../../../redux/slices/professionalSlice/professionalAuthSlice';

import { getStates, getCitiesByState, getLocationByPincode } from '../../../../redux/slices/professionalSlice/stateCitySlice';
import { formatToInputDate } from '../../../../components/common/DateFormator';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { verifyPanWithHeader, resetVerifyPan } from '../../../../redux/slices/professionalSlice/panVerify/panVerify';

const emptyForm = {
  PersonalDetails: {
    firstName: '',
    middleName: '',
    lastName: '',
    typeOfTaxPayer: '',
    residentialStatus: '',
    gender: '',
    dob: '',
    aadharNumber: '',
    pan: '',
    passportNumber: '',
    itlPassword: '',
  },

  ContactAddressDetails: {
    mobileNumber: '',
    emailId: '',
    address1: '',
    address2: '',
    address3: '',
    address4: '',
    state: '',
    incomeTaxStateCode: '',
    // gstStateCode: "",
    city: '',
    pin: '',
    landLine: '',
  },

  BankDetails: {
    array: [
      {
        accountNumber: '',
        cnfaccountNumber: '',
        bankName: '',
        bankAddress: '',
        ifscCode: '',
        accountType: '',
        accountHolderType: '',
        nominate: 'No',
        nomineeName: '',
        isDefaultACC: 'true',
        _verified: false,
      },
    ],
  },
};

const AddNewTaxpayerModal = ({ onClose, mode = 'add', initialForm }) => {
  console.log('initialForm', JSON.stringify(initialForm, null, 2));

  const dispatch = useDispatch();
  const { selectedTaxpayer, verifyLoading, addLoading, updateLoading } = useSelector((s) => s.taxpayer);
  const { parentUserExists, parentUserData, loading } = useSelector((state) => state.professionalAuth);
  const { data: panData, loading: panLoading, error: panError, success: panSuccess } = useSelector((s) => s.verifyPan);
  const [panVerified, setPanVerified] = useState(false);
  const [panVerifyFailed, setPanVerifyFailed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const lastPinRef = useRef('');
  const pinLookupAbortRef = useRef(false);

  const { states, cities } = useSelector((s) => s.stateCity);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [originalPan, setOriginalPan] = useState(null);

  /* ===================== DROPDOWN STATES ====================== */
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [pinStatus, setPinStatus] = useState('idle');

  /* ===================== HANDLERS ====================== */
  const setField = (path, value) => {
    setForm((prev) => {
      const keys = path.split('.');
      const updated = JSON.parse(JSON.stringify(prev));
      let obj = updated;

      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];

      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  /* ===================== LOAD EDIT ====================== */
  useEffect(() => {
    if (mode === 'edit' && selectedTaxpayer) {
      const p = selectedTaxpayer.payload?.PersonalDetails || {};
      const c = selectedTaxpayer.payload?.ContactAddressDetails || {};
      const b = selectedTaxpayer.payload?.BankDetails?.array || [];

      setForm({
        PersonalDetails: {
          ...emptyForm.PersonalDetails,
          ...p,
          pan: selectedTaxpayer.pan,
        },
        ContactAddressDetails: {
          ...emptyForm.ContactAddressDetails,
          ...c,
        },
        BankDetails: {
          array: b.length > 0 ? b : emptyForm.BankDetails.array,
        },
      });

      setPanVerified(true);
      setPanVerifyFailed(false);

      if (c.state?.isoCode) {
        dispatch(
          getCitiesByState({
            stateCode: c.state.isoCode,
            searchText: '',
          }),
        );
      }
    }
  }, [mode, selectedTaxpayer, dispatch]);
  useEffect(() => {
    if (mode === 'edit' && selectedTaxpayer) {
      setOriginalPan(selectedTaxpayer.pan); // ✅ original PAN
    }
  }, [mode, selectedTaxpayer]);

  /* ===================== FETCH STATES ====================== */
  useEffect(() => {
    dispatch(getStates(''));
  }, []);

  /* SEARCH STATES */
  useEffect(() => {
    const delay = setTimeout(() => {
      dispatch(getStates(stateSearch));
    }, 300);
    return () => clearTimeout(delay);
  }, [stateSearch]);

  /* SEARCH CITIES */
  useEffect(() => {
    if (!form.ContactAddressDetails.state) return;

    const delay = setTimeout(() => {
      dispatch(
        getCitiesByState({
          stateCode: form.ContactAddressDetails.state?.isoCode,
          searchText: citySearch,
        }),
      );
    }, 300);

    return () => clearTimeout(delay);
  }, [citySearch]);

  /* WHEN STATE CHANGES → FETCH CITIES */
  useEffect(() => {
    if (form.ContactAddressDetails.state?.isoCode) {
      dispatch(
        getCitiesByState({
          stateCode: form.ContactAddressDetails.state.isoCode, // ✅
          searchText: '',
        }),
      );
    }
  }, [form.ContactAddressDetails.state?.isoCode]);

  //use effect for prefilled data
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    if (mode !== 'add') return;
    if (!initialForm) return;
  if (prefillAppliedRef.current) return;

  prefillAppliedRef.current = true;

  setForm((prev) => ({
    ...prev,
    ...initialForm,
    PersonalDetails: {
      ...prev.PersonalDetails,
      ...(initialForm.PersonalDetails || {}),
    },
    ContactAddressDetails: {
      ...prev.ContactAddressDetails,
      ...(initialForm.ContactAddressDetails || {}),
    },
    BankDetails: {
      array:
        initialForm?.BankDetails?.array?.length
          ? initialForm.BankDetails.array
          : prev.BankDetails.array,
    },
  }));
}, [mode, initialForm]);
  useEffect(() => {
    if (mode !== 'add') return;

    const pin = form?.ContactAddressDetails?.pin;

    // when pin is prefilled + states loaded -> auto lookup
    if (pin && String(pin).length === 6) {
      runPinLookup(pin);
    }
  }, [mode, form?.ContactAddressDetails?.pin, states?.length]);
  useEffect(() => {
    if (mode !== 'add') return;

    form.BankDetails.array.forEach((b, i) => {
      if (b?.ifscCode?.length === 11 && !b._verified) {
        runIFSCVerify(i, b.ifscCode);
      }
    });
  }, [mode, form.BankDetails.array]);

  /* ===================== BANK HANDLERS ====================== */
  const addBank = () => {
    setForm((prev) => ({
      ...prev,
      BankDetails: {
        array: [
          ...prev.BankDetails.array,
          {
            accountNumber: '',
            cnfaccountNumber: '',
            bankName: '',
            bankAddress: '',
            ifscCode: '',
            isDefaultACC: 'false',
            _verified: false,
          },
        ],
      },
    }));
  };

  const removeBank = (i) => {
    setForm((prev) => {
      const arr = prev.BankDetails.array.filter((_, idx) => idx !== i);
      if (!arr.some((b) => b.isDefaultACC === 'true')) arr[0].isDefaultACC = 'true';
      return { ...prev, BankDetails: { array: arr } };
    });
  };

  const setDefaultBank = (i) => {
    setForm((prev) => ({
      ...prev,
      BankDetails: {
        array: prev.BankDetails.array.map((b, idx) => ({
          ...b,
          isDefaultACC: idx === i ? 'true' : 'false',
        })),
      },
    }));
  };

  const runPinLookup = async (pin) => {
    const cleanPin = String(pin || '')
      .replace(/\D/g, '')
      .slice(0, 6);

    setField('ContactAddressDetails.pin', cleanPin);
    setPinStatus('idle');

    if (cleanPin.length !== 6) return;

    // wait until states loaded
    if (!Array.isArray(states) || states.length === 0) return;

    // prevent repeat calls
    if (lastPinRef.current === cleanPin) return;
    lastPinRef.current = cleanPin;

    try {
      setPinStatus('loading');

      const res = await dispatch(getLocationByPincode(cleanPin)).unwrap();

      const apiState = String(res?.state || '')
        .trim()
        .toLowerCase();
      const apiCity = String(res?.district || '')
        .trim()
        .toLowerCase();

      if (!apiState) {
        setPinStatus('invalid');
        return;
      }

      const matchedState = states.find(
        (s) =>
          String(s?.name?.en || '')
            .trim()
            .toLowerCase() === apiState,
      );

      if (!matchedState) {
        setPinStatus('invalid');
        return;
      }

      // set state + clear city first
      setField('ContactAddressDetails.state', matchedState);
      setField('ContactAddressDetails.city', {});

      // fetch cities for this state
      const cityList = await dispatch(
        getCitiesByState({
          stateCode: matchedState.isoCode,
          searchText: '',
        }),
      ).unwrap();

      if (!apiCity) {
        setPinStatus('invalid');
        return;
      }

      const matchedCity = (cityList || cities || []).find(
        (c) =>
          String(c?.name?.en || '')
            .trim()
            .toLowerCase() === apiCity,
      );

      if (!matchedCity) {
        setPinStatus('invalid');
        return;
      }

      setField('ContactAddressDetails.city', matchedCity);
      setPinStatus('success');
    } catch (err) {
      console.error('PIN lookup failed', err);
      setPinStatus('invalid');
    }
  };
  const runIFSCVerify = async (index, code) => {
    if (!code || code.length !== 11) return;

    try {
      const result = await dispatch(verifyIFSC(code)).unwrap();

      if (!result || !result.details) return;

      const details = result.details;

      setField(`BankDetails.array.${index}.bankName`, details.BANK || '');
      setField(`BankDetails.array.${index}.bankAddress`, details.ADDRESS || '');
      setField(`BankDetails.array.${index}._verified`, true);
    } catch (err) {
      console.error('IFSC auto verify failed', err);
    }
  };
  /* ===================== IFSC VERIFY ====================== */
  const handleVerifyIFSC = async (i, code) => {
    if (!code) return toast.error('Enter IFSC first');
    if (code.length !== 11) return toast.error('Invalid IFSC (11 chars)');

    await runIFSCVerify(i, code);
    toast.success('IFSC Verified');
  };

  /* ===================== VALIDATION ====================== */
  const validate = () => {
    const e = {};
    const P = form.PersonalDetails;
    const C = form.ContactAddressDetails;
    const B = form.BankDetails.array;

    /* ===================== PERSONAL DETAILS ===================== */

    if (!P.firstName.trim()) e.firstName = 'First name is required';
    if (!P.middleName.trim()) e.middleName = 'Middle name is required';
    if (!P.lastName.trim()) e.lastName = 'Last name is required';

    if (!P.typeOfTaxPayer) e.typeOfTaxPayer = 'Select taxpayer type';
    if (!P.residentialStatus) e.residentialStatus = 'Select residential status';
    if (!P.gender) e.gender = 'Select gender';

    if (!P.dob) {
      e.dob = 'Date of birth is required';
    } else {
      const dob = new Date(P.dob);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) e.dob = 'Taxpayer must be at least 18 years old';
    }

    if (!P.aadharNumber || P.aadharNumber.length !== 12) e.aadhar = 'Enter valid 12-digit Aadhar';

    if (!P.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(P.pan)) {
      e.pan = 'Enter valid 10-character PAN';
    } else if (!panVerified) {
      e.pan = 'Please verify PAN';
    }
    // if (!P.itlPassword) {
    //     e.itlPassword = "Income Tax Login Password is required";
    //   }

    /* ===================== CONTACT DETAILS ===================== */

    if (!C.mobileNumber || C.mobileNumber.length !== 10) e.mobile = 'Enter valid 10-digit mobile number';

    if (!C.emailId || !C.emailId.includes('@')) e.email = 'Enter valid email';

    if (!C.address1.trim()) e.address1 = 'Flat/Plot No. required';
    if (!C.address2.trim()) e.address2 = 'Building/plot name required';
    if (!C.address3.trim()) e.address3 = 'Street required';
    if (!C.address4.trim()) e.address4 = 'Area required';
    if (!C.state) e.state = 'Select state';
    if (!C.city) e.city = 'Select city';

    if (!C.pin || C.pin.length !== 6) e.pin = 'Enter valid 6-digit PIN';

    /* ===================== BANK DETAILS ===================== */

    B.forEach((b, i) => {
      if (!b.accountNumber.trim()) e[`acc_${i}`] = 'Account number is required';

      if (!b.cnfaccountNumber.trim()) e[`cnf_${i}`] = 'Confirm account number is required';

      if (b.accountNumber !== b.cnfaccountNumber) e[`cnf_${i}`] = 'Account numbers do not match';
      if (b.accountNumber.length < 9) {
        e[`acc_${i}`] = 'Account number must be at least 9 digits';
      }
      if (b.cnfaccountNumber.length < 9) {
        e[`cnf_${i}`] = 'Confirm account number must be at least 9 digits';
      }
      if (b.accountNumber !== b.cnfaccountNumber) {
        e[`cnf_${i}`] = 'Account numbers do not match';
      }
      if (!b.ifscCode || b.ifscCode.length !== 11) e[`ifsc_${i}`] = 'Enter valid 11-character IFSC';

      if (!b.accountType) e[`accountType_${i}`] = 'Select account type';

      if (!b.accountHolderType) e[`accountHolderType_${i}`] = 'Select account holder type';

      if (b.nominate === 'Yes' && !b.nomineeName.trim()) e[`nominee_${i}`] = 'Nominee name is required';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ===================== SUBMIT ====================== */
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Fix validation errors');
      return;
    }
    const action =
      mode === 'add'
        ? addTaxpayer(form)
        : updateTaxpayer({
            pan: originalPan, // ✅ FIXED
            data: form,
          });

    dispatch(action)
      .unwrap()
      .then(() => {
        toast.success(mode === 'add' ? 'Added' : 'Updated');

        // 🔥 REFRESH LIST AFTER UPDATE
        dispatch(
          getAllTaxPayers({
            search: '',
            limit: 10,
            offset: 0,
          }),
        );

        onClose();
      })
      .catch((err) => toast.error(err.message));
  };

  // const handlePinChange = async (e) => {
  //   const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
  //   setField('ContactAddressDetails.pin', pin);

  //   // reset indicator while typing
  //   setPinStatus('idle');

  //   if (pin.length !== 6) return;

  //   try {
  //     setPinStatus('loading');

  //     const res = await dispatch(getLocationByPincode(pin)).unwrap();

  //     const apiState = res?.state?.trim()?.toLowerCase();
  //     const apiCity = res?.district?.trim()?.toLowerCase();

  //     if (!apiState) {
  //       setPinStatus('invalid');
  //       return;
  //     }

  //     const matchedState = states.find((s) => s?.name?.en?.toLowerCase() === apiState);

  //     if (!matchedState) {
  //       setPinStatus('invalid');
  //       return;
  //     }

  //     setField('ContactAddressDetails.state', matchedState);
  //     setField('ContactAddressDetails.city', {});

  //     const cityList = await dispatch(
  //       getCitiesByState({
  //         stateCode: matchedState.isoCode,
  //         searchText: '',
  //       }),
  //     ).unwrap();

  //     if (!apiCity) {
  //       setPinStatus('invalid');
  //       return;
  //     }

  //     const matchedCity = cityList.find((c) => c?.name?.en?.toLowerCase() === apiCity);

  //     if (!matchedCity) {
  //       setPinStatus('invalid');
  //       return;
  //     }

  //     setField('ContactAddressDetails.city', matchedCity);
  //     setPinStatus('success');
  //   } catch (err) {
  //     console.error('PIN lookup failed', err);
  //     setPinStatus('invalid');
  //   }
  // };
  const handleVerifyPan = async () => {
    const pan = (form.PersonalDetails.pan || '').trim().toUpperCase();

    if (!pan) {
      toast.error('PAN is required');
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      toast.error('Enter valid PAN');
      return;
    }

    try {
      const res = await dispatch(verifyPanWithHeader({ pan })).unwrap();

      setPanVerified(true);
      setPanVerifyFailed(false);
      toast.success(res?.message || 'PAN verified successfully');
    } catch (err) {
      setPanVerified(false);
      setPanVerifyFailed(true);
      toast.error(err || 'PAN verification failed');
    }
  };
  const handlePanChange = (e) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setField('PersonalDetails.pan', value);
    setPanVerified(false);
    setPanVerifyFailed(false);
    dispatch(resetVerifyPan());
  };
  const handlePinChange = async (e) => {
    runPinLookup(e.target.value);
  };
  const handleFillFromLoggedInUser = async () => {
    try {
      const mobileData = JSON.parse(localStorage.getItem('professionalHeaders'));
      const mobile = mobileData?.loginuser;
      if (!mobile) {
        toast.error('No mobile number found in localStorage');
        return;
      }

      // 🔔 Call API: checkProfessionalParentUser(mobile)
      const res = await dispatch(checkProfessionalParentUser(mobile)).unwrap();
      const user = res?.user?.ChildUsers;
      if (!user) {
        toast.error('No child user data found');
        return;
      }

      setForm((prev) => ({
        ...prev,
        PersonalDetails: {
          ...prev.PersonalDetails,
          firstName: user.userFirstName || '',
          middleName: user.userMiddleName || '',
          lastName: user.userLastName || user.userSurname || '',
          typeOfTaxPayer: 'Individual', // or keep "" if you want manual select
          residentialStatus: prev.PersonalDetails.residentialStatus || 'Resident',
          gender: user.userGender || '',
          dob: formatToInputDate(user.userDOB) || formatToInputDate(prev.PersonalDetails.dob),
          aadharNumber: user.userAadhar || '',
          pan: user.userPAN || '',
          passportNumber: prev.PersonalDetails.passportNumber,
          itlPassword: prev.PersonalDetails.itlPassword,
        },
        ContactAddressDetails: {
          ...prev.ContactAddressDetails,
          mobileNumber: user.userMobileNumberHash || user.parentUserMobileNumber || '',
          emailId: user.userEmail || '',
          // address / state / city stay as-is for user to fill manually
        },
        BankDetails: {
          ...prev.BankDetails,
        },
      }));
        setPanVerified(false);
        setPanVerifyFailed(false);
        dispatch(resetVerifyPan());

      toast.success('Login user details filled');
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch login user details');
    }
  };
  /* ============================================================
      RENDER
  ============================================================ */

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center px-3 z-50">
      <div className="bg-white w-[90%] max-w-[900px] rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* STOP CHROME AUTOFILL HACK */}
        <input type="password" style={{ display: 'none' }} autoComplete="new-password" />
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">{mode === 'add' ? 'Add New Taxpayer' : 'Edit Taxpayer'}</h2>

            {mode === 'add' && (
              <button type="button" onClick={handleFillFromLoggedInUser} className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-1 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 transition">
                <Plus size={14} />
                Add login user as taxpayer
              </button>
            )}
          </div>

          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* PERSONAL DETAILS */}
        <h3 className="text-lg font-semibold mb-3">Personal Details</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* FIRST NAME */}
          <div>
            <label className="text-xs">First Name</label>
            <input placeholder="Enter first name" value={form.PersonalDetails.firstName} onChange={(e) => setField('PersonalDetails.firstName', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
          </div>

          {/* MIDDLE NAME */}
          <div>
            <label className="text-xs">Middle Name</label>
            <input placeholder="Enter middle name" value={form.PersonalDetails.middleName} onChange={(e) => setField('PersonalDetails.middleName', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.middleName && <p className="text-red-500 text-xs">{errors.middleName}</p>}
          </div>

          {/* LAST NAME */}
          <div>
            <label className="text-xs">Last Name</label>
            <input placeholder="Enter last name" value={form.PersonalDetails.lastName} onChange={(e) => setField('PersonalDetails.lastName', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
          </div>

          {/* TYPE OF TAXPAYER */}
          <div>
            <label className="text-xs">Type of Taxpayer</label>
            <select value={form.PersonalDetails.typeOfTaxPayer} onChange={(e) => setField('PersonalDetails.typeOfTaxPayer', e.target.value)} className="border rounded-md px-3 py-2 w-full">
              <option value="">Select taxpayer type</option>
              <option>Individual</option>
              <option>HUF</option>
              <option>Firm</option>
              <option>Company</option>
              <option>AOP/BOI</option>
              <option>Trust</option>
              <option>LLP</option>
            </select>
            {errors.typeOfTaxPayer && <p className="text-red-500 text-xs">{errors.typeOfTaxPayer}</p>}
          </div>

          {/* RESIDENTIAL STATUS */}
          <div>
            <label className="text-xs">Residential Status</label>
            <select value={form.PersonalDetails.residentialStatus} onChange={(e) => setField('PersonalDetails.residentialStatus', e.target.value)} className="border rounded-md px-3 py-2 w-full">
              <option value="">Select residential status</option>
              <option>Resident</option>
              <option>Non-Resident</option>
              <option>RNOR</option>
            </select>
            {errors.residentialStatus && <p className="text-red-500 text-xs">{errors.residentialStatus}</p>}
          </div>

          {/* GENDER */}
          <div>
            <label className="text-xs">Gender</label>
            <select value={form.PersonalDetails.gender} onChange={(e) => setField('PersonalDetails.gender', e.target.value)} className="border rounded-md px-3 py-2 w-full">
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
          </div>

          {/* DOB */}
          <div>
            <label className="text-xs">Date of Birth</label>
            <input
              placeholder="Select date of birth"
              type="date"
              value={formatToInputDate(form.PersonalDetails.dob)}
              onChange={(e) => setField('PersonalDetails.dob', e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="border rounded-md px-3 py-2 w-full"
            />
            {errors.dob && <p className="text-red-500 text-xs">{errors.dob}</p>}
          </div>

          {/* AADHAR */}
          <div>
            <label className="text-xs">Aadhar (12 digits)</label>
            <input
              placeholder="Enter 12-digit Aadhar number"
              maxLength={12}
              value={form.PersonalDetails.aadharNumber}
              onChange={(e) => setField('PersonalDetails.aadharNumber', e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
            />
            {errors.aadhar && <p className="text-red-500 text-xs">{errors.aadhar}</p>}
          </div>
          {/* PAN */}
          <div>
            <label className="text-xs">PAN</label>

            <div className="relative">
              <input placeholder="Enter PAN (e.g. ABCDE1234F)" maxLength={10} value={form.PersonalDetails.pan} onChange={handlePanChange} className="border rounded-md px-3 py-2 w-full pr-24 uppercase" />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {panVerified ? (
                  <span className="text-green-600 text-lg font-bold">✔</span>
                ) : panVerifyFailed ? (
                  <button type="button" onClick={handleVerifyPan} className="text-red-500 text-lg font-bold px-1" title="PAN verification failed. Retry">
                    ✖
                  </button>
                ) : (
                  <button type="button" onClick={handleVerifyPan} disabled={panLoading} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md disabled:opacity-60">
                    {panLoading ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {errors.pan && <p className="text-red-500 text-xs">{errors.pan}</p>}
          </div>

          {/* PASSPORT */}
          <div>
            <label className="text-xs">Passport Number (Optional)</label>
            <input
              placeholder="Enter passport number (optional)"
              value={form.PersonalDetails.passportNumber}
              onChange={(e) => setField('PersonalDetails.passportNumber', e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
            />
          </div>

          {/* INCOME TAX LOGIN PASSWORD */}
          <div>
            <label className="text-xs">Income Tax Login Password</label>

            <div className="relative">
              <input
                placeholder="Enter IT login password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={form.PersonalDetails.itlPassword || ''}
                onChange={(e) => setField('PersonalDetails.itlPassword', e.target.value)}
                className="border rounded-md px-3 py-2 w-full pr-10"
              />

              {/* Eye Button */}
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            {/* {errors.itlPassword && <p className="text-red-500 text-xs">{errors.itlPassword}</p>} */}
          </div>
        </div>

        {/* CONTACT & ADDRESS */}
        <h3 className="text-lg font-semibold mb-3">Contact & Address Details</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* MOBILE */}
          <div>
            <label className="text-xs">Mobile Number</label>
            <input
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              value={form.ContactAddressDetails.mobileNumber}
              onChange={(e) => setField('ContactAddressDetails.mobileNumber', e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
            />
            {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile}</p>}
          </div>
          {/* LANDLINE */}
          <div>
            <label className="text-xs">Landline (Optional)</label>
            <input
              placeholder="Enter landline number (optional)"
              value={form.ContactAddressDetails.landLine}
              onChange={(e) => setField('ContactAddressDetails.landLine', e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
            />
          </div>
          {/* EMAIL */}
          <div>
            <label className="text-xs">Email</label>
            <input placeholder="Enter email address" value={form.ContactAddressDetails.emailId} onChange={(e) => setField('ContactAddressDetails.emailId', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>
          {/* PIN */}
          <div>
            <label className="text-xs">PIN Code</label>

            <div className="relative">
              <input placeholder="Enter 6-digit PIN code" maxLength={6} value={form.ContactAddressDetails.pin} onChange={handlePinChange} className="border rounded-md px-3 py-2 w-full pr-8" />

              {/* RIGHT-SIDE INDICATOR */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {pinStatus === 'loading' && <span className="text-gray-400 text-lg">⏳</span>}
                {pinStatus === 'success' && <span className="text-green-600 text-lg">✔</span>}
                {pinStatus === 'invalid' && <span className="text-red-500 text-lg">✖</span>}
              </div>
            </div>

            {/* MESSAGE */}
            {pinStatus === 'invalid' && <p className="text-red-500 text-xs mt-1">Invalid PIN or address not found</p>}

            {errors.pin && <p className="text-red-500 text-xs">{errors.pin}</p>}
          </div>
          {/* ADDRESS 1 */}
          <div>
            <label className="text-xs">Flat/Plot No.</label>
            <input placeholder="Flat/Plot No." value={form.ContactAddressDetails.address1} onChange={(e) => setField('ContactAddressDetails.address1', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.address1 && <p className="text-red-500 text-xs">{errors.address1}</p>}
          </div>
          {/* ADDRESS 2 */}
          <div>
            <label className="text-xs">Building/plot name</label>
            <input placeholder="Building/plot name" value={form.ContactAddressDetails.address2} onChange={(e) => setField('ContactAddressDetails.address2', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.address2 && <p className="text-red-500 text-xs">{errors.address2}</p>}
          </div>
          {/* ADDRESS 3 */}
          <div>
            <label className="text-xs">Street</label>
            <input placeholder="Street" value={form.ContactAddressDetails.address3} onChange={(e) => setField('ContactAddressDetails.address3', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.address3 && <p className="text-red-500 text-xs">{errors.address3}</p>}
          </div>
          {/* ADDRESS 3 */}
          <div>
            <label className="text-xs">Area</label>
            <input placeholder="Area" value={form.ContactAddressDetails.address4} onChange={(e) => setField('ContactAddressDetails.address4', e.target.value)} className="border rounded-md px-3 py-2 w-full" />
            {errors.address4 && <p className="text-red-500 text-xs">{errors.address4}</p>}
          </div>
          {/* GST STATE CODE */}
          {/* <div>
            <label className="text-xs">GST State Code</label>
            <input
              placeholder="Enter GST state code"
              value={form.ContactAddressDetails.gstStateCode}
              onChange={(e) =>
                setField("ContactAddressDetails.gstStateCode", e.target.value)
              }
              className="border rounded-md px-3 py-2 w-full"
            />
          </div> */}
          {/* STATE DROPDOWN */}
          <div className="relative">
            <label className="text-xs">State</label>

            <div className="border rounded-md px-3 py-2 bg-white cursor-pointer" onClick={() => setShowStateDropdown(!showStateDropdown)}>
              {form.ContactAddressDetails.state?.name?.en || 'Select State'}
            </div>

            {showStateDropdown && (
              <div className="absolute z-50 bg-white border w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-auto">
                <input placeholder="Search state…" className="px-3 py-2 border-b w-full outline-none text-sm" value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} />
                {states?.map((st) => (
                  <div
                    key={st.isoCode}
                    onClick={() => {
                      setField('ContactAddressDetails.state', st); // ✅ FULL OBJECT
                      setField('ContactAddressDetails.city', {});
                      setShowStateDropdown(false);
                      setCitySearch('');

                      dispatch(
                        getCitiesByState({
                          stateCode: st.isoCode, // ✅ string only for API
                          searchText: '',
                        }),
                      );
                    }}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm">
                    {st.name.en}
                  </div>
                ))}
              </div>
            )}
            {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}
          </div>
          {/* CITY DROPDOWN */}
          <div className="relative">
            <label className="text-xs">City</label>

            <div
              className="border rounded-md px-3 py-2 bg-white cursor-pointer"
              onClick={() => {
                if (!form.ContactAddressDetails.state) return toast.error('Select a state first');
                setShowCityDropdown(!showCityDropdown);
              }}>
              {form.ContactAddressDetails.city?.name?.en || 'Select City'}
            </div>

            {showCityDropdown && (
              <div className="absolute z-50 bg-white border w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-auto">
                <input placeholder="Search city…" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="px-3 py-2 border-b w-full outline-none text-sm" />

                {cities?.map((ct) => (
                  <div
                    key={ct.name.en}
                    onClick={() => {
                      setField('ContactAddressDetails.city', ct); // ✅ object
                      setShowCityDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm">
                    {ct.name.en}
                  </div>
                ))}
              </div>
            )}
            {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
          </div>
        </div>

        {/* BANK DETAILS */}
        <h3 className="text-lg font-semibold mb-3">Bank Details (Refund)</h3>

        {form.BankDetails.array.map((b, i) => (
          <div key={i} className="border p-4 rounded-lg mb-5">
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold">Bank #{i + 1}</h4>
              {form.BankDetails.array.length > 1 && (
                <button className="text-red-600 flex items-center gap-1" onClick={() => removeBank(i)}>
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ACCOUNT NUMBER */}
              <div>
                <label className="text-xs">Account Number</label>
                <input
                  placeholder="Enter bank account number"
                  value={b.accountNumber}
                  inputMode="numeric"
                  minLength={9}
                  maxLength={18}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 18);
                    setField(`BankDetails.array.${i}.accountNumber`, value);
                  }}
                  className="border rounded-md px-3 py-2 w-full"
                />
                {errors[`acc_${i}`] && <p className="text-red-500 text-xs">{errors[`acc_${i}`]}</p>}
              </div>

              {/* CONFIRM ACCOUNT NUMBER */}
              <div>
                <label className="text-xs">Confirm Account Number</label>
                <input
                  placeholder="Re-enter account number"
                  value={b.cnfaccountNumber}
                  inputMode="numeric"
                  minLength={9}
                  maxLength={18}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 18);
                    setField(`BankDetails.array.${i}.cnfaccountNumber`, value);
                  }}
                  className="border rounded-md px-3 py-2 w-full"
                />
                {errors[`cnf_${i}`] && <p className="text-red-500 text-xs">{errors[`cnf_${i}`]}</p>}
              </div>

              {/* IFSC */}
              <div className="col-span-2">
                <label className="text-xs">IFSC Code</label>
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Enter IFSC code (e.g. SBIN0000123) And Verify"
                    value={b.ifscCode}
                    onChange={(e) => setField(`BankDetails.array.${i}.ifscCode`, e.target.value.toUpperCase())}
                    className="border rounded-md px-3 py-2 w-full"
                  />

                  <button disabled={verifyLoading} onClick={() => handleVerifyIFSC(i, b.ifscCode)} className="bg-green-600 text-white px-4 py-2 rounded-md">
                    {verifyLoading ? '...' : 'Verify'}
                  </button>

                  {b._verified && <Check className="text-green-600" />}
                </div>
                {errors[`ifsc_${i}`] && <p className="text-red-500 text-xs">{errors[`ifsc_${i}`]}</p>}
              </div>

              {/* BANK NAME */}
              <div>
                <label className="text-xs">Bank Name</label>
                <input placeholder="Enter bank name" value={b.bankName} onChange={(e) => setField(`BankDetails.array.${i}.bankName`, e.target.value)} className="border rounded-md px-3 py-2 w-full" />
              </div>

              {/* BRANCH ADDRESS */}
              <div>
                <label className="text-xs">Branch Address (Optional)</label>
                <input placeholder="Enter branch address (optional)" value={b.bankAddress} onChange={(e) => setField(`BankDetails.array.${i}.bankAddress`, e.target.value)} className="border rounded-md px-3 py-2 w-full" />
              </div>

              {/* ACCOUNT TYPE */}
              <div>
                <label className="text-xs">Account Type</label>
                <select value={b.accountType} onChange={(e) => setField(`BankDetails.array.${i}.accountType`, e.target.value)} className="border rounded-md px-3 py-2 w-full">
                  <option value="">Select account type</option>
                  <option value="SB">Saving Account</option>
                  <option value="CA">Current Account</option>
                  <option value="CC">Cash Credit Account</option>
                  <option value="OD">Over draft account</option>
                  <option value="NRO">Non Resident Account</option>
                  <option value="OTH">Other</option>
                </select>
                {errors[`accountType_${i}`] && <p className="text-red-500 text-xs">{errors[`accountType_${i}`]}</p>}
              </div>

              {/* ACCOUNT HOLDER TYPE */}
              <div>
                <label className="text-xs">Account Holder Type</label>

                <select value={b.accountHolderType || ''} onChange={(e) => setField(`BankDetails.array.${i}.accountHolderType`, e.target.value)} className="border rounded-md px-3 py-2 w-full">
                  <option value="">Select holder type</option>
                  <option value="Self">Self</option>
                  <option value="Joint">Joint</option>
                </select>

                {/* ✅ ADD THIS */}
                {errors[`accountHolderType_${i}`] && <p className="text-red-500 text-xs">{errors[`accountHolderType_${i}`]}</p>}
              </div>

              {/* NOMINEE REGISTERED */}
              <div>
                <label className="text-xs">Nominee Registered?</label>
                <select value={b.nominate} onChange={(e) => setField(`BankDetails.array.${i}.nominate`, e.target.value)} className="border rounded-md px-3 py-2 w-full">
                  <option>No</option>
                  <option>Yes</option>
                </select>
                {errors[`nominee_${i}`] && <p className="text-red-500 text-xs">{errors[`nominee_${i}`]}</p>}
              </div>

              {/* NOMINEE NAME */}
              {b.nominate === 'Yes' && (
                <div>
                  <label className="text-xs">Nominee Name</label>
                  <input placeholder="Enter nominee full name" value={b.nomineeName} onChange={(e) => setField(`BankDetails.array.${i}.nomineeName`, e.target.value)} className="border rounded-md px-3 py-2 w-full" />
                </div>
              )}
            </div>

            {/* DEFAULT ACCOUNT */}
            <div className="mt-3 flex items-center">
              <input type="checkbox" checked={b.isDefaultACC === 'true'} onChange={() => setDefaultBank(i)} />
              <span className="ml-2">Default Refund Account</span>
            </div>
          </div>
        ))}

        <button onClick={addBank} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-md mb-6">
          <Plus size={16} /> Add Bank
        </button>

        {/* ACTION BUTTONS */}
        <div className="sticky bottom-0 z-10  flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-md bg-white text-black">
            Cancel
          </button>

          <button onClick={handleSubmit} disabled={!panVerified || addLoading || updateLoading} className="bg-blue-600 text-white px-8 py-2 rounded-md disabled:opacity-60">
            {mode === 'add' ? (addLoading ? 'Saving...' : 'Save') : updateLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewTaxpayerModal;
