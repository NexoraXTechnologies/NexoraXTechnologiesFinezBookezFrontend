import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FaIdCard,
  FaMobileAlt,
  FaShieldAlt,
  FaUpload,
  FaUser,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { getProfessionalProfile, updateProfessionalProfile } from "../../redux/slices/professionalSlice/professionalProfileSlice";
// ⭐ UPDATED
import { getCitiesByState, getStates } from "../../redux/slices/professionalSlice/stateCitySlice";
import { formatToInputDate } from "../../components/common/DateFormator";
import { SelectInput, TextInput } from "../../components/inputs";

type ProfileFormValues = {
  userFirstName: string;
  userMiddleName: string;
  userLastName: string;
  userDOB: string;
  userEmail: string;
  userAadhar: string;
  userPAN: string;
  userMobileNumberHash: string;
  userType: string;
  userGender: string;
  businessType: string;
  // ⭐ UPDATED
  state: string;
  city: string;
  isUserActive: string;
  parentUserMobileNumber: string;
};

const userTypeOptions = [
  { label: "All", value: "" },
  { label: "Employee", value: "Employee" },
  { label: "Company", value: "Company" },
  { label: "Individual Tax Payer", value: "Individual Tax Payer" },
  { label: "CA/CMA/Tax Consultant", value: "CA/CMA/Tax Consultant" },
];

const businessTypeOptions = [
  { label: "All", value: "" },
  { label: "Manufacturing / Production", value: "manufacturing/production" },
  { label: "Traders / Distributors", value: "traders/distributors" },
  { label: "Retail Business", value: "retail business" },
  { label: "FMCG & Distribution", value: "fmcg & distribution" },
  { label: "Service Business", value: "service business" },
  { label: "Construction & Projects", value: "construction & projects" },
];

const genderTypeOptions = [
  { label: "All", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const LoadingSkeleton = () => (
  <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 11 }).map((_, index) => (
      <div key={index} className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-10 rounded-lg bg-muted" />
      </div>
    ))}
  </div>
);

const ProfessionalProfile = () => {
  const dispatch = useDispatch<any>();

  const { profile, loading } = useSelector(
    (state: any) => state.professionalProfile
  );

  // ⭐ UPDATED
  const { states = [], cities = [], loading: stateCityLoading } = useSelector((state: any) => state.stateCity || {});

  const [preview, setPreview] = useState<string | null>(null);

  // ⭐ YELLOW STAR: ADDED — STORE ONLY NEWLY SELECTED IMAGE AS BASE64
  const [profileImageBase64, setProfileImageBase64] = useState<string>("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      userFirstName: "",
      userMiddleName: "",
      userLastName: "",
      userDOB: "",
      userEmail: "",
      userAadhar: "",
      userPAN: "",
      userMobileNumberHash: "",
      userType: "",
      userGender: "",
      businessType: "",
      // ⭐ UPDATED
      state: "",
      city: "",
      isUserActive: "0",
      parentUserMobileNumber: "",
    },
  });

  // ⭐ YELLOW STAR: UPDATED — REUSE COMMON TextInput / SelectInput COMPONENTS

  // ⭐ UPDATED
  const getDisplayName = (name: any) => {
    if (!name) return "";
    if (typeof name === "string") return name;
    if (typeof name === "object") return name.en || name.mr || name.hi || name.gu || name.ta || name.te || name.kn || name.ml || name.pa || "";
    return String(name);
  };

  // ⭐ UPDATED
  const selectedState = watch("state");

  // ⭐ UPDATED
  const stateOptions = useMemo(() => [
    { label: "Select state", value: "" },
    ...(states || []).map((item: any) => {
      const stateCode = item?.isoCode || item?.stateCode || item?.code || "";
      const stateName = getDisplayName(item?.name || item?.stateName);
      return { label: stateName || stateCode, value: stateCode };
    }),
  ], [states]);

  // ⭐ UPDATED
  const cityOptions = useMemo(() => [
    { label: !selectedState ? "Select state first" : stateCityLoading ? "Loading..." : "Select city", value: "" },
    ...(cities || []).map((item: any) => {
      const cityName = getDisplayName(item?.name || item?.cityName);
      return { label: cityName, value: cityName };
    }),
  ], [cities, selectedState, stateCityLoading]);

  const fullName = useMemo(() => {
    return [profile?.userFirstName, profile?.userMiddleName, profile?.userLastName]
      .filter(Boolean)
      .join(" ") || "Professional User";
  }, [profile]);

  // ⭐ YELLOW STAR: UPDATED — API VALUE "1" MEANS ACTIVE
  // const isActive = String(profile?.isUserActive ?? "") === "1";
  const isActive = profile?.isUserActive !== "0";
  console.log({ profile })
  useEffect(() => {
    dispatch(getProfessionalProfile());
  }, [dispatch]);

  // ⭐ UPDATED
  useEffect(() => {
    dispatch(getStates("") as any);
  }, [dispatch]);

  // ⭐ UPDATED
  useEffect(() => {
    if (!selectedState) return;
    dispatch(getCitiesByState({ stateCode: selectedState, searchText: "" }) as any);
  }, [dispatch, selectedState]);

  useEffect(() => {
    if (!profile) return;

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
      userGender: profile.userGender || "",
      businessType: profile.businessType || "",
      // ⭐ UPDATED
      state: typeof profile.state === "object" ? profile.state?.isoCode || profile.state?.stateCode || profile.state?.code || "" : profile.state || "",
      city: typeof profile.city === "object" ? getDisplayName(profile.city?.name || profile.city?.cityName) : profile.city || "",
      isUserActive: profile.isUserActive || "0",
      parentUserMobileNumber: profile.parentUserMobileNumber || "",
    });

    setPreview(profile.profilePic || null);

    // ⭐ YELLOW STAR: ADDED — FETCHED URL IS ONLY PREVIEW, NOT A NEW IMAGE UPDATE
    setProfileImageBase64("");
  }, [profile, reset]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    // ⭐ YELLOW STAR: UPDATED — CONVERT IMAGE TO BASE64 BEFORE UPDATE
    const reader = new FileReader();

    reader.onload = () => {
      const base64Image = String(reader.result || "");

      setProfileImageBase64(base64Image);
      setPreview(base64Image);
    };

    reader.onerror = () => {
      toast.error("Failed to read profile image.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const isAdult = (dobString: string) => {
    if (!dobString) return true;

    const today = new Date();
    const dob = new Date(dobString);

    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < dob.getDate())
    ) {
      age -= 1;
    }

    return age >= 18;
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (data.userDOB && !isAdult(data.userDOB)) {
      toast.error("User must be at least 18 years old.");
      return;
    }

    try {
      // ⭐ YELLOW STAR: UPDATED — BACKEND EXPECTS UPDATE FIELDS INSIDE ChildUser
      const payload = {
        ChildUser: {
          userFirstName: data.userFirstName?.trim() || "",
          userMiddleName: data.userMiddleName?.trim() || "",
          userLastName: data.userLastName?.trim() || "",
          userDOB: data.userDOB || "",
          userGender: data.userGender || "",
          userEmail: data.userEmail?.trim() || "",
          userType: data.userType || "",
          businessType: data.businessType || "",
          // ⭐ UPDATED
          state: data.state || "",
          city: data.city || "",

          // ⭐ YELLOW STAR: ADDED — SEND BASE64 ONLY WHEN USER SELECTS A NEW IMAGE
          ...(profileImageBase64
            ? { profilePic: profileImageBase64 }
            : {}),
        },
      };

      await dispatch(updateProfessionalProfile(payload)).unwrap();

      toast.success("Profile updated successfully!");
      await dispatch(getProfessionalProfile()).unwrap();
    } catch (error: any) {
      toast.error(
        error?.message ||
        error?.payload?.message ||
        "Failed to update profile"
      );
    }
  };
  console.log({ isActive })
  return (
    <div className="min-h-full bg-background px-3 py-4 text-foreground sm:px-5 lg:px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto w-full "
      >
        {/* Page heading */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FaUser />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  My Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                  View and manage your professional account information.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Profile summary card */}
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="h-fit rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="rounded-full bg-gradient-to-br from-primary/70 via-primary to-primary/60 p-1 shadow-lg shadow-primary/15"
                >
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-card">
                    {preview ? (
                      <img
                        src={preview}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="h-full w-full text-muted-foreground/50" />
                    )}
                  </div>
                </motion.div>

                <motion.label
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  id="profile-upload-button"
                  className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                  title="Upload profile photo"
                >
                  <FaUpload className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </motion.label>
              </div>

              <h2 className="mt-4 text-lg font-bold text-card-foreground">
                {fullName}
              </h2>

              <p className="mt-1 break-all text-sm text-muted-foreground">
                {profile?.userEmail || "Email not available"}
              </p>

              <span className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {profile?.userType || "Professional"}
              </span>
            </div>

            <div className="my-5 h-px bg-border" />

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <div className="mt-0.5 text-primary">
                  <FaMobileAlt />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">Mobile Number</p>
                  <p className="truncate text-xs font-semibold text-card-foreground">
                    {profile?.userMobileNumberHash || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <div className="mt-0.5 text-primary">
                  <FaUsers />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">Parent Mobile</p>
                  <p className="truncate text-xs font-semibold text-card-foreground">
                    {profile?.parentUserMobileNumber || "Not applicable"}
                  </p>
                </div>
              </div>

              {/* ⭐ YELLOW STAR: ADDED — PAN IN SIDEBAR */}
              {profile?.userPAN && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="mt-0.5 text-primary">
                    <FaIdCard />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">PAN</p>
                    <p className="truncate text-xs font-semibold uppercase text-card-foreground">
                      {profile?.userPAN}
                    </p>
                  </div>
                </div>
              )}

              {/* ⭐ YELLOW STAR: ADDED — AADHAAR IN SIDEBAR */}
              {profile?.userAadhar && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="mt-0.5 text-primary">
                    <FaIdCard />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Aadhaar Number</p>
                    <p className="truncate text-xs font-semibold text-card-foreground">
                      {profile?.userAadhar}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <div className="mt-0.5 text-primary">
                  <FaShieldAlt />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Account Status</p>
                  <p
                    className={`text-xs font-semibold ${isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                      }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              JPG, PNG or WEBP. Maximum file size 5 MB.
            </p>
          </motion.aside>

          {/* Profile details card */}
          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-card-foreground">
                Personal Information
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your verified identity and contact details.
              </p>
            </div>

            <div className="p-5">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name fields */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold text-card-foreground">
                        Basic Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Controller
                        name="userFirstName"
                        control={control}
                        rules={{
                          required: "First name is required",
                          pattern: {
                            value: /^[A-Za-z\s'-]+$/,
                            message: "Only letters are allowed",
                          },
                        }}
                        render={({ field }) => (
                          <TextInput
                            label="First Name"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter first name"
                            mandatory
                            error={errors.userFirstName?.message || ""}
                          />
                        )}
                      />

                      <Controller
                        name="userMiddleName"
                        control={control}
                        rules={{
                          pattern: {
                            value: /^[A-Za-z\s'-]*$/,
                            message: "Only letters are allowed",
                          },
                        }}
                        render={({ field }) => (
                          <TextInput
                            label="Middle Name"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter middle name"
                            error={errors.userMiddleName?.message || ""}
                          />
                        )}
                      />

                      <Controller
                        name="userLastName"
                        control={control}
                        rules={{
                          required: "Last name is required",
                          pattern: {
                            value: /^[A-Za-z\s'-]+$/,
                            message: "Only letters are allowed",
                          },
                        }}
                        render={({ field }) => (
                          <TextInput
                            label="Last Name"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter last name"
                            mandatory
                            error={errors.userLastName?.message || ""}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Contact and identity fields */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold text-card-foreground">
                        Verified Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Controller
                        name="userDOB"
                        control={control}
                        render={({ field }) => (
                          <TextInput
                            label="Date of Birth"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            type="date"
                            className="dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-100"

                          />
                        )}
                      />

                      <Controller
                        name="userEmail"
                        control={control}
                        rules={{
                          required: "Email address is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address",
                          },
                        }}
                        render={({ field }) => (
                          <TextInput
                            label="Email Address"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            type="email"
                            placeholder="Enter email address"
                            mandatory
                            error={errors.userEmail?.message || ""}
                          />
                        )}
                      />

                      <Controller
                        name="userType"
                        control={control}
                        render={({ field }) => (
                          <SelectInput
                            label="Tax Payer Type"
                            name={field.name}
                            value={field.value}
                            onChange={(e: any) => field.onChange(e?.target?.value ?? "")}
                            options={userTypeOptions}
                            placeholder="Select tax payer type"
                          />
                        )}
                      />

                      <Controller
                        name="userGender"
                        control={control}
                        render={({ field }) => (
                          <SelectInput
                            label="Gender"
                            name={field.name}
                            value={field.value}
                            onChange={(e: any) => field.onChange(e?.target?.value ?? "")}
                            options={genderTypeOptions}
                            placeholder="Select gender"
                          />
                        )}
                      />

                      <Controller
                        name="businessType"
                        control={control}
                        render={({ field }) => (
                          <SelectInput
                            label="Business Type"
                            name={field.name}
                            value={field.value}
                            onChange={(e: any) => field.onChange(e?.target?.value ?? "")}
                            options={businessTypeOptions}
                            placeholder="Select business type"
                          />
                        )}
                      />

                        {/* ⭐ UPDATED */}
                        <Controller
                          name="state"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              label="State"
                              name={field.name}
                              value={field.value}
                              onChange={(e: any) => {
                                const value = e?.target?.value ?? "";
                                field.onChange(value);
                                setValue("city", "");
                              }}
                              options={stateOptions}
                              placeholder="Select state"
                            />
                          )}
                        />

                        {/* ⭐ UPDATED */}
                        <Controller
                          name="city"
                          control={control}
                          render={({ field }) => (
                            <SelectInput
                              label="City"
                              name={field.name}
                              value={field.value}
                              onChange={(e: any) => field.onChange(e?.target?.value ?? "")}
                              options={cityOptions}
                              placeholder="Select city"
                              disabled={!selectedState || stateCityLoading}
                            />
                          )}
                        />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Fields shown with a muted background are verified and read-only.
                    </p>

                    <motion.button
                      id="profile-update-button"
                      type="submit"
                      disabled={loading || isSubmitting}
                      whileHover={!loading && !isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!loading && !isSubmitting ? { scale: 0.98 } : {}}
                      className="inline-flex h-10 min-w-40 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          Saving...
                        </span>
                      ) : (
                        "Update Profile"
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfessionalProfile;