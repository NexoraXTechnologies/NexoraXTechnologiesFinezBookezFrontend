import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BeatLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bot,
  ChevronDown,
  Download,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";

import {
  aiTaxChat,
  downloadTaxPdf,
  generateTaxSummary,
  getTaxSummary,
  saveITR1NewRegime,
} from "../../../redux/slices/professionalSlice/ai/aiTaxCopilotSlice";

import { getAllTaxPayers } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { fetchTISByDocId } from "../../../redux/slices/professionalSlice/incomeTaxSlice/tisSlice";
import DOMPurify from "dompurify";

const QUICK_QUESTIONS: any = [
  "What is Tax?",
  "What is Tax Computation?",
  "How to claim TDS refund?",
  "What happens if I miss the ITR deadline?",
  "Difference between old and new tax regime?",
];

const ASSESSMENT_YEARS: any = ["2024-2025", "2025-2026", "2026-2027"];

const AiTaxCopilot = ({ onClose }: any) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chatEndRef = useRef(null);
  const modalRef = useRef(null);
  const hasAskedDefaultQuestionRef = useRef(false);

  const DEFAULT_FIRST_QUESTION =
    "Generate a detailed Old vs New tax computation with full breakup, interest, rebate, cess, regime recommendation, and export the result as a PDF.";

  const { taxpayers } = useSelector((s: any) => s.taxpayer);
  const { taxSummary } = useSelector((s: any) => s.aiTaxCopilot);

  const [messages, setMessages] = useState<any>([]);
  const [input, setInput] = useState("");
  const [selectedPAN, setSelectedPAN] = useState("");
  const [assessmentYear, setAssessmentYear] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [aisDataState]: any = useState(null);

  const [confirmTooltip, setConfirmTooltip] = useState<any>({
    x: null,
    y: null,
    message: "",
    onConfirm: null,
  });

  const professionalUser = JSON.parse(
    localStorage.getItem("professionalUser") || "{}"
  );

  const firstName = professionalUser?.name?.split(" ")[0] || "there";

  const openConfirmTooltip = ({ x, y, message, onConfirm }: any) => {
    setConfirmTooltip({
      x,
      y,
      message,
      onConfirm,
    });
  };

  useEffect(() => {
    // @ts-ignore
    dispatch(getAllTaxPayers({ search: "", limit: 500, page: 1 }));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedPAN || !assessmentYear) return;
    fetchDataWeb();
  }, [selectedPAN, assessmentYear]);

  useEffect(() => {
    // @ts-ignore
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

  const sendMessage = async (question: any) => {
    if (!question.trim()) return;

    setMessages((prev: any) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setIsBotTyping(true);

    try {
      const taxData = taxSummary?.summary ? { summary: taxSummary.summary } : {};

      // @ts-ignore
      const res = await dispatch(
        aiTaxChat({
          question,
          taxData,
        })
      );

      setIsBotTyping(false);

      const payload: any = res?.payload;
      const botAnswer = payload?.answer;
      const botHtml = payload?.html;
      const pdfMeta = payload?.pdf;

      if (botAnswer || botHtml) {
        setMessages((prev: any) => [
          ...prev,
          {
            sender: "bot",
            text: botAnswer || "",
            meta: {
              html: botHtml || null,
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

  const isPdfExpired = (msg: any) =>
    Date.now() > msg.timestamp + msg.meta.pdf.expiresInMinutes * 60 * 1000;

  const getModalCenterPosition = () => {
    if (!modalRef.current) return { x: 0, y: 0 };

    // @ts-ignore
    const rect = modalRef.current.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2 - 80,
      y: rect.top + rect.height / 2 - 40,
    };
  };

  const handleNoTaxpayerClick = (e: any) => {
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

  const showDocMissingConfirm = (message: any, path: any) => {
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
    let tisData;

    try {
      // @ts-ignore
      tisData = await dispatch(fetchTISByDocId(docId)).unwrap();
    } catch {
      showDocMissingConfirm(
        "TIS document not found.",
        "/professional/incometax/tis"
      );
      return;
    }

    const pan = tisData?.Data?.tisJSON?.data?.taxpayerInfo?.pan;
    const ay = tisData?.Data?.tisJSON?.data?.taxpayerInfo?.assessmentYear;

    if (!pan || !ay) {
      toast.error("PAN or Assessment Year not found in TIS");
      return;
    }

    const payload = {
      tis: tisData,
    };

    try {
      // @ts-ignore
      await dispatch(
        generateTaxSummary({
          payload,
          useLLM: true,
        })
      ).unwrap();

      // @ts-ignore
      await dispatch(getTaxSummary({ pan, ay })).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate or fetch tax summary");
    }
  };

  const handleDownloadPdf = async (pdfKey: any) => {
    try {
      // @ts-ignore
      const action = await dispatch(downloadTaxPdf(pdfKey));

      if (!downloadTaxPdf.fulfilled.match(action)) {
        throw new Error("Download failed");
      }

      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const normalizeHtmlForChat = (html: any) => {
    if (!html) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("ul h1, ul h2, ul h3, ul h4, ul h5").forEach((h) => {
      const ul = h.closest("ul");
      ul?.parentNode?.insertBefore(h, ul);
    });

    doc.querySelectorAll("ul").forEach((ul) => {
      ul.style.listStyleType = "disc";
      ul.style.paddingLeft = "1.25rem";
      ul.style.marginTop = "0.5rem";
    });

    doc.querySelectorAll("li").forEach((li) => {
      li.style.marginBottom = "0.25rem";
    });

    doc.body.innerHTML = doc.body.innerHTML.replace(
      /(?:^|\n)-\s+(.*)/g,
      "<li>$1</li>"
    );

    doc.querySelectorAll(":scope > li").forEach((li) => {
      const ul = document.createElement("ul");
      li.replaceWith(ul);
      ul.appendChild(li);
    });

    return doc.body.innerHTML;
  };

  const renderBotHtml = (html: any) => {
    return (
      <div
        className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-li:marker:text-blue-500"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(normalizeHtmlForChat(html)),
        }}
      />
    );
  };

  const isTaxSummaryHtml = (html: any) => {
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

  const extractCompactRowsFromTaxHtml = (html: any) => {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rows: any = [];
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
      const text = li.textContent?.trim() || "";

      if (!text.includes(":") && !text.startsWith("+")) {
        context = text;
        return;
      }

      if (!text.includes(":")) return;

      if (SKIP_KEYWORDS.some((k) => text.toLowerCase().includes(k))) return;

      const clean = text.replace(/^\+\s*/, "");
      const [rawLabel, ...rest] = clean.split(":");
      const value = rest.join(":").trim();

      if (!value) return;

      rows.push({
        label: rawLabel.trim(),
        value,
        context,
      });
    });

    return rows;
  };

  const CompactTaxChatTable = ({ html }: any) => {
    const rows = extractCompactRowsFromTaxHtml(html);
    if (!rows.length) return null;

    return (
      <div className="max-h-[240px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-[11px] leading-tight">
          <tbody>
            {rows.map((r: any, i: any) => (
              <tr key={i} className="odd:bg-slate-50/70">
                <td className="border-b border-slate-100 px-2 py-1.5 text-left font-bold text-slate-500">
                  {r.label}
                </td>

                <td className="max-w-[260px] break-words border-b border-slate-100 px-2 py-1.5 text-left font-semibold text-slate-900">
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
      const pan = aisDataState?.Data?.aisJSON?.data?.taxpayerInfo?.pan;
      const ay =
        aisDataState?.Data?.aisJSON?.data?.taxpayerInfo?.assessmentYear;

      if (!pan || !ay) {
        toast.error("PAN or Assessment Year missing");
        return;
      }

      if (!taxSummary?.summary) {
        toast.error("Tax summary not available");
        return;
      }

      const payload = {
        taxData: {
          summary: {
            ...taxSummary.summary,
          },
        },
        regime: "N",
        assessmentYear: ay,
      };

      // @ts-ignore
      const res = await dispatch(saveITR1NewRegime(payload)).unwrap();
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.message || "Failed to file ITR-1");
    }
  };

  const canSend = input.trim().length > 0;

  return (
    <div
      ref={modalRef}
      className="flex h-full flex-col overflow-hidden bg-slate-50"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#155dfc] via-[#3157f6] to-[#6d28d9] px-5 py-5 text-white">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur">
              <Sparkles size={22} />
            </div>

            <div>
              <div className="text-xl font-black tracking-tight">
                AI Tax Copilot
              </div>
              <div className="mt-1 text-sm font-semibold text-white/75">
                Your personal tax assistant
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={() => {
                resetCopilotState();
                onClose();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.isArray(taxpayers) && taxpayers.length > 0 ? (
            <div className="relative">
              <select
                value={selectedPAN}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length === 10 || value === "") {
                    setSelectedPAN(value);
                  }
                }}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select PAN</option>
                {taxpayers.map((t: any) => (
                  <option key={t.pan} value={t.pan}>
                    {t.pan}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          ) : (
              <button
                type="button"
                onClick={handleNoTaxpayerClick}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              >
              <UserPlus size={16} />
              Add Tax Payer
            </button>
          )}

          <div className="relative">
            <select
              value={assessmentYear}
              onChange={(e) => setAssessmentYear(e.target.value)}
              className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Assessment Year</option>
              {ASSESSMENT_YEARS.map((ay: any) => (
                <option key={ay} value={ay}>
                  {ay}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5">
        {messages.length === 0 && (
          <div className="mx-auto mt-8 flex max-w-[380px] flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 shadow-sm">
              <Bot size={30} />
            </div>

            <div className="text-xl font-black text-slate-900">
              Hi {firstName},
            </div>

            <div className="mt-1 text-sm font-semibold text-slate-500">
              What would you like to understand today?
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="mx-auto mt-6 flex max-w-[390px] flex-wrap justify-center gap-2.5">
            {QUICK_QUESTIONS.map((q: any) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m: any, i: any) => (
            <div
              key={i}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.sender === "user"
                  ? "rounded-br-md bg-blue-600 text-white"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  }`}
              >
                {m.sender === "user" ? (
                  <div className="font-semibold">{m.text}</div>
                ) : m.meta?.html && isTaxSummaryHtml(m.meta.html) ? (
                  <CompactTaxChatTable html={m.meta.html} />
                ) : m.meta?.html ? (
                  renderBotHtml(m.meta.html)
                ) : (
                  <div className="font-semibold">{m.text}</div>
                )}

                {m.meta?.pdf?.fileId && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={isPdfExpired(m)}
                      onClick={() => handleDownloadPdf(m.meta.pdf.fileId)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${isPdfExpired(m)
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                    >
                      <Download size={14} />
                      {isPdfExpired(m) ? "PDF Expired" : "Download PDF"}
                    </button>

                    <button
                      type="button"
                      onClick={handleFileItr1WithNewRegime}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <FileText size={14} />
                      File ITR-1 New Regime
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isBotTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <BeatLoader size={8} color="#2563eb" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
          <MessageCircle size={19} className="shrink-0 text-slate-400" />

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask anything about tax..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />

          <button
            disabled={!canSend}
            onClick={() => sendMessage(input)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${canSend
              ? "bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700"
              : "bg-slate-200 text-slate-400"
              }`}
          >
            <Send size={17} />
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