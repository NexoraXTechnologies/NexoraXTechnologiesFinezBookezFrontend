import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";


import {
  registerProfessional,
  checkProfessionalParentUser,
  registerChildProfessional,
} from "../redux/slices/professionalSlice/professionalAuthSlice";
import ProfessionalImg from "../assets/images/bgremoved.png";
import { verifyPan, resetVerifyPan } from '../redux/slices/professionalSlice/panVerify/panVerify';

const ProfessionalRegister = () => {
  const { parentUserExists, parentUserData, loading } = useSelector(
    (state) => state.professionalAuth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [role, setRole] = useState("Child");
  const [parentNumber, setParentNumber] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [isParentMatched, setIsParentMatched] = useState(null);
  const [panVerified, setPanVerified] = useState(false);
  const [panVerifyFailed, setPanVerifyFailed] = useState(false);
  const [panValue, setPanValue] = useState('');

  const { loading: panLoading, data: panData, error: panError } = useSelector((state) => state?.verifyPan);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  // Always uppercase PAN
  const handlePanChange = (e) => {
    const upper = e.target.value.toUpperCase();
    setValue('userPAN', upper, { shouldValidate: true });
    setPanValue(upper);
    setPanVerified(false);
    setPanVerifyFailed(false);
    dispatch(resetVerifyPan());
  };

  const handleVerifyParent = async () => {
    if (!parentNumber || parentNumber.length !== 10) {
      toast.error("Enter valid 10-digit Parent Number");
      return;
    }

    const res = await dispatch(checkProfessionalParentUser(parentNumber));

    const child = res?.payload?.user?.ChildUsers;

    if (
      res.meta.requestStatus === "fulfilled" &&
      res.payload.exists &&
      child?.parentUserMobileNumber === child?.userMobileNumberHash
    ) {
      toast.success("Parent matched!");
      setIsParentMatched(true);
      setOtpVerified(true);
    } else {
      toast.error("Parent does not match");
      setIsParentMatched(false);
      setOtpVerified(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      data.userPAN = data.userPAN.toUpperCase();
      data.userMobileNumberHash = data.userMobileNumberHash.toString();

      const payload = { ...data };

      if (role === "Parent") {
        // --- Parent Registration ---
        const res = await dispatch(registerProfessional(payload)).unwrap();

        toast.success(res.message || "Parent Registered Successfully!");
        navigate("/professional");
      } else {
        // --- Child Registration ---
        const childData = {
          ...payload,
          parentUserMobileNumber: parentNumber,
        };

        const res = await dispatch(
          registerChildProfessional({
            parentMobile: parentNumber,
            childData,
          })
        ).unwrap();

        toast.success(res.message || "Child User Added Successfully!");
        navigate("/professional");
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
    }
  };
  const handleVerifyPan = async () => {
    const pan = watch('userPAN')?.toUpperCase()?.trim();

    if (!pan) {
      toast.error('PAN is required');
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      toast.error('Enter a valid PAN');
      return;
    }

    try {
      const res = await dispatch(verifyPan({ pan })).unwrap();

      setPanVerified(true);
      setPanVerifyFailed(false);
      toast.success(res?.message || 'PAN verified successfully');
    } catch (err) {
      setPanVerified(false);
      setPanVerifyFailed(true);
      toast.error(err || 'PAN verification failed');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100 text-gray-900 py-6">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-[95%] max-w-5xl">
        {/* LOGO */}
        <div className="flex flex-col items-center mb-4">
          {/* <img
            src={ProfessionalImg}
            alt="Professional Logo"
            className="h-16 w-auto object-contain mb-2"
          /> */}
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent">User Registration</h2>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Name */}
          <div>
            <label className="text-xs font-medium">First Name</label>
            <input
              type="text"
              placeholder="Enter first name"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userFirstName', {
                required: 'First Name is required',
                pattern: {
                  value: /^[A-Za-z\s'-]+$/,
                  message: 'Only letters are allowed',
                },
              })}
            />
            {errors.userFirstName && <p className="text-red-500 text-xs">{errors.userFirstName.message}</p>}
          </div>

          {/* Middle Name */}
          <div>
            <label className="text-xs font-medium">Middle Name</label>
            <input
              type="text"
              placeholder="Enter middle name"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userMiddleName', {
                pattern: {
                  value: /^[A-Za-z\s'-]+$/,
                  message: 'Only letters are allowed',
                },
              })}
            />
            {errors.userMiddleName && <p className="text-red-500 text-xs">{errors.userMiddleName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="text-xs font-medium">Last Name</label>
            <input
              type="text"
              placeholder="Enter last name"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userLastName', {
                required: 'Last Name is required',
                pattern: {
                  value: /^[A-Za-z\s'-]+$/,
                  message: 'Only letters are allowed',
                },
              })}
            />
            {errors.userLastName && <p className="text-red-500 text-xs">{errors.userLastName.message}</p>}
          </div>

          {/* DOB */}
          <div>
            <label className="text-xs font-medium">
              Date of Birth
              <span className="text-[10px] text-gray-500"> (must be 18+)</span>
            </label>

            <input
              type="date"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
              {...register('userDOB', {
                required: 'Date of Birth is required',
                validate: (value) => {
                  const dob = new Date(value);
                  const today = new Date();
                  const age = today.getFullYear() - dob.getFullYear();
                  const monthDiff = today.getMonth() - dob.getMonth();
                  const dayDiff = today.getDate() - dob.getDate();

                  const is18OrOlder = age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

                  return is18OrOlder || 'You must be at least 18 years old';
                },
              })}
            />

            {errors.userDOB && <p className="text-red-500 text-xs">{errors.userDOB.message}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-medium">Gender</label>
            <select
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userGender', {
                required: 'Gender is required',
              })}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            {errors.userGender && <p className="text-red-500 text-xs">{errors.userGender.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userEmail', {
                required: 'Email is required',
              })}
            />
            {errors.userEmail && <p className="text-red-500 text-xs">{errors.userEmail.message}</p>}
          </div>
          {/* remove pan and aadhaar */}
          {/* PAN */}
          <div>
            <label className="text-xs font-medium">PAN</label>
            <div className="relative">
              <input
                type="text"
                maxLength={10}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-1.5 pr-24 border rounded-md uppercase text-sm"
                {...register('userPAN', {
                  required: 'PAN is required',
                  pattern: {
                    value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: 'Enter a valid PAN',
                  },
                })}
                onChange={handlePanChange}
              />

              <div className="absolute inset-y-0 right-2 flex items-center">
                {panVerified ? (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                ) : panVerifyFailed ? (
                  <button type="button" onClick={handleVerifyPan} className="text-red-500 font-bold text-lg px-1" title="Verification failed. Retry">
                    ✕
                  </button>
                ) : (
                  <button type="button" onClick={handleVerifyPan} disabled={panLoading} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md disabled:opacity-60">
                    {panLoading ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {errors.userPAN && <p className="text-red-500 text-xs">{errors.userPAN.message}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="text-xs font-medium">Mobile Number</label>
            <input
              type="text"
              maxLength={10}
              placeholder="Enter mobile number"
              inputMode="numeric"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userMobileNumberHash', {
                required: 'Mobile number is required',
                minLength: { value: 10, message: 'Must be 10 digits' },
                maxLength: { value: 10, message: 'Must be 10 digits' },
                validate: (v) => /^\d+$/.test(v) || 'Only digits allowed',
              })}
            />
            {errors.userMobileNumberHash && <p className="text-red-500 text-xs">{errors.userMobileNumberHash.message}</p>}
          </div>

          {/* Aadhaar */}
          <div>
            <label className="text-xs font-medium">Aadhaar</label>
            <input
              type="text"
              maxLength={12}
              placeholder="Enter 12-digit Aadhaar"
              inputMode="numeric"
              className="w-full px-3 py-1.5 border rounded-md text-sm"
              {...register('userAadhar', {
                required: 'Aadhaar is required',
              })}
            />
          </div>

          {/* User Type + Parent/Child */}
          <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="text-xs font-medium">User Type</label>
              <select
                className="w-full px-3 py-1.5 border rounded-md text-sm"
                {...register('userType', {
                  required: 'User type is required',
                })}>
                <option value="">Select Type</option>
                <option value="Tax Payer">Tax Payer/Employee</option>
                <option value="Company">Company</option>
                <option value="CA/CMA/Tax Consultant">CA/CMA/Tax Consultant</option>
              </select>
              {errors.userType && <p className="text-red-500 text-xs">{errors.userType.message}</p>}
            </div>

            <div className="flex flex-nowrap items-center gap-6 mt-4 md:mt-6 ml-1.5">
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="radio"
                  checked={role === 'Parent'}
                  onChange={() => {
                    setRole('Parent');
                    setOtpVerified(true);
                  }}
                />
                Register As Company
              </label>

              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="radio"
                  checked={role === 'Child'}
                  onChange={() => {
                    setRole('Child');
                    setOtpVerified(false);
                  }}
                />
                Register As Child
              </label>
            </div>

            {/* Parent Number Verify */}
            {role === 'Child' && (
              <div className="flex flex-col mt-4 md:mt-6 ml-1.0">
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    inputMode="numeric"
                    className="w-[150px] px-2 py-1 border rounded-md text-sm"
                    placeholder="Parent No"
                    value={parentNumber}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        setParentNumber(e.target.value);
                      }
                    }}
                  />

                  <button type="button" disabled={loading} onClick={handleVerifyParent} className="px-3 py-[7px] bg-blue-600 text-white rounded-md text-xs disabled:opacity-60">
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {isParentMatched === true && parentUserData?.ChildUsers && (
                  <p className="text-green-600 text-xs mt-1">
                    Parent Found: {parentUserData.ChildUsers.userFirstName} {parentUserData.ChildUsers.userLastName}
                  </p>
                )}

                {isParentMatched === false && <p className="text-red-500 text-xs mt-1">Parent user not found</p>}
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <div className="col-span-3 mt-3 flex justify-center">
            <button disabled={isSubmitting || (role === 'Child' && !otpVerified)} className="w-56 py-1.5 rounded-md bg-[#6e7cdb] text-white font-semibold disabled:opacity-60 text-sm cursor-pointer">
              {isSubmitting ? 'Submitting...' : 'Register'}
            </button>
          </div>
        </form>

        {/* <p className="text-center text-xs mt-4">
          Already have an account?
          <Link to="/login" className="text-blue-600 font-semibold ml-1">
            Login
          </Link>
        </p> */}
      </div>
    </div>
  );
};

export default ProfessionalRegister;
