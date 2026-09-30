"use client"; // This page runs in the visitor's browser (needed for clicks, answers, and the form)

// ── IMPORTS ──────────────────────────────────────────────────────
// useState: lets the page remember things (current question, answers, whether the email was entered)
// HubspotForm: the email form component in components/HubspotForm.tsx
import { useState } from "react";
import HubspotForm from "@/components/HubspotForm";

// ── PRIVACY NOTE SHOWN ON THE INTRO SCREEN ───────────────────────
// Edit the wording here and it updates everywhere it's used.
const INTRO_NOTE = "Your answers are used only to generate your assessment. If you'd like a PDF copy, we'll ask for your email.";

// ── TYPES ────────────────────────────────────────────────────────
// These describe the shape of the data below, so TypeScript can catch mistakes.

type CategoryKey = "vendor" | "cloud" | "procurement" | "flash" | "ai";
type Screen = "intro" | "quiz" | "results";

interface Answer { label: string; s: number; }
interface Question { category: string; subtitle: string; text: string; answers: Answer[]; key: CategoryKey; }
interface Threshold { lo: number; hi: number; label: string; emoji: string; color: string; bg: string; border: string; desc: string; remediate: string; }
interface RiskStyle { label: string; color: string; bg: string; border: string; }

// ── CATEGORY NAMES ───────────────────────────────────────────────
// The 5 categories the quiz scores. The short key (left) links each question to a category.
const CATEGORIES: { [K in CategoryKey]: string } = {
  vendor:      "Vendor & Hardware Concentration",
  cloud:       "Cloud Optionality",
  procurement: "Procurement & Supply Chain",
  flash:       "Flash Dependency & Architecture",
  ai:          "AI & Growth",
};

// ── THE 10 QUESTIONS ─────────────────────────────────────────────
// Each answer has a score "s" from 1 (lowest risk) to 4 (highest risk).
// To change a question or answer, edit the text inside the quotes.
const questions: Question[] = [
  { category: "Vendor & Hardware Concentration", subtitle: "Vendor Concentration", text: "How many storage hardware vendors do you actively rely on today?", answers: [{ label: "Three or more", s: 1 }, { label: "Two", s: 2 }, { label: "Effectively one, with a backup option", s: 3 }, { label: "A single vendor", s: 4 }], key: "vendor" },
  { category: "Vendor & Hardware Concentration", subtitle: "Adaptability", text: "If your primary vendor's hardware became unavailable, how easily could you run your storage on hardware from a different supplier?", answers: [{ label: "Easily — our infrastructure software stack runs on standard servers and storage from many suppliers", s: 1 }, { label: "With some effort or professional services", s: 2 }, { label: "Difficult — tightly tied to one platform", s: 3 }, { label: "Not possible — hardware and software are locked together", s: 4 }], key: "vendor" },
  { category: "Cloud Optionality", subtitle: "Quick Relief", text: "If your hardware lead times exceed 12 weeks, how quickly could you add capacity in the cloud for a new initiative?", answers: [{ label: "Near Instant — already running in cloud / could burst in hours or days", s: 1 }, { label: "Possible — may require weeks of setup or re-architecting", s: 2 }, { label: "Conditional — only functional for limited or secondary workloads", s: 3 }, { label: "Blocked — not an option today", s: 4 }], key: "cloud" },
  { category: "Cloud Optionality", subtitle: "Operational Continuity", text: "Can your teams use the same data across on-prem and cloud without copying or migrating it?", answers: [{ label: "Yes — one namespace spans all locations", s: 1 }, { label: "Partially — some data, with manual sync", s: 2 }, { label: "Only by fully copying or migrating it", s: 3 }, { label: "No — on-prem and cloud are separate (or no cloud)", s: 4 }], key: "cloud" },
  { category: "Procurement & Supply Chain", subtitle: "Adaptability", text: "Do you know what your lead times are for new Flash/NVMe storage hardware? If so, what is the timeline?", answers: [{ label: "Under 4 weeks", s: 1 }, { label: "4–8 weeks", s: 2 }, { label: "8–16 weeks", s: 3 }, { label: "More than 16 weeks, or unknown", s: 4 }], key: "procurement" },
  { category: "Procurement & Supply Chain", subtitle: "Planning", text: "How soon before you utilize all capacity you are under contract with your current storage suppliers?", answers: [{ label: "26 weeks or more before projected full capacity", s: 1 }, { label: "22 weeks or more before full", s: 2 }, { label: "18 weeks or more before full", s: 3 }, { label: "Less than 18 weeks before full consumption", s: 4 }], key: "procurement" },
  { category: "Flash Dependency & Architecture", subtitle: "Workload Priority", text: "How much of your storage environment depends on all-flash (NVMe)?", answers: [{ label: "Under 25%", s: 1 }, { label: "25–50%", s: 2 }, { label: "50–75%", s: 3 }, { label: "More than 75%", s: 4 }], key: "flash" },
  { category: "Flash Dependency & Architecture", subtitle: "Flexibility", text: "How easily can you grow capacity and performance independently — e.g. add low-cost disk capacity without also buying more flash?", answers: [{ label: "Fully flexible — we scale capacity and performance separately across mixed media", s: 1 }, { label: "Mostly — some flexibility with planning", s: 2 }, { label: "Limited — capacity and performance are largely tied together", s: 3 }, { label: "Not at all — every expansion means more flash", s: 4 }], key: "flash" },
  { category: "AI & Growth", subtitle: "Adaptability", text: "How fast is your unstructured data growing year over year?", answers: [{ label: "Under 5%", s: 1 }, { label: "5–15%", s: 2 }, { label: "15–30%", s: 3 }, { label: "More than 30%", s: 4 }], key: "ai" },
  { category: "AI & Growth", subtitle: "Mission Critical", text: "How much do your AI or data-intensive projects depend on fast flash storage to keep up?", answers: [{ label: "Not much — no real AI/analytics pressure on storage today", s: 1 }, { label: "Early exploration; light demand", s: 2 }, { label: "Growing — several projects need fast storage", s: 3 }, { label: "Heavily — AI in production; flash is a hard requirement", s: 4 }], key: "ai" },
];

// ── RISK LEVELS ──────────────────────────────────────────────────
// Which label a total score gets (e.g. 10–19 = Low Risk), plus its colors and advice text.
const THRESHOLDS: Threshold[] = [
  { lo: 10, hi: 19, label: "Low Risk",      emoji: "🟢", color: "#14532d", bg: "#dcfce7", border: "#16a34a", desc: "Strong architectural flexibility, multi-vendor, cloud-ready. Monitor the market but no urgent action needed.", remediate: "12+ months runway — no urgent action needed." },
  { lo: 20, hi: 29, label: "Moderate Risk", emoji: "🟡", color: "#713f12", bg: "#fef9c3", border: "#ca8a04", desc: "Some exposure to vendor concentration or supply chain gaps. Begin evaluating alternatives and cloud optionality.", remediate: "6–12 months — begin planning now." },
  { lo: 30, hi: 34, label: "High Risk",     emoji: "🟠", color: "#7c2d12", bg: "#ffedd5", border: "#ea580c", desc: "Meaningful vulnerability to supply disruption. Prioritize architectural review and procurement strategy.", remediate: "3–6 months — prioritize remediation this quarter." },
  { lo: 35, hi: 40, label: "Critical Risk", emoji: "🔴", color: "#7f1d1d", bg: "#fee2e2", border: "#dc2626", desc: "Highly exposed. Single-vendor, no cloud escape valve. Supply chain disruption could stall projects or trigger emergency spending.", remediate: "Act now — immediate action required." },
];

// The order the categories appear in on the results screen
const catKeys: CategoryKey[] = ["vendor", "cloud", "procurement", "flash", "ai"];

// ── HELPER FUNCTIONS ─────────────────────────────────────────────

// Finds the risk level (Low, Moderate, High, Critical) that matches the total score
function getOverallRisk(score: number): Threshold {
  return THRESHOLDS.find(t => score >= t.lo && score <= t.hi) || THRESHOLDS[THRESHOLDS.length - 1];
}
// Gives each category its own Low / Medium / High label, based on the percentage of its max score
function getCatRisk(score: number, max: number): RiskStyle {
  const pct = score / max;
  if (pct <= 0.33) return { label: "Low Risk",    color: "#14532d", bg: "#dcfce7", border: "#16a34a" };
  if (pct <= 0.66) return { label: "Medium Risk", color: "#713f12", bg: "#fef9c3", border: "#ca8a04" };
  return                  { label: "High Risk",   color: "#7f1d1d", bg: "#fee2e2", border: "#dc2626" };
}
// Works out which category number (1–5) a question belongs to, for the "Category X of 5" label
function getCatIndex(category: string): number {
  return catKeys.findIndex((k: CategoryKey) => CATEGORIES[k] === category);
}
// ── PDF DOWNLOAD ─────────────────────────────────────────────────
// Copies the results section, hides everything else, and opens the browser's
// print window, where the visitor can choose "Save as PDF".
function downloadPDF(): void {
  const root = document.getElementById('results-printable');
  const clone = root!.cloneNode(true) as HTMLElement;
  clone.id = 'print-clone';
  clone.style.cssText = 'position:static;width:100%;background:#f9fafb;padding:24px;box-sizing:border-box;';
  document.body.appendChild(clone);
  const s = document.createElement('style');
  s.id = 'pf';
  s.innerHTML = '@media print{@page{margin:0.6in;size:letter}body > *:not(#print-clone){display:none!important}#print-clone{display:block!important}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}*{overflow:visible!important;max-height:none!important;height:auto!important}button{display:none!important}}';
  document.head.appendChild(s);
  window.print();
  setTimeout(() => { const e = document.getElementById('pf'); if (e) e.remove(); const c = document.getElementById('print-clone'); if (c) c.remove(); }, 1500);
}

// ── UNUSED SECTION ───────────────────────────────────────────────
// This header is never shown on the page (nothing below uses it). It's leftover
// from an earlier version and can be deleted safely.
function ScoringHeader() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 28px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: "4px solid #111" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qumulo · 2-Minute Self-Assessment</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 6px" }}>Evaluate the impact of hardware shortages on infrastructure operations and planning.</p>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", lineHeight: 1.6 }}>Flash lead times, vendor concentration, and AI-driven growth are squeezing infrastructure supply chains. Answer 10 quick questions to see how the industry shortage may affect your planning — and what to do about it.</p>
      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px", fontStyle: "italic" }}>{INTRO_NOTE}</p>
      <div style={{ display: "flex", gap: 20, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
        {[["5", "Categories"], ["10", "Questions"], ["40", "Max Score"], ["~2 min", "Time"]].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── THE MAIN PAGE ────────────────────────────────────────────────
export default function Page() {
  // What the page remembers while someone uses it:
  // screen = which screen is showing, currentQ = question number,
  // answers = what they picked, selected = the answer highlighted right now,
  // emailSubmitted = whether they've filled in the email form
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);

  // Info about the current question, used by the quiz screen
  const q: Question = questions[currentQ];
  const isLast: boolean = currentQ === questions.length - 1;
  const progress: number = ((currentQ + 1) / questions.length) * 100;
  const catIdx: number = getCatIndex(q.category);

  // Runs when "Next" is clicked: saves the answer, then moves to the next question (or the results)
  function handleNext(): void {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (isLast) { setAnswers(newAnswers); setScreen("results"); }
    else { setAnswers(newAnswers); setCurrentQ(currentQ + 1); setSelected(null); }
  }
  // Runs when "Retake" is clicked: starts the quiz over.
  // The email stays unlocked, so people aren't asked twice.
  function handleRestart(): void {
    setScreen("intro"); setCurrentQ(0); setAnswers([]); setSelected(null);
  }

  // ── SCREEN 1: INTRO ──────────────────────────────────────────
  // The dark welcome card with the title and the Start button
  if (screen === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>
          {/* Hero card */}
          <div style={{ background: "radial-gradient(120% 140% at 80% -10%, #1b2f7a 0%, #04123d 45%, #08081a 100%)", borderRadius: 20, padding: "48px 40px", marginBottom: 0, boxShadow: "0 10px 40px rgba(52,99,241,0.35)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -60, top: -60, width: 260, height: 260, borderRadius: 40, background: "radial-gradient(circle, rgba(10,241,255,0.16), transparent 70%)", filter: "blur(6px)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0af1ff", margin: "0 0 14px" }}>Qumulo · 2-Minute Self-Assessment</p>
            <h1 style={{ fontFamily: "system-ui, sans-serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 800, lineHeight: 1.1, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.01em" }}>Evaluate the impact of hardware shortages on infrastructure operations and planning.</h1>
            <p style={{ fontSize: 16, color: "#cdd6f5", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 520 }}>Flash lead times, vendor concentration, and AI-driven growth are squeezing infrastructure supply chains. Answer 10 quick questions to see how the industry shortage may affect your planning — and what to do about it.</p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#aab6e6", marginBottom: 30 }}>
              <span><strong style={{ color: "#fff" }}>10</strong> questions</span>
              <span><strong style={{ color: "#fff" }}>~2 minutes</strong></span>
              <span><strong style={{ color: "#fff" }}>Instant</strong> assessment score</span>
            </div>
            <button onClick={() => setScreen("quiz")} style={{ background: "#3463f1", color: "#fff", border: "none", borderRadius: 10, padding: "15px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 18px rgba(52,99,241,0.35)", letterSpacing: "0.01em" }}>
              Start the assessment →
            </button>
            {/* Privacy note — the wording lives in INTRO_NOTE at the top of this file */}
            <p style={{ fontSize: 12, color: "#7a8bb5", margin: "16px 0 0", fontStyle: "italic" }}>{INTRO_NOTE}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: RESULTS ────────────────────────────────────────
  if (screen === "results") {
    // Add up the scores for each category, then the overall total
    const totals: { [K in CategoryKey]: number } = { vendor: 0, cloud: 0, procurement: 0, flash: 0, ai: 0 };
    answers.forEach((ai: number, qi: number) => { totals[questions[qi].key] += questions[qi].answers[ai].s; });
    const totalScore: number = Object.values(totals).reduce((a, b) => a + b, 0);
    const overall: Threshold = getOverallRisk(totalScore);

    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", padding: 24 }}>
        {/* Everything inside this box goes into the PDF */}
        <div id="results-printable" style={{ maxWidth: 560, margin: "0 auto" }}>
          {/* "Let's talk" box — only shows for scores above 25 */}
          {totalScore > 25 && (
            <div style={{ background: "#111", borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>💬 Let&apos;s talk about your score</p>
              <p style={{ fontSize: 13, color: "#d1d5db", margin: 0, lineHeight: 1.7 }}>You scored <strong style={{ color: "#fff" }}>{totalScore} out of 40</strong>. Organizations at this level often face real constraints when hardware availability shifts. Let&apos;s walk through what this looks like in your environment.</p>
            </div>
          )}
          {/* Overall score card with the risk label and bar */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 8px" }}>Overall Score</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#111" }}>{totalScore} <span style={{ fontSize: 16, color: "#9ca3af", fontWeight: 400 }}>/ 40</span></span>
              <span style={{ background: overall.bg, color: overall.color, border: `1px solid ${overall.border}`, borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>{overall.emoji} {overall.label}</span>
            </div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(totalScore / 40) * 100}%`, background: overall.border, borderRadius: 4 }} />
            </div>
          </div>
          {/* Score for each of the 5 categories, with PRIORITY and QUICK WIN tags */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 16px" }}>Score by Category</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {catKeys.map((key: CategoryKey, i: number) => {
                const name: string = CATEGORIES[key];
                const catMax: number = questions.filter((q: Question) => q.key === key).length * 4;
                const score: number = totals[key];
                const risk: RiskStyle = getCatRisk(score, catMax);
                const isPriority: boolean = key === "vendor" || key === "flash";
                const isQuickWin: boolean = key === "cloud";
                return (
                  <div key={key} style={{ padding: "14px 16px", borderRadius: 8, border: isPriority ? "1.5px solid #fca5a5" : isQuickWin ? "1.5px solid #86efac" : "1px solid #f3f4f6", background: isPriority ? "#fff7f7" : isQuickWin ? "#f0fdf4" : "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{name}</span>
                          {isPriority && <span style={{ fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "1px 6px" }}>PRIORITY</span>}
                          {isQuickWin && <span style={{ fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "1px 6px" }}>QUICK WIN</span>}
                        </div>
                        {isPriority && <p style={{ fontSize: 11, color: "#991b1b", margin: 0 }}>Architectural lock-in is the hardest problem to solve quickly.</p>}
                        {isQuickWin && <p style={{ fontSize: 11, color: "#166534", margin: 0 }}>Fastest lever most organizations can pull.</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, borderRadius: 999, padding: "1px 10px", fontSize: 11, fontWeight: 600 }}>{risk.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{score}/{catMax}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(score / catMax) * 100}%`, background: risk.border, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* All 4 risk levels, with the visitor's level highlighted */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 16px" }}>Risk Score Thresholds</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {THRESHOLDS.map((t: Threshold) => {
                const active: boolean = totalScore >= t.lo && totalScore <= t.hi;
                return (
                  <div key={t.lo} style={{ borderRadius: 8, border: `1px solid ${active ? t.border : "#f3f4f6"}`, background: active ? t.bg : "#fafafa", padding: "12px 16px", opacity: active ? 1 : 0.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span>{t.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>{t.lo}–{t.hi}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#374151", margin: "0 0 6px", lineHeight: 1.6 }}>{t.desc}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: t.color, margin: 0 }}>⏱ {t.remediate}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Every question with the answer the visitor picked and its score */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 20px" }}>Your Answers</p>
            {catKeys.map((key: CategoryKey) => {
              const name: string = CATEGORIES[key];
              const catQs: { q: Question; i: number }[] = questions.map((q: Question, i: number) => ({ q, i })).filter(({ q }: { q: Question; i: number }) => q.key === key);
              return (
                <div key={key} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px", paddingBottom: 6, borderBottom: "1px solid #f3f4f6" }}>{name}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {catQs.map(({ q, i }: { q: Question; i: number }) => {
                      const chosen: Answer = q.answers[answers[i]];
                      const s: number = chosen.s;
                      const sc: string = s === 1 ? "#16a34a" : s === 2 ? "#ca8a04" : s === 3 ? "#ea580c" : "#dc2626";
                      const sb: string = s === 1 ? "#dcfce7" : s === 2 ? "#fef9c3" : s === 3 ? "#ffedd5" : "#fee2e2";
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1px solid #f3f4f6", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 3px", fontWeight: 600 }}>Q{i + 1} · {q.subtitle}</p>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 4px", lineHeight: 1.5 }}>{q.text}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: 0 }}>{chosen.label}</p>
                          </div>
                          <span style={{ background: sb, color: sc, border: `1px solid ${sc}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── EMAIL GATE + BUTTONS (kept outside the printable area so they never end up in the PDF) ── */}
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {/* Email form — shows until the visitor submits it, then disappears */}
          {!emailSubmitted && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>Get your results as a PDF</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.6 }}>Enter your email to download your PDF. Qumulo may follow up about your results.</p>
              <HubspotForm onSubmitted={() => setEmailSubmitted(true)} />
            </div>
          )}
          {/* Retake button, and the Download button (greyed out until the email is submitted) */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleRestart} style={{ flex: 1, padding: 13, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", color: "#374151" }}>Retake</button>
            <button onClick={downloadPDF} disabled={!emailSubmitted} style={{ flex: 1, padding: 13, borderRadius: 8, border: "none", background: emailSubmitted ? "#111" : "#e5e7eb", fontSize: 15, fontWeight: 600, cursor: emailSubmitted ? "pointer" : "not-allowed", color: emailSubmitted ? "#fff" : "#9ca3af" }}>
              {emailSubmitted ? "Download PDF" : "Enter email to download"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: QUIZ ───────────────────────────────────────────
  // One question at a time, with the progress bar, answer buttons, and Next button
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f9fafb" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", margin: "0 0 4px" }}>Category {catIdx + 1} of {catKeys.length}</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{q.category}</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5 }}>{q.subtitle}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Question {currentQ + 1} of {questions.length}</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{Math.round(progress)}%</p>
          </div>
          <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#111", borderRadius: 3, transition: "width 0.3s ease" }} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#111", marginBottom: 20, lineHeight: 1.4 }}>{q.text}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {q.answers.map((answer: Answer, i: number) => (
              <button key={i} onClick={() => setSelected(i)} style={{ padding: "13px 16px", borderRadius: 8, border: selected === i ? "2px solid #111" : "1.5px solid #e5e7eb", background: selected === i ? "#f9fafb" : "#fff", textAlign: "left", fontSize: 14, cursor: "pointer", color: selected === i ? "#111" : "#374151", fontWeight: selected === i ? 500 : 400, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: selected === i ? "#111" : "#9ca3af", background: selected === i ? "#e5e7eb" : "#f3f4f6", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>{i + 1}</span>
                {answer.label}
              </button>
            ))}
          </div>
          <button onClick={handleNext} disabled={selected === null} style={{ width: "100%", padding: 13, borderRadius: 8, border: "none", background: selected === null ? "#e5e7eb" : "#111", color: selected === null ? "#9ca3af" : "#fff", fontSize: 15, fontWeight: 600, cursor: selected === null ? "not-allowed" : "pointer" }}>
            {isLast ? "See my results" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
