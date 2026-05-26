import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import {
  getProfessionalProfile,
  updateProfessionalProfile,
} from "../../redux/slices/professionalSlice/professionalProfileSlice";
import { FaUserCircle, FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";
import {formatToDDMMYYYY,formatToInputDate} from '../../components/common/DateFormator'

const ProfessionalProfile = () => {
  const dispatch = useDispatch();
  const { profile, loading, updateSuccess } = useSelector(
    (state) => state.professionalProfile
  );

  const [preview, setPreview] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch profile on mount
  useEffect(() => {
    dispatch(getProfessionalProfile());
  }, [dispatch]);

  // Reset form when profile is fetched
  useEffect(() => {
  if (profile) {

    reset({
      userFirstName: profile.userFirstName || "",
      userMiddleName: profile.userMiddleName || "",
      userLastName: profile.userLastName || "",
      userDOB: formatToInputDate(profile.userDOB),
      userEmail: profile.userEmail || "",
      userAadhar: profile.userAadhar || "",
      userPAN: profile.userPAN || "",
      userMobileNumberHash: profile.userMobileNumberHash || "",
      userType: profile.userType || "",
      isUserActive: profile.isUserActive || "0",
      parentUserMobileNumber: profile.parentUserMobileNumber || "",
    });

    setPreview(profile.profilePic || null);
  }
}, [profile, reset]);

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

  // Image upload preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // DOB validation (must be 18+)
  const isAdult = (dobString) => {
    const today = new Date();
    const dob = new Date(dobString);
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    return age > 18 || (age === 18 && m >= 0);
  };

  // Submit handler
  const onSubmit = async (data) => {
  if (data.userDOB && !isAdult(data.userDOB)) {
    toast.error("User must be at least 18 years old.");
    return;
  }

  let base64Image = null;
  if (profilePicFile) {
    base64Image = await fileToBase64(profilePicFile);
  }


  const payload = {
    ChildUser: {
      matchMobile: profile?.userMobileNumberHash,
      userFirstName: data.userFirstName,
      userMiddleName: data.userMiddleName,
      userLastName: data.userLastName,

      // ✅ send in dd-mm-yyyy
      ...(data.userDOB && { userDOB: data.userDOB }),

      ...(data.userEmail && { userEmail: data.userEmail }),
      ...(data.userPAN && { userPAN: data.userPAN }),
      ...(data.userAadhar && { userAadhar: data.userAadhar }),
      ...(base64Image && { profilePic: base64Image }),
    },
  };

  try {
    const res = await dispatch(updateProfessionalProfile(payload)).unwrap();
    toast.success("Profile updated successfully!");
    dispatch(getProfessionalProfile())
  } catch (err) {
    toast.error(err?.message || "Failed to update profile");
  }
};

  // // Show toast after update
  // useEffect(() => {
  //   if (updateSuccess) toast.success("Profile updated successfully!");
  // }, [updateSuccess]);


  return (
    <div className="flex py-4 px-4 sm:px-6 mx-auto w-full">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-6xl p-4 sm:p-8 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-10">
          {/* LEFT SECTION — FORM */}
          <div id="profile-section" className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              My Profile
            </h2>

            {loading ? (
              <p className="text-center text-gray-500">Loading profile...</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      First Name
                    </label>
                    <input
                      {...register("userFirstName", { required: "Required" })}
                      placeholder="First Name"
                      className="border p-2 rounded-md w-full"
                    />
                    {errors.userFirstName && (
                      <p className="text-red-500 text-sm">
                        {errors.userFirstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Middle Name
                    </label>
                    <input
                      {...register("userMiddleName")}
                      placeholder="Middle Name"
                      className="border p-2 rounded-md w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Last Name
                    </label>
                    <input
                      {...register("userLastName", { required: "Required" })}
                      placeholder="Last Name"
                      className="border p-2 rounded-md w-full"
                    />
                  </div>
                </div>

                {/* DOB + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Date of Birth
                    </label>
                    <input
                      {...register("userDOB")}
                      type="date"
                       readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <input
                      {...register("userEmail")}
                      type="email"
                      placeholder="Enter Email"
                       readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* PAN + Aadhar + User Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      PAN
                    </label>
                    <input
                      {...register("userPAN")}
                      placeholder="Enter PAN"
                      readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Aadhar
                    </label>
                    <input
                      {...register("userAadhar")}
                      placeholder="Enter Aadhar"
                       readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      User Type
                    </label>
                    <input
                      {...register("userType")}
                      readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* Non-editable info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Mobile
                    </label>
                    <input
                      {...register("userMobileNumberHash")}
                      readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                        Subscription Status
                    </label>
                    <input
                      value={
                        profile?.isUserActive === "1" ? "Active" : "Inactive"
                      }
                      readOnly
                      className={`border p-2 rounded-md w-full bg-gray-100 ${
                        profile?.isUserActive === "1"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Parent Mobile
                    </label>
                    <input
                      {...register("parentUserMobileNumber")}
                      readOnly
                      className="border p-2 rounded-md w-full bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="text-right mt-4">
                  <button id="profile-update-button"
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-white font-semibold rounded-md bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Saving..." : "Update Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT SECTION — PHOTO */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="w-40 h-40 object-cover rounded-full border-4 border-blue-500 shadow-md"
                />
              ) : (
                <FaUserCircle className="text-[160px] text-gray-400" />
              )}
              <label id="profile-upload-button" className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <FaUpload />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-4 text-gray-700 font-medium">
              {profile?.userFirstName} {profile?.userLastName}
            </p>
            <p className="text-sm text-gray-500">{profile?.userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfile;