import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import {
  checkProfessionalParentUser,
  registerChildProfessional,
  registerProfessional,
} from "../redux/slices/professionalSlice/professionalAuthSlice";
import {
  resetVerifyPan,
  verifyPan,
} from "../redux/slices/professionalSlice/panVerify/panVerify";
import {
  saveSeeder,
  seedDefaultAccounts,
  seedDefaultUnits,
} from "../redux/slices/professionalSlice/seeder";

type RegistrationRole = "Parent" | "Child";

const inputClassName =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName =
  "mb-1 block text-sm font-medium text-card-foreground";

const errorClassName = "mt-0.5 text-xs font-medium text-destructive";

const ProfessionalRegister = () => {
  const { parentUserData, loading } = useSelector(
    (state: any) => state.professionalAuth,
  );
  const { loading: panLoading } = useSelector(
    (state: any) => state?.verifyPan,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [role, setRole] = useState<RegistrationRole>("Child");
  const [parentNumber, setParentNumber] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [isParentMatched, setIsParentMatched] = useState<boolean | null>(null);
  const [panVerified, setPanVerified] = useState(false);
  const [panVerifyFailed, setPanVerifyFailed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const maxDob = new Date(
    new Date().getFullYear() - 18,
    new Date().getMonth(),
    new Date().getDate(),
  )
    .toISOString()
    .split("T")[0];

  const handlePanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const upperCasePan = event.target.value.toUpperCase();

    setValue("userPAN", upperCasePan, { shouldValidate: true });
    setPanVerified(false);
    setPanVerifyFailed(false);
    dispatch(resetVerifyPan() as any);
  };

  const handleRoleChange = (selectedRole: RegistrationRole) => {
    setRole(selectedRole);
    setIsParentMatched(null);

    if (selectedRole === "Parent") {
      setOtpVerified(true);
      setParentNumber("");
      return;
    }

    setOtpVerified(false);
  };

  const handleVerifyParent = async () => {
    if (!/^[6-9]\d{9}$/.test(parentNumber)) {
      toast.error("Enter a valid 10-digit parent number");
      setIsParentMatched(false);
      setOtpVerified(false);
      return;
    }

    // @ts-ignore
    const response: any = await dispatch(
      // @ts-ignore 
      checkProfessionalParentUser(parentNumber),
    );

    const child = response?.payload?.user?.ChildUsers;

    if (
      response?.meta?.requestStatus === "fulfilled" &&
      response?.payload?.exists &&
      child?.parentUserMobileNumber === child?.userMobileNumberHash
    ) {
      toast.success("Parent matched successfully");
      setIsParentMatched(true);
      setOtpVerified(true);
      return;
    }

    toast.error("Parent does not match");
    setIsParentMatched(false);
    setOtpVerified(false);
  };

  const seedDefaultBookezData = async () => {
    const defaultConfigPayload = {
      configurationName: "Default System Config",
      systemConfiguration: {
        salesQuotation: {
          enableLocation: false,
        },
      },
      inventoryConfiguration: {
        maintainInventory: false,
        inventoryTagLevel: "WAREHOUSE_LOCATION_BATCH_BIN",
        inventoryPickMethod: "FIFO",
        negativeStockPolicy: "ALLOW",
      },
      financeConfiguration: {
        isActive: true,
      },
      anyOtherField: "Custom Value",
    };

    const [unitsRes, accountsRes]: any = await Promise.all([
      // @ts-ignore
      dispatch(seedDefaultUnits()),
      // @ts-ignore
      dispatch(seedDefaultAccounts()),
      // @ts-ignore
      dispatch(saveSeeder(JSON.stringify(defaultConfigPayload))),
    ]);

    if (!unitsRes.ok) {
      const errText = await unitsRes.text();
      throw new Error(errText || "Failed to seed default units.");
    }

    if (!accountsRes.ok) {
      const errText = await accountsRes.text();
      throw new Error(errText || "Failed to seed default accounts.");
    }

    return true;
  };

  const onSubmit = async (data: any) => {
    try {
      data.userPAN = data.userPAN.toUpperCase();
      data.userMobileNumberHash = data.userMobileNumberHash.toString();

      const payload = { ...data };

      if (role === "Parent") {
        // @ts-ignore
        const response = await dispatch(registerProfessional(payload)).unwrap();

        seedDefaultBookezData();
        toast.success(
          response.message || "Parent registered successfully!",
        );
        navigate("/professional");
        return;
      }

      const childData = {
        ...payload,
        parentUserMobileNumber: parentNumber,
      };

      // @ts-ignore
      const response: any = await dispatch(
        // @ts-ignore
        registerChildProfessional({
          parentMobile: parentNumber,
          childData,
        }),
      ).unwrap();

      seedDefaultBookezData();
      toast.success(response.message || "Child user added successfully!");
      navigate("/professional");
    } catch (error: any) {
      toast.error(error?.message || "Registration failed");
    }
  };

  const handleVerifyPan = async () => {
    const pan = watch("userPAN")?.toUpperCase()?.trim();

    if (!pan) {
      toast.error("PAN is required");
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      toast.error("Enter a valid PAN");
      return;
    }

    try {
      // @ts-ignore
      const response = await dispatch(verifyPan({ pan })).unwrap();

      setPanVerified(true);
      setPanVerifyFailed(false);
      toast.success(response?.message || "PAN verified successfully");
    } catch (error: any) {
      setPanVerified(false);
      setPanVerifyFailed(true);
      toast.error(error || "PAN verification failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-3 py-3 text-foreground sm:px-4 lg:px-6">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:border-primary/50 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <ShieldCheck size={15} className="text-primary" />
            Secure registration
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5">
          <header className="border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  <UserRound size={20} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
                    User Registration
                  </h1>
                  <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                    Create a company account or register a child user under an
                    existing professional account.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background/70 px-3 py-2 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current registration
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                  {role === "Parent" ? (
                    <Building2 size={17} className="text-primary" />
                  ) : (
                    <UsersRound size={17} className="text-primary" />
                  )}
                  {role === "Parent" ? "Company account" : "Child account"}
                </div>
              </div>
            </div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3 p-3 sm:p-4"
          >
            <section className="rounded-lg border border-border bg-background/40 p-3">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UserRound size={16} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">
                    Personal information
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Enter the user&apos;s basic personal details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClassName}>First Name</label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    className={inputClassName}
                    {...register("userFirstName", {
                      required: "First name is required",
                      pattern: {
                        value: /^[A-Za-z\s'-]+$/,
                        message: "Only letters are allowed",
                      },
                    })}
                  />
                  {errors.userFirstName && (
                    <p className={errorClassName}>
                      {errors.userFirstName.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Middle Name</label>
                  <input
                    type="text"
                    placeholder="Enter middle name"
                    className={inputClassName}
                    {...register("userMiddleName", {
                      pattern: {
                        value: /^[A-Za-z\s'-]+$/,
                        message: "Only letters are allowed",
                      },
                    })}
                  />
                  {errors.userMiddleName && (
                    <p className={errorClassName}>
                      {errors.userMiddleName.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    className={inputClassName}
                    {...register("userLastName", {
                      required: "Last name is required",
                      pattern: {
                        value: /^[A-Za-z\s'-]+$/,
                        message: "Only letters are allowed",
                      },
                    })}
                  />
                  {errors.userLastName && (
                    <p className={errorClassName}>
                      {errors.userLastName.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>
                    Date of Birth
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (18+ only)
                    </span>
                  </label>
                  <input
                    type="date"
                    max={maxDob}
                    className={inputClassName}
                    {...register("userDOB", {
                      required: "Date of birth is required",
                      validate: (value) => {
                        const dob = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - dob.getFullYear();
                        const monthDifference = today.getMonth() - dob.getMonth();
                        const dayDifference = today.getDate() - dob.getDate();

                        const is18OrOlder =
                          age > 18 ||
                          (age === 18 &&
                            (monthDifference > 0 ||
                              (monthDifference === 0 && dayDifference >= 0)));

                        return (
                          is18OrOlder || "You must be at least 18 years old"
                        );
                      },
                    })}
                  />
                  {errors.userDOB && (
                    <p className={errorClassName}>
                      {errors.userDOB.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Gender</label>
                  <select
                    className={inputClassName}
                    {...register("userGender", {
                      required: "Gender is required",
                    })}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.userGender && (
                    <p className={errorClassName}>
                      {errors.userGender.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className={inputClassName}
                    {...register("userEmail", {
                      required: "Email is required",
                    })}
                  />
                  {errors.userEmail && (
                    <p className={errorClassName}>
                      {errors.userEmail.message as string}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background/40 p-3">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BadgeCheck size={16} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">
                    Identity and contact
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Verify PAN and provide contact identification details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClassName}>PAN</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className={`${inputClassName} pr-28 uppercase`}
                      {...register("userPAN", {
                        required: "PAN is required",
                        pattern: {
                          value: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
                          message: "Enter a valid PAN",
                        },
                      })}
                      onChange={handlePanChange}
                    />

                    <div className="absolute inset-y-0 right-2 flex items-center">
                      {panVerified ? (
                        <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={14} />
                          Verified
                        </div>
                      ) : panVerifyFailed ? (
                        <button
                          type="button"
                          onClick={handleVerifyPan}
                          className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/15"
                          title="Verification failed. Retry"
                        >
                          <XCircle size={14} />
                          Retry
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyPan}
                          disabled={panLoading}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {panLoading && (
                            <Loader2 size={13} className="animate-spin" />
                          )}
                          {panLoading ? "Verifying" : "Verify"}
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.userPAN && (
                    <p className={errorClassName}>
                      {errors.userPAN.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Mobile Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="Enter mobile number"
                    className={inputClassName}
                    {...register("userMobileNumberHash", {
                      required: "Mobile number is required",
                      minLength: {
                        value: 10,
                        message: "Mobile number must be 10 digits",
                      },
                      maxLength: {
                        value: 10,
                        message: "Mobile number must be 10 digits",
                      },
                      validate: (value) =>
                        /^\d+$/.test(value) || "Only digits are allowed",
                    })}
                  />
                  {errors.userMobileNumberHash && (
                    <p className={errorClassName}>
                      {errors.userMobileNumberHash.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    inputMode="numeric"
                    placeholder="Enter 12-digit Aadhaar"
                    className={inputClassName}
                    {...register("userAadhar", {
                      required: "Aadhaar is required",
                    })}
                  />
                  {errors.userAadhar && (
                    <p className={errorClassName}>
                      {errors.userAadhar.message as string}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background/40 p-3">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UsersRound size={16} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">
                    Account setup
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select the user category and registration relationship.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.35fr]">
                <div>
                  <label className={labelClassName}>User Type</label>
                  <select
                    className={inputClassName}
                    {...register("userType", {
                      required: "User type is required",
                    })}
                  >
                    <option value="">Select user type</option>
                    <option value="Tax Payer">Tax Payer/Employee</option>
                    <option value="Company">Company</option>
                    <option value="CA/CMA/Tax Consultant">
                      CA/CMA/Tax Consultant
                    </option>
                  </select>
                  {errors.userType && (
                    <p className={errorClassName}>
                      {errors.userType.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClassName}>Register As</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                      className={`relative cursor-pointer rounded-lg border p-3 transition ${role === "Parent"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="registrationRole"
                        checked={role === "Parent"}
                        onChange={() => handleRoleChange("Parent")}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${role === "Parent"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-card-foreground">
                            Company
                          </p>
                          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                            Create a new primary professional account.
                          </p>
                        </div>
                      </div>
                    </label>

                    <label
                      className={`relative cursor-pointer rounded-lg border p-3 transition ${role === "Child"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="registrationRole"
                        checked={role === "Child"}
                        onChange={() => handleRoleChange("Child")}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${role === "Child"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <UsersRound size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-card-foreground">
                            Child User
                          </p>
                          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
                            Join an existing company or professional account.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {role === "Child" && (
                <div className="mt-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex-1">
                      <label className={labelClassName}>
                        Parent Mobile Number
                      </label>
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        Enter the registered mobile number of the parent account.
                      </p>

                      <div className="flex flex-col gap-1.5 sm:flex-row">
                        <input
                          type="text"
                          maxLength={10}
                          inputMode="numeric"
                          className={`${inputClassName} sm:max-w-sm`}
                          placeholder="Enter parent mobile number"
                          value={parentNumber}
                          onChange={(event) => {
                            if (/^\d*$/.test(event.target.value)) {
                              setParentNumber(event.target.value);
                              setIsParentMatched(null);
                              setOtpVerified(false);
                            }
                          }}
                        />

                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleVerifyParent}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading && (
                            <Loader2 size={16} className="animate-spin" />
                          )}
                          {loading ? "Verifying" : "Verify Parent"}
                        </button>
                      </div>
                    </div>

                    <div className="md:min-w-56">
                      {isParentMatched === true &&
                        parentUserData?.ChildUsers && (
                          <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2
                              size={17}
                              className="mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="font-semibold">Parent verified</p>
                              <p className="mt-0.5 text-xs opacity-90">
                                {parentUserData.ChildUsers.userFirstName}{" "}
                                {parentUserData.ChildUsers.userLastName}
                              </p>
                            </div>
                          </div>
                        )}

                      {isParentMatched === false && (
                        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          <XCircle size={17} className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold">Parent not found</p>
                            <p className="mt-0.5 text-xs opacity-90">
                              Check the mobile number and try again.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                By registering, you confirm that the provided information is
                accurate.
              </p>

              <button
                type="submit"
                disabled={
                  isSubmitting || (role === "Child" && !otpVerified)
                }
                className="inline-flex h-9 min-w-48 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting && <Loader2 size={17} className="animate-spin" />}
                {isSubmitting
                  ? "Creating Account..."
                  : role === "Parent"
                    ? "Register Company"
                    : "Register Child User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegister;