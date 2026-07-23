import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaIdCard,
  FaMobileAlt,
  FaShieldAlt,
  FaUpload,
  FaUser,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { getProfessionalProfile } from "../../redux/slices/professionalSlice/professionalProfileSlice";
import { formatToInputDate } from "../../components/common/DateFormator";

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
  isUserActive: string;
  parentUserMobileNumber: string;
};

type InputFieldProps = {
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
};

const InputField = ({ label, icon, error, children }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
      <span className="text-xs text-primary">{icon}</span>
      {label}
    </label>

    {children}

    {error && (
      <p className="text-xs font-medium text-destructive">{error}</p>
    )}
  </div>
);

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

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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
      isUserActive: "0",
      parentUserMobileNumber: "",
    },
  });

  const editableInputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";

  const readOnlyInputClass =
    "h-10 w-full cursor-default rounded-lg border border-border bg-muted/60 px-3 text-sm text-muted-foreground outline-none";

  const fullName = useMemo(() => {
    return [profile?.userFirstName, profile?.userMiddleName, profile?.userLastName]
      .filter(Boolean)
      .join(" ") || "Professional User";
  }, [profile]);

  const isActive = profile?.isUserActive == "0";

  useEffect(() => {
    dispatch(getProfessionalProfile());
  }, [dispatch]);

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
      isUserActive: profile.isUserActive || "0",
      parentUserMobileNumber: profile.parentUserMobileNumber || "",
    });

    setPreview(profile.profilePic || null);
  }, [profile, reset]);

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    };
  }, [selectedImageUrl]);

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

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrl);
    setPreview(objectUrl);
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
      // Add your updateProfessionalProfile dispatch here when the API is enabled.
      // Example:
      // await dispatch(updateProfessionalProfile(payload)).unwrap();

      toast.success("Profile updated successfully!");
      dispatch(getProfessionalProfile());
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-full bg-background px-3 py-4 text-foreground sm:px-5 lg:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl"
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

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isActive
                ? "border-emerald-300/20 bg-emerald-200/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/20 bg-destructive/10 text-destructive"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-destructive"
                }`}
            />
            {isActive ? "Active Subscription" : "Inactive Subscription"}
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
                  <p className="text-xs text-muted-foreground">Mobile Number</p>
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {profile?.userMobileNumberHash || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <div className="mt-0.5 text-primary">
                  <FaUsers />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Parent Mobile</p>
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {profile?.parentUserMobileNumber || "Not applicable"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <div className="mt-0.5 text-primary">
                  <FaShieldAlt />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <p
                    className={`text-sm font-semibold ${isActive
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
                      <InputField
                        label="First Name"
                        icon={<FaUser />}
                        error={errors.userFirstName?.message}
                      >
                        <input
                          {...register("userFirstName", {
                            required: "First name is required",
                            pattern: {
                              value: /^[A-Za-z\s'-]+$/,
                              message: "Only letters are allowed",
                            },
                          })}
                          placeholder="Enter first name"
                          className={editableInputClass}
                        />
                      </InputField>

                      <InputField
                        label="Middle Name"
                        icon={<FaUser />}
                        error={errors.userMiddleName?.message}
                      >
                        <input
                          {...register("userMiddleName", {
                            pattern: {
                              value: /^[A-Za-z\s'-]*$/,
                              message: "Only letters are allowed",
                            },
                          })}
                          placeholder="Enter middle name"
                          className={editableInputClass}
                        />
                      </InputField>

                      <InputField
                        label="Last Name"
                        icon={<FaUser />}
                        error={errors.userLastName?.message}
                      >
                        <input
                          {...register("userLastName", {
                            required: "Last name is required",
                            pattern: {
                              value: /^[A-Za-z\s'-]+$/,
                              message: "Only letters are allowed",
                            },
                          })}
                          placeholder="Enter last name"
                          className={editableInputClass}
                        />
                      </InputField>
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
                      <InputField label="Date of Birth" icon={<FaCalendarAlt />}>
                        <input
                          {...register("userDOB")}
                          type="date"
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="Email Address" icon={<FaEnvelope />}>
                        <input
                          {...register("userEmail")}
                          type="email"
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="Mobile Number" icon={<FaMobileAlt />}>
                        <input
                          {...register("userMobileNumberHash")}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="PAN" icon={<FaIdCard />}>
                        <input
                          {...register("userPAN")}
                          readOnly
                          className={`${readOnlyInputClass} uppercase`}
                        />
                      </InputField>

                      <InputField label="Aadhaar Number" icon={<FaIdCard />}>
                        <input
                          {...register("userAadhar")}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="User Type" icon={<FaShieldAlt />}>
                        <input
                          {...register("userType")}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="Parent Mobile" icon={<FaUsers />}>
                        <input
                          {...register("parentUserMobileNumber")}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </InputField>

                      <InputField label="Subscription Status" icon={<FaShieldAlt />}>
                        <div
                          className={`flex h-10 items-center rounded-lg border px-3 text-sm font-semibold ${isActive
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-destructive/20 bg-destructive/10 text-destructive"
                            }`}
                        >
                          <span
                            className={`mr-2 h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-destructive"
                              }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </div>
                      </InputField>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Fields shown with a muted background are verified and read-only.
                    </p>

                    <motion.button
                      id="profile-update-button"
                      type="submit"
                      disabled={loading || isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-10 min-w-40 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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