import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BeatLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FileText, Download } from "lucide-react";
import {
  aiTaxChat,
  downloadTaxPdf,
  generateTaxSummary,
  getTaxSummary,
  saveITR1NewRegime
} from "../../../redux/slices/professionalSlice/ai/aiTaxCopilotSlice";
import { getAllTaxPayers } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { fetchTISByDocId } from "../../../redux/slices/professionalSlice/incomeTaxSlice/tisSlice";
import { fetchAISByDocId } from "../../../redux/slices/professionalSlice/incomeTaxSlice/aisSlice";
import { fetchForm26ASByDocId } from "../../../redux/slices/professionalSlice/incomeTaxSlice/form26asSlice";
import DOMPurify from "dompurify";
// -------------------------------------
// Helpers
// -------------------------------------
const QUICK_QUESTIONS = [
  "What is Tax?",
  "What is Tax Computation?",
  "How to claim TDS refund?",
  "What happens if I miss the ITR deadline?",
  "Difference between old and new tax regime?",
];

const ASSESSMENT_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

// -------------------------------------
// Component
// -------------------------------------
const AiTaxCopilot = ({ onClose }) => {
  const dispatch = useDispatch();
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const modalRef = useRef(null);

  const [confirmTooltip, setConfirmTooltip] = useState({
    x: null,
    y: null,
    message: "",
    onConfirm: null,
  });
  const openConfirmTooltip = ({ x, y, message, onConfirm }) => {
    setConfirmTooltip({
      x,
      y,
      message,
      onConfirm,
    });
  };
  const DEFAULT_FIRST_QUESTION =
    "Generate a detailed Old vs New tax computation with full breakup, interest, rebate, cess, regime recommendation, and export the result as a PDF.";
  const { taxpayers } = useSelector((s) => s.taxpayer);
  const { taxSummary } = useSelector((s) => s.aiTaxCopilot);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedPAN, setSelectedPAN] = useState("");
  const [assessmentYear, setAssessmentYear] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [confirmNav, setConfirmNav] = useState({
    open: false,
    message: "",
    path: "",
  });
  const [aisDataState, setAisDataState] = useState(null);

  // -------------------------------------
  // User name (first name only)
  // -------------------------------------
  const professionalUser = JSON.parse(
    localStorage.getItem("professionalUser") || "{}"
  );
  const firstName = professionalUser?.name?.split(" ")[0] || "there";

  // -------------------------------------
  // Load PAN list
  // -------------------------------------
  useEffect(() => {
    dispatch(getAllTaxPayers({ search: "", limit: 500, page: 1 }));
  }, [dispatch]);

  // -------------------------------------
  // Generate summary when PAN + AY selected
  // -------------------------------------
  useEffect(() => {
    if (!selectedPAN || !assessmentYear) return;
    fetchDataWeb();
  }, [selectedPAN, assessmentYear]);
  // -------------------------------------
  // Scroll to bottom
  // -------------------------------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  useEffect(() => {
    if (
      taxSummary?.summary &&
      selectedPAN &&
      assessmentYear &&
      !hasAskedDefaultQuestionRef.current
    ) {
      hasAskedDefaultQuestionRef.current = true;
      sendMessage(DEFAULT_FIRST_QUESTION);
    }
  }, [taxSummary, selectedPAN, assessmentYear]);
  useEffect(() => {
    hasAskedDefaultQuestionRef.current = false;
    setMessages([]);
  }, [selectedPAN, assessmentYear]);
  // -------------------------------------
  // Send message
  // -------------------------------------
  const sendMessage = async (question) => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setIsBotTyping(true);

    try {
      const taxData = taxSummary?.summary
        ? { summary: taxSummary.summary }
        : {};

      const res = await dispatch(
        aiTaxChat({
          question,
          taxData,
        })
      );

      setIsBotTyping(false);

      const payload = res?.payload;
      const botAnswer = payload?.answer;
      const botHtml = payload?.html; // ✅ GET HTML
      const pdfMeta = payload?.pdf;

      if (botAnswer || botHtml) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botAnswer || "",
            meta: {
              html: botHtml || null, // ✅ STORE HTML
              pdf: pdfMeta || null,
            },
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err) {
      setIsBotTyping(false);
      toast.error("AI response failed");
    }
  };
  const isPdfExpired = (msg) =>
    Date.now() > msg.timestamp + msg.meta.pdf.expiresInMinutes * 60 * 1000;
  // -------------------------------------
  // UI
  // -------------------------------------
  const handleNoTaxpayerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    openConfirmTooltip({
      x: rect.left + rect.width / 2 - 80,
      y: rect.bottom + window.scrollY + 8,
      message: "No taxpayer found. Want to add one?",
      onConfirm: () => {
        navigate("/professional/incometax/addtaxpayer");
      },
    });
  };
  const showDocMissingConfirm = (message, path) => {
    toast.error(message);

    setTimeout(() => {
      const { x, y } = getModalCenterPosition();

      openConfirmTooltip({
        x,
        y,
        message: `${message} Do you want to upload it now?`,
        onConfirm: () => navigate(path),
      });
    }, 300);
  };
  const fetchDataWeb = async () => {
    if (!selectedPAN || !assessmentYear) return;

    const docId = `${selectedPAN}${assessmentYear}`;

    let aisData, tisData, form26asData;

    // try {
    //   aisData = await dispatch(fetchAISByDocId(docId)).unwrap();
    //   setAisDataState(aisData);
    // } catch {
    //   showDocMissingConfirm('AIS document not found.', '/professional/incometax/ais');
    //   return;
    // }

    try {
      tisData = await dispatch(fetchTISByDocId(docId)).unwrap();
    } catch {
      showDocMissingConfirm('TIS document not found.', '/professional/incometax/tis');
      return;
    }

    // try {
    //   form26asData = await dispatch(fetchForm26ASByDocId(docId)).unwrap();
    // } catch {
    //   showDocMissingConfirm(
    //     "Form 26AS document not found.",
    //     "/professional/incometax/form26as"
    //   );
    //   return;
    // }

    // -----------------------------
    // Extract PAN & AY from AIS
    // -----------------------------

    const pan = tisData?.Data?.tisJSON?.data?.taxpayerInfo?.pan;
    // console.log('pan', pan);
    const ay = tisData?.Data?.tisJSON?.data?.taxpayerInfo?.assessmentYear;
    // console.log('ay', ay);

    if (!pan || !ay) {
      toast.error('PAN or Assessment Year not found in AIS');
      return;
    }

    const payload = {
      // ais: aisData,
      tis: tisData,
      // form26as: form26asData,
    };

    try {
      // -----------------------------
      // 1️⃣ POST: Generate summary
      // -----------------------------
      await dispatch(
        generateTaxSummary({
          payload,
          useLLM: true,
        }),
      ).unwrap();

      // -----------------------------
      // 2️⃣ GET: Fetch generated summary
      // -----------------------------
      await dispatch(getTaxSummary({ pan, ay })).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Failed to generate or fetch tax summary');
    }
  };;
  const getModalCenterPosition = () => {
    if (!modalRef.current) return { x: 0, y: 0 };

    const rect = modalRef.current.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2 - 80, // tooltip width offset
      y: rect.top + rect.height / 2 - 40,
    };
  };
  const handleDownloadPdf = async (pdfKey) => {
    try {
      const action = await dispatch(downloadTaxPdf(pdfKey));

      if (!downloadTaxPdf.fulfilled.match(action)) {
        throw new Error("Download failed");
      }

      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const normalizeHtmlForChat = (html) => {
    if (!html) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // 1️⃣ Move headings out of <ul> (invalid HTML fix)
    doc.querySelectorAll("ul h1, ul h2, ul h3, ul h4, ul h5").forEach((h) => {
      const ul = h.closest("ul");
      ul?.parentNode?.insertBefore(h, ul);
    });

    // 2️⃣ Ensure <ul> has bullet styling
    doc.querySelectorAll("ul").forEach((ul) => {
      ul.style.listStyleType = "disc";
      ul.style.paddingLeft = "1.25rem";
      ul.style.marginTop = "0.5rem";
    });

    // 3️⃣ Ensure <li> spacing
    doc.querySelectorAll("li").forEach((li) => {
      li.style.marginBottom = "0.25rem";
    });

    // 4️⃣ Normalize lone dash bullets (text like "- something")
    doc.body.innerHTML = doc.body.innerHTML.replace(
      /(?:^|\n)-\s+(.*)/g,
      "<li>$1</li>"
    );

    // 5️⃣ Wrap orphan <li> inside <ul>
    doc.querySelectorAll(":scope > li").forEach((li) => {
      const ul = document.createElement("ul");
      li.replaceWith(ul);
      ul.appendChild(li);
    });

    return doc.body.innerHTML;
  };
  const renderBotHtml = (html) => {
    return (
      <div
        className="mt-2 text-sm text-gray-900"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(normalizeHtmlForChat(html)),
        }}
      />
    );
  };
  const hasAskedDefaultQuestionRef = useRef(false);
  const isTaxSummaryHtml = (html) => {
    return typeof html === "string" && html.includes("Tax Computation");
  };
  const resetCopilotState = () => {
    hasAskedDefaultQuestionRef.current = false;
    setMessages([]);
    setInput("");
    setSelectedPAN("");
    setAssessmentYear("");
    setIsBotTyping(false);
  };
  const extractCompactRowsFromTaxHtml = (html) => {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rows = [];
    let context = "";

    const SKIP_KEYWORDS = [
      "slab",
      "breakup",
      "applied",
      "exported",
      "actionable",
      "smart",
      "recommendation",
    ];

    doc.querySelectorAll("li").forEach((li) => {
      const text = li.textContent.trim();

      // Track section (non key-value headings)
      if (!text.includes(":") && !text.startsWith("+")) {
        context = text;
        return;
      }

      if (!text.includes(":")) return;

      if (SKIP_KEYWORDS.some((k) => text.toLowerCase().includes(k))) return;

      const clean = text.replace(/^\+\s*/, "");
      const [rawLabel, ...rest] = clean.split(":");
      const value = rest.join(":").trim();

      // Ignore non-value rows
      if (!value || value.length === 0) return;

      rows.push({
        label: rawLabel.trim(),
        value,
        context,
      });
    });

    return rows;
  };
  const CompactTaxChatTable = ({ html }) => {
    const rows = extractCompactRowsFromTaxHtml(html);
    if (!rows.length) return null;

    return (
      <div className="border rounded bg-white max-h-[220px] overflow-y-auto">
        <table className="w-full text-[10px] leading-tight border-collapse">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {/* LABEL */}
                <td className="border px-[4px] py-[2px] text-gray-600 whitespace-nowrap text-left">
                  {r.label}
                </td>

                {/* VALUE */}
                <td
                  className="
                  border px-[4px] py-[2px]
                  text-gray-900 font-medium text-left
                  break-words whitespace-normal
                  max-w-[260px]
                  leading-[1.25]
                "
                >
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleFileItr1WithNewRegime = async () => {
  try {
    // -----------------------------
    // PAN & AY (from AIS)
    // -----------------------------
    const pan =
  aisDataState?.Data?.aisJSON?.data?.taxpayerInfo?.pan;

const ay =
  aisDataState?.Data?.aisJSON?.data?.taxpayerInfo?.assessmentYear;

    if (!pan || !ay) {
      toast.error("PAN or Assessment Year missing");
      return;
    }
    // -----------------------------
    // Tax Summary (mandatory)
    // -----------------------------
    if (!taxSummary?.summary) {
      toast.error("Tax summary not available");
      return;
    }

    // -----------------------------
    // Payload as required by API
    // -----------------------------
    const payload = {
      taxData: {
        summary: {
          ...taxSummary.summary, 
            
        }},
        regime: "N",            
        assessmentYear: ay,
    };

    // -----------------------------
    // Dispatch save API
    // -----------------------------
    const res = await dispatch(saveITR1NewRegime(payload)).unwrap();
    toast.success(res.message); 
  } catch (err) {
    toast.error(err?.message || "Failed to file ITR-1");
  }
};

  return (
    <div
      ref={modalRef}
      className="flex flex-col h-full bg-white rounded-2xl shadow-xl border overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="px-5 py-4 flex items-center justify-between">
          {/* Left: Title */}
          <div>
            <div className="font-semibold text-lg">AI Tax Copilot</div>
            <div className="text-xs opacity-80">
              Your personal tax assistant
            </div>
          </div>

          {/* Right: Close Button */}
          {onClose && (
            <button
              onClick={() => {
                resetCopilotState();
                onClose();
              }}
              className="text-white/80 hover:text-white text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b grid grid-cols-2 gap-3">
        {/* PAN Selection */}
        {Array.isArray(taxpayers) && taxpayers.length > 0 ? (
          <select
            value={selectedPAN}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length === 10) {
                setSelectedPAN(value);
              }
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select PAN</option>
            {taxpayers.map((t) => (
              <option key={t.pan} value={t.pan}>
                {t.pan}
              </option>
            ))}
          </select>
        ) : (
          <div
            onClick={handleNoTaxpayerClick}
            className="border border-dashed border-red-300 bg-red-50
               text-red-600 rounded-lg px-3 py-2 text-sm
               cursor-pointer text-center hover:bg-red-100 transition"
          >
            No Tax Payer Found Click To Add
          </div>
        )}

        <select
          value={assessmentYear}
          onChange={(e) => setAssessmentYear(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Assessment Year</option>
          {ASSESSMENT_YEARS.map((ay) => (
            <option key={ay} value={ay}>
              {ay}
            </option>
          ))}
        </select>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {/* Greeting (only when no chat) */}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">
            <div className="text-lg font-semibold text-gray-700">
              Hi {firstName},
            </div>
            <div>what’s on your mind today?</div>
          </div>
        )}

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs hover:bg-blue-200"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] px-4 py-2 rounded-xl text-sm ${
              m.sender === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-white border"
            }`}
          >
            {m.sender === "user" ? (
              <div>{m.text}</div>
            ) : m.meta?.html && isTaxSummaryHtml(m.meta.html) ? (
              <CompactTaxChatTable html={m.meta.html} />
            ) : m.meta?.html ? (
              renderBotHtml(m.meta.html)
            ) : (
              <div>{m.text}</div>
            )}

            {m.meta?.pdf?.fileId && (
              <div className="mt-3 space-y-2">
                {/* Primary PDF Download */}
                <button
                  disabled={isPdfExpired(m)}
                  onClick={() => handleDownloadPdf(m.meta.pdf.fileId)}
                  className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-xs
                  border transition
                  ${
                    isPdfExpired(m)
                      ? "text-gray-400 border-gray-200 cursor-not-allowed"
                      : "text-blue-700 border-blue-300 hover:bg-blue-50"
                  }
                `}
                >
                  <Download size={14} />
                  {isPdfExpired(m) ? "PDF Expired" : "Download Tax Summary PDF"}
                </button>

                {/* ITR-1 (New Regime) */}
                <button
                  type="button"
                  onClick={handleFileItr1WithNewRegime}
                  className="
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-xs
                    border border-green-300 text-green-700
                    hover:bg-green-50 transition
                  "
                >
                  <FileText size={14} />
                  File ITR-1 With New Regime
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Bot Loader */}
        {isBotTyping && (
          <div className="mr-auto bg-white border px-4 py-3 rounded-xl">
            <BeatLoader size={8} color="#2563eb" />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask anything about tax…"
            className="flex-1 rounded-full border bg-gray-100 px-4 py-2 text-sm focus:outline-none"
          />
          <button
            disabled={!input.trim()}
            onClick={() => sendMessage(input)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white grid place-items-center disabled:bg-gray-300"
          >
            ↑
          </button>
        </div>
      </div>
      {confirmTooltip.message && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message={confirmTooltip.message}
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={() => {
            confirmTooltip.onConfirm?.();
            setConfirmTooltip({
              x: null,
              y: null,
              message: "",
              onConfirm: null,
            });
          }}
          onCancel={() =>
            setConfirmTooltip({
              x: null,
              y: null,
              message: "",
              onConfirm: null,
            })
          }
        />
      )}
    </div>
  );
};

export default AiTaxCopilot;
