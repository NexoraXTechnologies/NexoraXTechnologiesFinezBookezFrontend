import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getProfessionalUsers,
  addProfessionalUser,
  deleteProfessionalUser,
  updateProfessionalUser,
} from "../../redux/slices/professionalSlice/professionalUserSlice";

import { verifyPanWithHeader, resetVerifyPan } from '../../redux/slices/professionalSlice/panVerify/panVerify';
import { toast } from "react-toastify";
import { RefreshCcw, Trash2, Plus, Edit } from "lucide-react";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import { formatToDDMMYYYY } from '../../components/common/DateFormator';
import SearchInput from "../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/pagination";
import Modal from "../../components/modal";
import { SelectInput, TextInput } from "../../components/inputs";

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
  const [editingAccount, setEditingAccount] = useState(null);
  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    mobile: null,
  });
  // console.log(updateProfessionalUser);
  // console.log(updateProfessionalUser.typePrefix);

  const [formData, setFormData] = useState({
    userFirstName: "",
    userMiddleName: "",
    userLastName: "",
    userGender: "",
    userDOB: "",
    userEmail: "",
    userMobileNumberHash: "",
    userPAN: "",
    // userAadhar: "",
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

      //   case "userAadhar":
      //     if (!/^\d{12}$/.test(value)) error = "Aadhar must be 12 digits";
      //     break;

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

    // if (!/^\d{12}$/.test(formData.userAadhar))
    //   newErrors.userAadhar = "Aadhar must be 12 digits";

    if (!formData.userType) newErrors.userType = "User type is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // if (name === 'userMobileNumberHash' || name === 'userAadhar') newValue = value.replace(/\D/g, '');

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
      if (editingAccount) {
        const updatePayload = {};

        const fields: any = ["userFirstName", "userLastName", "userGender", "userDOB", "userEmail", "userMobileNumberHash", "userPAN", "userType"];
        fields.forEach((field) => {
          if (formData[field] !== editingAccount[field]) updatePayload[field] = formData[field];
        });
        console.log({ updatePayload, editingAccount })
        try {
          await dispatch(updateProfessionalUser({ parentMobile: editingAccount?.parentUserMobileNumber, data: { ChildUser: { matchMobile: editingAccount?.userMobileNumberHash, ...updatePayload } } }));
        } catch (err) {
          console.log("OUTER ERROR", err);
        }

        toast.success("Account updated successfully");
      } else {
        await dispatch(
          addProfessionalUser({
            ...formData,
            userPAN: formData.userPAN.toUpperCase(),
          })
        ).unwrap();
      }
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
      //   userAadhar: '',
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

  const openEditModal = (acc: any) => {
    console.log({ acc })
    setEditingAccount(acc);
    setFormData({
      userFirstName: acc.userFirstName,
      userMiddleName: acc.userMiddleName,
      userLastName: acc.userLastName,
      userGender: acc.userGender,
      userDOB: acc.userDOB,
      userEmail: acc.userEmail,
      userMobileNumberHash: acc?.userMobileNumberHash,
      userPAN: acc?.userPAN,
      userType: acc?.userType
    });
    setShowModal(true);
  };

  const columns = [
    {
      key: 'name', title: 'Name',
      render: (row:any) => (
        <>
          {`${row.userFirstName} ${row.userMiddleName ?? ''} ${row.userLastName}`}
        </>
      ),
    },
    { key: 'userEmail', title: 'Email', },
    { key: 'userMobileNumberHash', title: 'Mobile', },
    // { key: 'userAadhar', title: 'Aadhaar', },
    {
      key: 'accountEmail', title: 'DOB', 
      render: (row: any) => (
        <>
          {formatToDDMMYYYY(row.userDOB)}
        </>
      ),
    },
    { key: 'userType', title: 'Type', },
    { key: 'userGender', title: 'Gender', },
  ];

  return (
    <div className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-wrap justify-end items-center gap-2 mb-4">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput {...{ search: searchTerm, setSearch: setSearchTerm }} />
          <DataREfreshButton {...{ callBackFn: handleRefresh }} />
          <DataCreateButton {...{ callBackFn: () => setShowModal(true), text: "Add Team/Employee" }} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No accounts found"
        actions={(each) => (
          <div className="flex items-center gap-2">
            <button
              id="account-edit-button"
              onClick={() => openEditModal(each)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setConfirmTooltip({
                  show: true,
                  x: rect.left + window.scrollX - 160,
                  y: rect.top + window.scrollY - 5,
                  mobile: each.userMobileNumberHash,
                });
              }}
              className="text-red-600 hover:text-red-800">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal {...{
        show: showModal, setShow: () => {
          setShowModal(false);
          resetUserForm();
        }, handleSubmit, title: "Team/Employee", state: editingAccount,
        body: <>
          {/* FIRST NAME */}
          <TextInput {...{ label: "First Name", name: "userFirstName", mandatory: true, value: formData.userFirstName, onChange: handleChange, placeholder: "Enter first name", error: errors.userFirstName }} />
          <TextInput {...{ label: "Middle Name", name: "userMiddleName", mandatory: false, value: formData.userMiddleName, onChange: handleChange, placeholder: "Enter middle name (optional)" }} />
          <TextInput {...{ label: "Last Name", mandatory: true, name: "userLastName", value: formData.userLastName, onChange: handleChange, placeholder: "Enter last name", error: errors.userLastName }} />
          <SelectInput {...{
            label: "Gender", mandatory: true, value: formData.userGender, name: "userGender",
            onChange: handleChange, placeholder: "Select account type", error: errors.userGender,
            options: [
              { value: "", label: "Select gender" },
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" }
            ]
          }} />
          <TextInput {...{ label: "Date of Birth", name: "userDOB", mandatory: true, value: formData.userDOB, onChange: handleChange, placeholder: "Select DOB", type: "date", error: errors.userDOB }} />
          <TextInput {...{ label: "Email", name: "userEmail", mandatory: true, value: formData.userEmail, onChange: handleChange, placeholder: "Enter email address", error: errors.userEmail }} />
          <TextInput {...{ label: "Mobile Number", maxLength: 10, name: "userMobileNumberHash", mandatory: true, value: formData.userMobileNumberHash, onChange: handleChange, placeholder: "Enter 10-digit mobile number", error: errors.userMobileNumberHash }} />

          {/* PAN */}
          <div>
            <label className="text-sm font-medium text-gray-700">PAN</label>
            <div className="relative">
              <input name="userPAN" maxLength={10} value={formData.userPAN} onChange={handleChange} placeholder="Enter PAN (ABCDE1234F)" className="w-full h-11 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />
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
          {/* USER TYPE */}
          <SelectInput {...{
            label: "User Type", mandatory: true, value: formData.userType, name: "userType",
            onChange: handleChange, placeholder: "Select user type", error: errors.userType,
            options: [
              { value: "", label: "Select user type" },
              { value: "Tax Payer/Employee", label: "Tax Payer/Employee" },
              { value: "Company", label: "Company" },
              { value: "CA/CMA/Tax Consultant", label: "CA/CMA/Tax Consultant" }
            ]
          }} />
        </>
      }} />

      {totalCount > 0 && <Pagination  {...{
        localLimit, selectCb: (e) => {
          setLocalLimit(Number(e.target.value));
          setLocalPage(1);
        },
        preDisabled: page === 1,
        nextDisabled: page === totalPages,
        setLocalOffset: setLocalPage, pagination
      }} />}

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
