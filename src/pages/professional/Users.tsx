import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getProfessionalUsers,
  addProfessionalUser,
  deleteProfessionalUser,
} from "../../redux/slices/professionalSlice/professionalUserSlice";

import { verifyPanWithHeader, resetVerifyPan } from '../../redux/slices/professionalSlice/panVerify/panVerify';
import { toast } from "react-toastify";
import { RefreshCcw, Trash2, Plus } from "lucide-react";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import { formatToInputDate,formatToDDMMYYYY} from '../../components/common/DateFormator'
const Users = () => {
  const dispatch = useDispatch();
  const { users, loading, pagination } = useSelector((s) => s.professionalUser);
  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { loading: panLoading } = useSelector((s) => s.verifyPan);

  const [panVerified, setPanVerified] = useState(false);
  const [panVerifyFailed, setPanVerifyFailed] = useState(false);

  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    mobile: null,
  });

  const [formData, setFormData] = useState({
    userFirstName: "",
    userMiddleName: "",
    userLastName: "",
    userGender: "",
    userDOB: "",
    userEmail: "",
    userMobileNumberHash: "",
    userPAN: "",
    userAadhar: "",
    userType: "",
  });

  const [errors, setErrors] = useState({});

  // Fetch users
 useEffect(() => {
   dispatch(getProfessionalUsers({ page: localPage, limit: localLimit }));
 }, [dispatch, localPage, localLimit]);

 const handleRefresh = async () => {
   setRefreshing(true);
   await dispatch(getProfessionalUsers({ page: localPage, limit: localLimit }));
   toast.success('List refreshed');
   setRefreshing(false);
 };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const name = `${u.userFirstName} ${u.userLastName}`.toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      u.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userMobileNumberHash?.includes(searchTerm)
    );
  });

  // LIVE FIELD VALIDATION
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "userFirstName":
        if (!value.trim()) error = "First name is required";
        break;

      case "userLastName":
        if (!value.trim()) error = "Last name is required";
        break;

      case "userGender":
        if (!value) error = "Gender is required";
        break;

      case "userDOB":
        if (!value) {
          error = "DOB is required";
        } else {
          const dob = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - dob.getFullYear();
          if (age < 18) error = "User must be 18+";
        }
        break;

      case "userEmail":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email";
        break;

      case "userMobileNumberHash":
        if (!/^\d{10}$/.test(value)) error = "Mobile must be 10 digits";
        break;

      case "userPAN":
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
    error = "Enter valid PAN";
  } else if (!panVerified) {
    error = "Please verify PAN";
  }
  break;

      case "userAadhar":
        if (!/^\d{12}$/.test(value)) error = "Aadhar must be 12 digits";
        break;

      case "userType":
        if (!value) error = "User type is required";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // GLOBAL VALIDATION (Before Submit)
  const validate = () => {
    const newErrors = {};

    if (!formData.userFirstName.trim())
      newErrors.userFirstName = "First name is required";

    if (!formData.userLastName.trim())
      newErrors.userLastName = "Last name is required";

    if (!formData.userGender) newErrors.userGender = "Gender is required";

    if (!formData.userDOB) newErrors.userDOB = "DOB is required";
    else {
      const dob = new Date(formData.userDOB);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 18) newErrors.userDOB = "User must be 18+";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail))
      newErrors.userEmail = "Invalid email";

    if (!/^\d{10}$/.test(formData.userMobileNumberHash))
      newErrors.userMobileNumberHash = "Mobile must be 10 digits";

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.userPAN)) {
      newErrors.userPAN = 'Enter valid PAN';
    } else if (!panVerified) {
      newErrors.userPAN = 'Please verify PAN';
    }

    if (!/^\d{12}$/.test(formData.userAadhar))
      newErrors.userAadhar = "Aadhar must be 12 digits";

    if (!formData.userType) newErrors.userType = "User type is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'userMobileNumberHash' || name === 'userAadhar') newValue = value.replace(/\D/g, '');

    if (name === 'userPAN') {
      newValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10);
      setPanVerified(false);
      setPanVerifyFailed(false);
      dispatch(resetVerifyPan());
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    validateField(name, newValue);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await dispatch(
        addProfessionalUser({
          ...formData,
          userPAN: formData.userPAN.toUpperCase(),
        })
      ).unwrap();

      toast.success("Employee/Team added successfully");

      setShowModal(false);
resetUserForm();

      setLocalPage(1);
      dispatch(getProfessionalUsers({ page: 1, limit: localLimit }));
    } catch (err) {
      toast.error(err?.message || "Failed to add Employee/Team");
    }
  };

  // Delete User
  const handleDelete = async (mobile) => {
    try {
      await dispatch(deleteProfessionalUser(mobile)).unwrap();
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, mobile: null });
    }
  };
  const totalCount = pagination?.totalDocs ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const page = pagination?.currentPage ?? localPage;
  const limit = pagination?.limit ?? localLimit;

  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalCount);


  const resetUserForm = () => {
    setFormData({
      userFirstName: '',
      userMiddleName: '',
      userLastName: '',
      userGender: '',
      userDOB: '',
      userEmail: '',
      userMobileNumberHash: '',
      userPAN: '',
      userAadhar: '',
      userType: '',
    });
    setErrors({});
    setPanVerified(false);
    setPanVerifyFailed(false);
    dispatch(resetVerifyPan());
  };
  const handleVerifyPan = async () => {
    const pan = (formData.userPAN || '').trim().toUpperCase();

    if (!pan) {
      toast.error('PAN is required');
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      setPanVerified(false);
      setPanVerifyFailed(true);
      setErrors((prev) => ({
        ...prev,
        userPAN: 'Enter valid PAN',
      }));
      toast.error('Enter valid PAN');
      return;
    }

    try {
      const res = await dispatch(verifyPanWithHeader({ pan })).unwrap();

      setPanVerified(true);
      setPanVerifyFailed(false);
      setErrors((prev) => ({
        ...prev,
        userPAN: '',
      }));

      toast.success(res?.message || 'PAN verified successfully');
    } catch (err) {
      setPanVerified(false);
      setPanVerifyFailed(true);
      setErrors((prev) => ({
        ...prev,
        userPAN: 'PAN verification failed',
      }));

      toast.error(err || 'PAN verification failed');
    }
  };
  return (
    <div className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-wrap justify-end items-center gap-2 mb-4">
        <div className="flex gap-2 items-center">
          <input type="text" placeholder="Search user..." className="border rounded-md pl-2 pr-3 py-1 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

          <button onClick={handleRefresh} className="border rounded-md px-2 py-1.5 mr-2">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>

        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1">
          <Plus size={16} /> <span className="hidden sm:inline">Add Employee/Team</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm text-gray-700 border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-3 py-2 text-left ">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Mobile</th>
              <th className="px-3 py-2 text-left">Aadhar</th>
              <th className="px-3 py-2 text-left">DOB</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Gender</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.userMobileNumberHash} className="border-b">
                  <td className="px-3 py-2">{`${u.userFirstName} ${u.userMiddleName ?? ''} ${u.userLastName}`}</td>
                  <td className="px-3 py-2">{u.userEmail}</td>
                  <td className="px-3 py-2">{u.userMobileNumberHash}</td>
                  <td className="px-3 py-2">{u.userAadhar}</td>
                  <td className="px-3 py-2">{formatToDDMMYYYY(u.userDOB)}</td>
                  <td className="px-3 py-2">{u.userType}</td>
                  <td className="px-3 py-2">{u.userGender}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setConfirmTooltip({
                          show: true,
                          x: rect.left + window.scrollX - 160,
                          y: rect.top + window.scrollY - 5,
                          mobile: u.userMobileNumberHash,
                        });
                      }}
                      className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {loading && <div className="text-center py-3 text-gray-500">Loading...</div>}
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-3">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg relative">
            <button
              onClick={() => {
                setShowModal(false);
                resetUserForm();
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg">
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4">Add Team/Employee</h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* FIRST NAME */}
              <div>
                <label className="block text-sm font-medium">First Name</label>
                <input name="userFirstName" value={formData.userFirstName} onChange={handleChange} placeholder="Enter first name" className="border p-2 rounded-md w-full" />
                {errors.userFirstName && <p className="text-red-500 text-xs">{errors.userFirstName}</p>}
              </div>

              {/* MIDDLE NAME */}
              <div>
                <label className="block text-sm font-medium">Middle Name</label>
                <input name="userMiddleName" value={formData.userMiddleName} onChange={handleChange} placeholder="Enter middle name (optional)" className="border p-2 rounded-md w-full" />
              </div>

              {/* LAST NAME */}
              <div>
                <label className="block text-sm font-medium">Last Name</label>
                <input name="userLastName" value={formData.userLastName} onChange={handleChange} placeholder="Enter last name" className="border p-2 rounded-md w-full" />
                {errors.userLastName && <p className="text-red-500 text-xs">{errors.userLastName}</p>}
              </div>

              {/* GENDER */}
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select name="userGender" value={formData.userGender} onChange={handleChange} className="border p-2 rounded-md w-full">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                {errors.userGender && <p className="text-red-500 text-xs">{errors.userGender}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium">Date of Birth</label>
                <input type="date" name="userDOB" value={formData.userDOB} onChange={handleChange} placeholder="Select DOB" className="border p-2 rounded-md w-full" />
                {errors.userDOB && <p className="text-red-500 text-xs">{errors.userDOB}</p>}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" name="userEmail" value={formData.userEmail} onChange={handleChange} placeholder="Enter email address" className="border p-2 rounded-md w-full" />
                {errors.userEmail && <p className="text-red-500 text-xs">{errors.userEmail}</p>}
              </div>

              {/* MOBILE */}
              <div>
                <label className="block text-sm font-medium">Mobile Number</label>
                <input name="userMobileNumberHash" maxLength={10} value={formData.userMobileNumberHash} onChange={handleChange} placeholder="Enter 10-digit mobile number" className="border p-2 rounded-md w-full" />
                {errors.userMobileNumberHash && <p className="text-red-500 text-xs">{errors.userMobileNumberHash}</p>}
              </div>

              {/* PAN */}
              <div>
                <label className="block text-sm font-medium">PAN</label>

                <div className="relative">
                  <input name="userPAN" maxLength={10} value={formData.userPAN} onChange={handleChange} placeholder="Enter PAN (ABCDE1234F)" className="border p-2 rounded-md uppercase w-full pr-24" />

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

                {errors.userPAN && <p className="text-red-500 text-xs">{errors.userPAN}</p>}
              </div>

              {/* AADHAR */}
              <div>
                <label className="block text-sm font-medium">Aadhar</label>
                <input name="userAadhar" maxLength={12} value={formData.userAadhar} onChange={handleChange} placeholder="Enter 12-digit Aadhar number" className="border p-2 rounded-md w-full" />
                {errors.userAadhar && <p className="text-red-500 text-xs">{errors.userAadhar}</p>}
              </div>

              {/* USER TYPE */}
              <div>
                <label className="block text-sm font-medium">User Type</label>
                <select name="userType" value={formData.userType} onChange={handleChange} className="border p-2 rounded-md w-full">
                  <option value="">Select user type</option>
                  <option>Tax Payer/Employee</option>
                  <option>Company</option>
                  <option>CA/CMA/Tax Consultant</option>
                </select>
                {errors.userType && <p className="text-red-500 text-xs">{errors.userType}</p>}
              </div>

              {/* BUTTONS */}
              <div className="col-span-2 flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetUserForm();
                  }}
                  className="px-3 py-1 border rounded-md">
                  Cancel
                </button>
                <button type="submit" disabled={panLoading || !panVerified} className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-60">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Pagination */}
      {totalCount > 0 && (
        <div id="users-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-gray-600">
              Rows per page:
            </label>
            <select
              id="limit"
              value={localLimit}
              onChange={(e) => {
                setLocalLimit(Number(e.target.value));
                setLocalPage(1);
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
              {startIndex}–{endIndex}
            </strong>{' '}
            of <strong>{totalCount}</strong> | Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLocalPage(1)} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              First
            </button>
            <button onClick={() => setLocalPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Prev
            </button>
            <button onClick={() => setLocalPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Next
            </button>
            <button onClick={() => setLocalPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Last
            </button>
          </div>
        </div>
      )}

      {/* DELETE TOOLTIP */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this user?"
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={() => handleDelete(confirmTooltip.mobile)}
          onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, mobile: null })}
        />
      )}
    </div>
  );
};

export default Users;
