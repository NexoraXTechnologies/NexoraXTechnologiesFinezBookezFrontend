import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import eTaxSoln from "../assets/FinEZ.png";
import LoginImgae from "../assets/loginBackground.jpg";
import {
  sendProfessionalOtp,
  verifyProfessionalOtp,
} from "../redux/slices/professionalSlice/professionalAuthSlice";
// import OneSignal from 'react-onesignal';
import { motion } from "framer-motion";
import { AuthButton } from "../components/buttons";
import { getAllPermissions } from "../redux/slices/permissionSlice";

const OTP_LENGTH = 4;

const Section = ({ title, text }: any) => (
  <div className="space-y-1">
    <h3 className="text-md font-semibold text-primary">{title}</h3>
    <p className="text-sm text-card-foreground">{text}</p>
  </div>
);

// const FULL_TEXT = "Tax filing is simplified now...";

const termsAndConditions: any = [
  {
    title: "Scope of Services",
    text: "The Application provided by the Company enables taxpayers to file their income tax returns electronically by submitting the required information and documents. The Company will process the information provided and generate the applicable tax return forms in accordance with the regulations of the Income Tax Department of India.",
  },
  {
    title: "User Eligibility",
    text: "By using the Application, you confirm that you are of legal age and have the authority to enter into these Terms. If you are using the Application on behalf of an organization, you confirm that you are authorized to bind such organization to these Terms.",
  },
  {
    title: "Fees",
    text: "Use of the Application may require payment of a nominal processing fee. The applicable fee will be clearly displayed before you proceed with the filing process. Payment of the processing fee is required to access and use the services offered by the Application.",
  },
  {
    title: "Accuracy of Information",
    text: "You agree to provide accurate, complete, and up-to-date information while using the Application. The Company shall not be held responsible for any issues or consequences arising from inaccurate or incomplete information provided by you.",
  },
  {
    title: "Privacy Policy",
    text: "Your use of the Application is subject to the Company’s Privacy Policy, which explains how your personal information is collected, used, and protected. By using the Application, you consent to the processing of your personal information as described in the Privacy Policy.",
  },
  {
    title: "Intellectual Property",
    text: "All content, design, layout, and materials within the Application are the exclusive property of the Company and are protected by applicable intellectual property laws. You may not copy, modify, distribute, reproduce, or reverse engineer any part of the Application without prior written consent from the Company.",
  },
  {
    title: "Disclaimer of Warranties",
    text: "The Company does not make any warranties or representations regarding the accuracy, reliability, completeness, or timeliness of the information provided through the Application. Use of the Application is entirely at your own risk.",
  },
  {
    title: "Limitation of Liability",
    text: "The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of the Application.",
  },
  {
    title: "Indemnification",
    text: "You agree to indemnify and hold the Company harmless against any claims, damages, losses, or liabilities arising from your use of the Application or your violation of these Terms.",
  },
  {
    title: "Governing Law and Dispute Resolution",
    text: "These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in your city, India.",
  },
  {
    title: "Modifications to Terms",
    text: "The Company reserves the right to modify these Terms at any time without prior notice. Changes shall take effect immediately upon being posted. Continued use of the Application after such changes constitutes your acceptance of the revised Terms.",
  },
  {
    title: "Termination",
    text: "The Company may suspend or terminate your access to the Application at any time, with or without cause, and without prior notice.",
  },
  {
    title: "Severability",
    text: "If any provision of these Terms is deemed invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
  },
];

const Login = () => {
  const dispatch = useDispatch<any>();
  const dispatchP = useDispatch<any>();
  const navigate = useNavigate();

  // const [showPass, setShowPass] = useState(false);
  // const { loading: authLoading } = useSelector((state) => state.auth);
  const { loading: professionalLoading } = useSelector(
    (state: any) => state.professionalAuth
  );

  // const [loginType, setLoginType] = useState("Nexora");
  // const [typedText, setTypedText] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // PROFESSIONAL LOGIN STATES
  const [mobile, setMobile] = useState("");
  const [showOtpPopup, setShowOtpPopup] = useState(false);

  // OTP digits
  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const verifyInProgressRef = useRef(false);

  const { professionalRequestID } = useSelector(
    (state: any) => state.professionalAuth
  );

  const focusOtpInput = (index: number) => {
    requestAnimationFrame(() => {
      otpRefs.current[index]?.focus();
      otpRefs.current[index]?.select();
    });
  };

  const handleOtpInput = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);

    setOtp((currentOtp) => {
      const updatedOtp = [...currentOtp];
      updatedOtp[index] = value;
      return updatedOtp;
    });

    // Move to the next box only after entering a digit.
    if (value && index < OTP_LENGTH - 1) {
      focusOtpInput(index + 1);
    }
  };

  const handleOtpKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      setOtp((currentOtp) => {
        const updatedOtp = [...currentOtp];

        // First Backspace clears the current box.
        if (updatedOtp[index]) {
          updatedOtp[index] = "";
          focusOtpInput(index);
          return updatedOtp;
        }

        // If the current box is empty, move back and clear the previous box.
        if (index > 0) {
          updatedOtp[index - 1] = "";
          focusOtpInput(index - 1);
        }

        return updatedOtp;
      });

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusOtpInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusOtpInput(index + 1);
    }
  };

  const handleOtpPaste = (
    event: ClipboardEvent<HTMLInputElement>,
    startIndex: number
  ) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - startIndex);

    if (!pastedDigits) return;

    setOtp((currentOtp) => {
      const updatedOtp = [...currentOtp];

      pastedDigits.split("").forEach((digit, offset) => {
        updatedOtp[startIndex + offset] = digit;
      });

      return updatedOtp;
    });

    const nextFocusIndex = Math.min(
      startIndex + pastedDigits.length,
      OTP_LENGTH - 1
    );
    focusOtpInput(nextFocusIndex);
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    if (verifyInProgressRef.current) return;

    const finalOtp = otpValue ?? otp.join("");

    if (finalOtp.length !== OTP_LENGTH) {
      toast.error("Enter all 4 digits");

      const firstEmptyIndex = otp.findIndex((digit) => !digit);
      focusOtpInput(firstEmptyIndex === -1 ? 0 : firstEmptyIndex);
      return;
    }

    verifyInProgressRef.current = true;
    setIsVerifying(true);

    try {
      const res: any = await dispatchP(
        verifyProfessionalOtp({
          mobile,
          requestID: professionalRequestID,
          otp: finalOtp,
        })
      ).unwrap();

      toast.success("OTP Verified!");

      // If user already exists
      if (res.existingUser && res.userData) {
        const user = res.userData;

        const loginuser = user?.userMobileNumberHash;
        const authtoken = user?.authTokenDigest;
        const dbName = user?.parentUserMobileNumber;

        localStorage.setItem(
          "professionalHeaders",
          JSON.stringify({
            "x-db-name": dbName,
            authtoken,
            loginuser,
          })
        );

        const fullName = `${user.userFirstName || ""} ${user.userLastName || ""
          }`.trim();

        localStorage.setItem(
          "professionalUser",
          JSON.stringify({
            name: fullName || "Professional User",
            type: user.userType || "Tax Expert",
            profilePic:
              user.profilePic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            userMobileNumberHash: user?.userMobileNumberHash,
            userEmail: user.userEmail,
            ...user,
          })
        );

        try {
          if (user?.parentUserMobileNumber && user?.userMobileNumberHash) {
            dispatch(
              getAllPermissions({
                offset: 0,
                limit: 100,
                parentMobile: user.parentUserMobileNumber,
                childMobile: user.userMobileNumberHash,
                storeInLocal:true
              }) as any
            );
          }

          if (user.userEmail) {
            // await OneSignal.login(user.userEmail);
            console.log(
              "📲 OneSignal logged in (PROFESSIONAL):",
              user.userEmail
            );
          } else {
            console.warn(
              "⚠️ No professional userEmail found for OneSignal login"
            );
          }
        } catch (error) {
          console.error("❌ OneSignal PRO login error:", error);
        }

        navigate("/");
      } else {
        navigate("/professionalRegister");
      }
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "OTP verification failed"
      );

      // Keep the entered OTP so the user can correct only the wrong digit.
      focusOtpInput(OTP_LENGTH - 1);
    } finally {
      verifyInProgressRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Enter valid mobile");
      return;
    }

    try {
      await dispatchP(sendProfessionalOtp(mobile)).unwrap();

      setOtp(Array(OTP_LENGTH).fill(""));
      verifyInProgressRef.current = false;
      setIsVerifying(false);
      setShowOtpPopup(true);
      toast.success("OTP Sent!");
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to send OTP"
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      await dispatchP(sendProfessionalOtp(mobile)).unwrap();

      setOtp(Array(OTP_LENGTH).fill(""));
      verifyInProgressRef.current = false;
      setIsVerifying(false);
      toast.success("OTP Re-sent!");
      focusOtpInput(0);
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to resend OTP"
      );
    }
  };

  // Focus the first OTP box after the OTP section has rendered.
  useEffect(() => {
    if (!showOtpPopup) return;

    const timer = window.setTimeout(() => {
      focusOtpInput(0);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [showOtpPopup]);

  // Automatically verify after all four digits are entered.
  useEffect(() => {
    if (!showOtpPopup) return;

    const finalOtp = otp.join("");

    if (finalOtp.length === OTP_LENGTH) {
      void handleVerifyOtp(finalOtp);
    }
  }, [otp, showOtpPopup]);

  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      {/* ================= BACKGROUND SECTION ================= */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute left-0 top-0 h-[390px] w-full bg-cover bg-center md:h-[600px] md:[@media(min-height:901px)]:h-[760px]"
        style={{ backgroundImage: `url(${LoginImgae})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0"></div>

        <div className="absolute inset-0 overflow-hidden">
          <motion.span
            animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute left-10 top-10 h-2 w-2 rounded-full bg-white opacity-60"
          />

          <motion.span
            animate={{ y: [0, -20, 0], x: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute right-20 top-20 h-2 w-2 rounded-full bg-white opacity-50"
          />

          <motion.span
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute left-1/3 top-32 h-1 w-1 rounded-full bg-white opacity-70"
          />

          <motion.span
            animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute right-1/4 top-16 h-2 w-2 rounded-full bg-white opacity-60"
          />

          <motion.span
            animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute right-1/2 top-40 h-1 w-1 rounded-full bg-white opacity-50"
          />

          <motion.span
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute left-20 top-52 h-3 w-3 rounded-full bg-white opacity-30"
          />

          <motion.span
            animate={{ y: [0, -14, 0], x: [0, 7, 0] }}
            transition={{ duration: 4.5, repeat: Infinity }}
            className="absolute right-10 top-72 h-2 w-2 rounded-full bg-white opacity-40"
          />

          <motion.span
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute left-1/2 top-60 h-4 w-4 rounded-full bg-white opacity-20"
          />

          <motion.span
            animate={{ y: [0, -16, 0], x: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute left-1/4 top-80 h-2 w-2 rounded-full bg-white opacity-60"
          />

          <motion.span
            animate={{ y: [0, -22, 0] }}
            transition={{ duration: 6.5, repeat: Infinity }}
            className="absolute left-2/3 top-24 h-1 w-1 rounded-full bg-white opacity-70"
          />

          <motion.span
            animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute right-1/3 top-44 h-3 w-3 rounded-full border border-white opacity-30"
          />

          <motion.span
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute right-1/4 top-64 h-2 w-2 rounded-full bg-white opacity-40"
          />
        </div>
      </motion.div>

      {/* ================= CURVE SHAPE ================= */}
      <div className="pointer-events-none absolute left-0 top-[230px] z-10 w-full overflow-hidden leading-none md:top-[330px] md:[@media(min-height:901px)]:top-[420px]">
        <svg
          viewBox="0 0 1440 320"
          className="block h-[190px] w-full md:h-[230px] md:[@media(min-height:901px)]:h-[300px]"
          preserveAspectRatio="none"
        >
          <path
            fill="var(--card)"
            d="M0,96L1440,224L1440,320L0,320Z"
          />
        </svg>
      </div>

      {/* ✅ WHITE AREA STARTS FROM ABOVE POSITION */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-[360px] z-10 w-full bg-card md:top-[470px] md:[@media(min-height:901px)]:top-[600px]" />

      {/* ================= LOGIN CARD ================= */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-10 md:[@media(min-height:901px)]:justify-start md:[@media(min-height:901px)]:pt-[280px]">
        <div className="flex w-full flex-col items-center space-y-5">
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-6 text-card-foreground shadow-[0_10px_40px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 sm:p-8"
          >
            {/* Heading */}
            <div className="mb-3 text-center">
              <motion.img
                src={eTaxSoln}
                alt="Professional"
                className="mx-auto my-0 mb-1 w-50 rounded-xl border border-border px-3 py-1"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              />

              <h4 className="mb-3 text-card-foreground">
                Finance & Tax Made Easy
              </h4>

              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Welcome to FinEZ!
              </h2>

              <p className="mt-2 text-sm leading-relaxed tracking-wide text-muted-foreground sm:text-base">
                Sign in to continue FinEZ.
              </p>
            </div>

            {/* Username */}
            {showOtpPopup ? (
              <>
                {/* Title */}
                <h3 className="text-center text-lg font-semibold text-card-foreground">
                  Enter OTP
                </h3>

                {/* OTP Boxes */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex justify-center gap-3"
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      aria-label={`OTP digit ${index + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpInput(event, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      onPaste={(event) => handleOtpPaste(event, index)}
                      onFocus={(event) => event.currentTarget.select()}
                      disabled={isVerifying}
                      className="h-12 w-12 rounded-xl border border-border bg-input text-center text-xl font-semibold text-foreground outline-none transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  ))}
                </motion.div>

                {/* Resend */}
                <p className="my-3 text-center text-sm text-muted-foreground">
                  Didn't receive OTP?{" "}
                  <span
                    className="cursor-pointer text-primary"
                    onClick={handleResendOtp}
                  >
                    Resend
                  </span>
                </p>

                {/* Next Button */}
                <AuthButton
                  {...{
                    loader: isVerifying,
                    clickCb: handleVerifyOtp,
                    btnName: "Verify OTP",
                  }}
                />
              </>
            ) : (
              <>
                <div>
                  <div className="mb-4 flex items-center overflow-hidden rounded-xl border border-border bg-input transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20">
                    <span className="select-none border-r border-border bg-muted px-4 py-3 font-medium text-muted-foreground">
                      +91
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={mobile}
                      onChange={(event) => {
                        const numericValue = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setMobile(numericValue);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSendOtp();
                        }
                      }}
                      className="w-full bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>

                <AuthButton
                  {...{
                    loader: professionalLoading,
                    clickCb: handleSendOtp,
                    btnName: "Send OTP",
                  }}
                />
              </>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              By entering OTP, you agree to our{" "}
              <span
                className="cursor-pointer text-primary underline"
                onClick={() => setShowTerms(true)}
              >
                Terms & Conditions
              </span>
            </p>
          </motion.div>
        </div>

        {/* ================= COPYRIGHT ================= */}
        <div className="absolute bottom-5 left-0 z-30 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="mb-3 h-px w-24 bg-border"></div>

            <p className="text-xs text-muted-foreground md:text-sm">
              © {new Date().getFullYear()} FinEZ. All Rights Reserved.
            </p>

            <p className="text-xs text-muted-foreground">
              Designed & Developed by
              <span className="ml-1 font-medium text-primary">
                NexoraX Technology Pvt. Ltd.
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      {showTerms && (
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          {/* Modal Box */}
          <div className="relative max-h-[80vh] w-full max-w-[900px] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-lg font-semibold text-card-foreground">
                Terms & Conditions
              </h2>

              <button
                onClick={() => setShowTerms(false)}
                className="cursor-pointer text-xl text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[70vh] space-y-4 overflow-y-auto scroll-smooth px-5 py-4 text-card-foreground">
              {termsAndConditions.map(({ title, text }: any, index: any) => (
                <Section key={index} title={title} text={text} />
              ))}

              <p className="mt-4 text-sm text-card-foreground">
                By using the Application, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;