import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, googleLoginUser } from "../redux/slices/authSlice";
import { GoogleLogin } from "@react-oauth/google";
import LoginBGImg from "../assets/images/LoginBGImg.jpg";
import ProfessionalImg from "../assets/images/bgremoved.png";
import eTaxSoln from '../assets/FinEZ.png';
import LoginImgae from "../assets/loginBackground.jpg";
import { sendProfessionalOtp, verifyProfessionalOtp, } from "../redux/slices/professionalSlice/professionalAuthSlice";
import OneSignal from 'react-onesignal';
import { motion } from "framer-motion";
import { AuthButton } from "../components/buttons";

const Section = ({ title, text }) => (
  <div className="space-y-1">
    <h3 className="text-md font-semibold text-blue-700">{title}</h3>
    <p className="text-sm text-gray-700">{text}</p>
  </div>
);
const FULL_TEXT = "Tax filing is simplified now...";
const termsAndConditions = [
  { title: "Scope of Services", text: "The Application provided by the Company enables taxpayers to file their income tax returns electronically by submitting the required information and documents. The Company will process the information provided and generate the applicable tax return forms in accordance with the regulations of the Income Tax Department of India." },
  {
    title: "User Eligibility",
    text: "By using the Application, you confirm that you are of legal age and have the authority to enter into these Terms. If you are using the Application on behalf of an organization, you confirm that you are authorized to bind such organization to these Terms."
  },
  {
    title: "Fees",
    text: "Use of the Application may require payment of a nominal processing fee. The applicable fee will be clearly displayed before you proceed with the filing process. Payment of the processing fee is required to access and use the services offered by the Application."
  },
  {
    title: "Accuracy of Information",
    text: "You agree to provide accurate, complete, and up-to-date information while using the Application. The Company shall not be held responsible for any issues or consequences arising from inaccurate or incomplete information provided by you."
  },
  {
    title: "Privacy Policy",
    text: "Your use of the Application is subject to the Company’s Privacy Policy, which explains how your personal information is collected, used, and protected. By using the Application, you consent to the processing of your personal information as described in the Privacy Policy."
  },
  {
    title: "Intellectual Property",
    text: "All content, design, layout, and materials within the Application are the exclusive property of the Company and are protected by applicable intellectual property laws. You may not copy, modify, distribute, reproduce, or reverse engineer any part of the Application without prior written consent from the Company."
  },
  {
    title: "Disclaimer of Warranties",
    text: "The Company does not make any warranties or representations regarding the accuracy, reliability, completeness, or timeliness of the information provided through the Application. Use of the Application is entirely at your own risk."
  },
  {
    title: "Limitation of Liability",
    text: "The Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of the Application."
  },
  {
    title: "Indemnification",
    text: "You agree to indemnify and hold the Company harmless against any claims, damages, losses, or liabilities arising from your use of the Application or your violation of these Terms."
  },
  {
    title: "Governing Law and Dispute Resolution",
    text: "These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in your city, India."
  },
  {
    title: "Modifications to Terms",
    text: "The Company reserves the right to modify these Terms at any time without prior notice. Changes shall take effect immediately upon being posted. Continued use of the Application after such changes constitutes your acceptance of the revised Terms."
  },
  {
    title: "Termination",
    text: "The Company may suspend or terminate your access to the Application at any time, with or without cause, and without prior notice."
  },
  {
    title: "Severability",
    text: "If any provision of these Terms is deemed invalid or unenforceable, the remaining provisions shall continue in full force and effect."
  }
];
const Login = () => {
  const dispatch = useDispatch();
  const dispatchP = useDispatch();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { loading: authLoading } = useSelector((state) => state.auth);
  const { loading: professionalLoading } = useSelector((state) => state.professionalAuth);
  const [loginType, setLoginType] = useState("Nexora");
  const [typedText, setTypedText] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // PROFESSIONAL LOGIN STATES
  const [mobile, setMobile] = useState("");
  const [showOtpPopup, setShowOtpPopup] = useState(false);

  // OTP digits
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef([]);
  const { professionalRequestID } = useSelector((state) => state.professionalAuth);

  useEffect(() => {
    let index = 0;
    let timeout;
    const typeText = () => {
      setTypedText(FULL_TEXT.substring(0, index));
      if (index <= FULL_TEXT.length) {
        index++;
        timeout = setTimeout(typeText, 100);
      } else {
        setTimeout(() => {
          index = 0;
          typeText();
        }, 1500);
      }
    };
    typeText();
    return () => clearTimeout(timeout);
  }, []);


  // Form
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  // Role Navigation
  const navigateByRole = (userType) => {
    if (userType === "Admin") navigate("/admin");
    else if (userType === "Employee") navigate("/employee");
    else if (userType === "Professional") navigate("/professional");
    else navigate("");
  };

  // Nexora Login Submit
  const onSubmit = async (data) => {
    try {
      const result = await dispatch(loginUser(data)).unwrap();
      const userType = result?.userProfile?.type;
      toast.success(`Welcome back ${result.userProfile?.name || "User"}!`);
      navigateByRole(userType);
    } catch (err) {
      toast.error(err?.message || "Login failed. Please try again.");
    }
  };

  // Google Login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      const result = await dispatch(googleLoginUser(idToken)).unwrap();
      navigateByRole(result?.userProfile?.type);
    } catch (err) {
      toast.error("Google Sign-In failed.");
    }
  };

  useEffect(() => {
    const finalOtp = otp.join("");
    if (finalOtp.length === 4) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handleOtpInput = (e, index) => {
    let value = e.target.value.replace(/\D/g, "");
    const newOtp = [...otp];

    // BACKSPACE
    if (!value) {
      newOtp[index] = "";
      setOtp(newOtp);
      if (index > 0) otpRefs.current[index - 1].focus();
      return;
    }

    // NORMAL DIGIT
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box
    if (index < 3) otpRefs.current[index + 1].focus();
  };

  const handleVerifyOtp = () => {
    if (isVerifying) return; // prevent double click
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) return toast.error("Enter all 4 digits");
    setIsVerifying(true); // Start verifying mode

    dispatchP(
      verifyProfessionalOtp({
        mobile,
        requestID: professionalRequestID,
        otp: finalOtp,
      })
    )
      .unwrap()
      .then(async (res) => {
        toast.success("OTP Verified!");

        // ✅ If user already exists
        if (res.existingUser && res.userData) {
          const user = res.userData;

          const loginuser = user?.userMobileNumberHash; // required header loginuser
          const authtoken = user?.authTokenDigest; // required header authtoken
          const dbName = user?.parentUserMobileNumber; // required header x-db-name

          // 4) Now save headers to localStorage AFTER gate pass
          localStorage.setItem(
            'professionalHeaders',
            JSON.stringify({
              'x-db-name': dbName,
              authtoken,
              loginuser,
            }),
          );
          // --- Store user profile info (for UI) ---
          const fullName = `${user.userFirstName || ''}  ${user.userLastName || ''}`.trim();

          localStorage.setItem(
            'professionalUser',
            JSON.stringify({
              name: fullName || 'Professional User',
              type: user.userType || 'Tax Expert',
              profilePic: user.profilePic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              userMobileNumberHash: user?.userMobileNumberHash,
              userEmail: user.userEmail,
            }),
          );
          try {
            if (user.userEmail) {
              await OneSignal.login(user.userEmail);
              console.log('📲 OneSignal logged in (PROFESSIONAL):', user.userEmail);
            } else {
              console.warn('⚠️ No professional userEmail found for OneSignal login');
            }
          } catch (err) {
            console.error('❌ OneSignal PRO login error:', err);
          }

          navigate('/professional');
        }

        // 🚀 If user does not exist → go to registration
        else {
          navigate("/professionalRegister");
        }
      })
      .catch((err) => {
        toast.error(err.message);
        setIsVerifying(false);
      });
  };

  const handleResendOtp = () => {
    dispatchP(sendProfessionalOtp(mobile))
      .unwrap()
      .then(() => toast.success("OTP Re-sent!"))
      .catch((err) => {
        toast.error(err.message);
        setOtp(["", "", "", ""]);
        otpRefs.current[0]?.focus();
      });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f5f7ff] to-[#eef1ff]">
      {/* ================= BACKGROUND SECTION ================= */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute top-0 left-0 w-full h-[380px] md:h-[420px] bg-cover bg-center"
        style={{ backgroundImage: `url(${LoginImgae})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-indigo-900/70 to-violet-900/70 backdrop-blur-[2px]"></div>
        {/* Floating Dots */}
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">

          <motion.span
            animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-60"
          />

          <motion.span
            animate={{ y: [0, -20, 0], x: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 right-20 w-2 h-2 bg-white rounded-full opacity-50"
          />

          <motion.span
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute top-32 left-1/3 w-1 h-1 bg-white rounded-full opacity-70"
          />

          <motion.span
            animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-16 right-1/4 w-2 h-2 bg-white rounded-full opacity-60"
          />

          <motion.span
            animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            className="absolute top-40 right-1/2 w-1 h-1 bg-white rounded-full opacity-50"
          />

          <motion.span
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-52 left-20 w-3 h-3 bg-white rounded-full opacity-30"
          />

          <motion.span
            animate={{ y: [0, -14, 0], x: [0, 7, 0] }}
            transition={{ duration: 4.5, repeat: Infinity }}
            className="absolute top-72 right-10 w-2 h-2 bg-white rounded-full opacity-40"
          />

          <motion.span
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-60 left-1/2 w-4 h-4 bg-white rounded-full opacity-20"
          />

          <motion.span
            animate={{ y: [0, -16, 0], x: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-80 left-1/4 w-2 h-2 bg-white rounded-full opacity-60"
          />

          <motion.span
            animate={{ y: [0, -22, 0] }}
            transition={{ duration: 6.5, repeat: Infinity }}
            className="absolute top-24 left-2/3 w-1 h-1 bg-white rounded-full opacity-70"
          />

          <motion.span
            animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-44 right-1/3 w-3 h-3 border border-white rounded-full opacity-30"
          />

          <motion.span
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-64 right-1/4 w-2 h-2 bg-white rounded-full opacity-40"
          />

        </div>

      </motion.div >
      {/* ================= CURVE SHAPE ================= */}
      < div className="absolute top-[250px] md:top-[322px] left-0 w-full overflow-hidden leading-none" >
        <svg
          viewBox="0 0 1440 320"
          className="block w-full h-[120px] md:h-[160px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#f3f3f9"
            d="M0,96L1440,224L1440,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* ================= LOGIN CARD ================= */}
      < div className="relative z-20 flex flex-col items-center justify-center gap-10 min-h-screen px-4 py-10" >
        <div className="flex flex-col items-center space-y-5 w-full ">
          <motion.img
            src={eTaxSoln}
            alt="Professional"
            className="w-50 mx-auto my-0 px-3 py-1 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 mb-1"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <h4 className="text-white/80 mb-3">Finance & Tax Made Easy</h4>
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className=" w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-white/20 p-6 sm:p-8 transition-all duration-300">
            {/* Heading */}
            <div className="text-center mb-3">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-indigo-950">Welcome to FinEZ!</h2>
              <p className="text-gray-400 tracking-wide mt-2 text-sm sm:text-base leading-relaxed">
                Sign in to continue FinEZ.
              </p>
            </div>

            {/* Username */}
            {showOtpPopup ? (
              <>
                {/* Title */}
                <h3 className="text-lg font-semibold text-center text-gray-800 ">Enter OTP</h3>

                {/* OTP Boxes */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center gap-3 mt-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(e, index)}
                      className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-xl bg-gray-50 outline-none focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200" />
                  ))}
                </motion.div>

                {/* Resend */}
                <p className="text-center text-sm my-3">
                  Didn't receive OTP? <span className=" text-blue-600 cursor-pointer" onClick={handleResendOtp}>Resend</span>
                </p>

                {/* Next Button */}
                <AuthButton {...{ loader: isVerifying, clickCb: handleVerifyOtp }} />
              </>
            ) : <>
              <div>
                <label htmlFor="mobileNumber" className="block mb-2 font-medium text-sm text-gray-700">Enter Mobile Number</label>
                <div className=" flex items-center border border-gray-300 rounded-xl overflow-hidden mb-4 bg-gray-50 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all duration-200">
                  <span className="px-4 py-3 bg-gray-100 text-gray-700 font-medium border-r border-gray-200 select-none">+91</span>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();

                        if (mobile.length !== 10) {
                          return toast.error("Enter valid mobile");
                        }

                        dispatch(sendProfessionalOtp(mobile))
                          .unwrap()
                          .then(() => {
                            toast.success("OTP Sent!");
                            setShowOtpPopup(true);
                          })
                          .catch((err) => toast.error(err.message));
                      }
                    }}
                    className="w-full px-4 py-3 bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400" placeholder="Enter mobile number" />
                </div>
              </div>
              <AuthButton {...{
                loader: professionalLoading, clickCb: () => {
                  if (mobile.length !== 10) return toast.error('Enter valid mobile');
                  dispatch(sendProfessionalOtp(mobile))
                    .unwrap()
                    .then(() => {
                      toast.success('OTP Sent!');
                      setShowOtpPopup(true);
                    })
                    .catch((err) => toast.error(err.message));
                }
              }} />
            </>}
            <p className="text-xs text-gray-600 mt-3">
              By entering OTP, you agree to our{' '}
              <span className="text-blue-600 underline cursor-pointer" onClick={() => setShowTerms(true)}>
                Terms & Conditions
              </span>
            </p>
          </motion.div>
        </div>
        {/* ================= COPYRIGHT ================= */}
        <div className="absolute bottom-5 left-0 w-full text-center z-30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-24 h-px bg-gray-300/50 mb-3"></div>

            <p className="text-xs md:text-sm text-gray-500">
              © {new Date().getFullYear()} FinEZ.
              All Rights Reserved.
            </p>

            <p className="text-xs text-gray-400">
              Designed & Developed by
              <span className="text-indigo-600 font-medium ml-1">
                NexoraX
              </span>
            </p>

          </motion.div>
        </div>
      </div >

      {showTerms && (
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          {/* Modal Box */}
          <div className="bg-white w-full max-w-[900px] rounded-lg shadow-xl relative max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-700">Terms & Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="text-xl text-gray-500 hover:text-black cursor-pointer">
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-5 py-4 overflow-y-auto max-h-[70vh] text-gray-700 space-y-4 scroll-smooth">
              {termsAndConditions.map(({ title, text }, index) => <Section key={index} title={title} text={text} />)}
              <p className="text-sm mt-4">By using the Application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div >
  );
};

export default Login;