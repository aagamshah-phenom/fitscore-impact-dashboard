import { useRef, useState } from "react";
import type { AgentChatEntry } from "../data/types";
import { Sparkles } from "../lib/icons";
import styles from "./AgentChatPanel.module.css";

export interface PromptChip {
  label: string;
  response: string;
}

/** A structured intent entry with keyword arrays for smarter matching */
export interface IntentEntry {
  /** All keywords / phrases; at least one must appear in normalized input */
  keywords: string[];
  /** Returned response when this intent fires */
  response: string;
  /**
   * Priority — higher fires first when multiple intents match.
   * Default: 0
   */
  priority?: number;
}

interface AgentChatPanelProps {
  jobId: string;
  observation: string;
  promptChips: PromptChip[];
  /**
   * Optional structured intent map for smarter free-text matching.
   * Checked before chip label matching.
   */
  intentMap?: IntentEntry[];
  /** Externally managed chat history (from DemoState) */
  history: AgentChatEntry[];
  onAddEntries: (entries: AgentChatEntry[]) => void;
}

const FALLBACK_RESPONSE =
  "I can help with screening-to-HM interview readiness. Try asking which candidates to send to HM, why the role needs more HM-ready candidates, or why a candidate needs review.";

/** How many chips to show before "more" toggle */
const INITIAL_CHIP_COUNT = 4;

/** Normalize: lowercase + strip all punctuation */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchResponse(
  input: string,
  chips: PromptChip[],
  intentMap?: IntentEntry[],
): string {
  const norm = normalize(input);

  // 1. Check structured intent map first (highest priority)
  if (intentMap && intentMap.length > 0) {
    const matched = intentMap
      .filter((entry) =>
        entry.keywords.some((kw) => norm.includes(normalize(kw))),
      )
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    if (matched.length > 0 && matched[0]) return matched[0].response;
  }

  // 2. Exact chip label match
  const exact = chips.find((c) => normalize(c.label) === norm);
  if (exact) return exact.response;

  // 3. Chip keyword overlap (score by unique word hits, ignore stop-words)
  const STOP = new Set([
    "the", "a", "an", "for", "to", "and", "or", "of", "in", "is",
    "do", "does", "have", "what", "why", "how", "who", "me", "you",
    "i", "we", "with", "all", "not",
  ]);
  const inputWords = norm.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

  const scored = chips
    .map((c) => {
      const chipNorm = normalize(c.label);
      const hits = inputWords.filter((w) => chipNorm.includes(w)).length;
      return { c, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length > 0 && scored[0]) return scored[0].c.response;
  return FALLBACK_RESPONSE;
}

export function AgentChatPanel({
  observation,
  promptChips,
  intentMap,
  history,
  onAddEntries,
}: AgentChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const hasMessages = history.length > 0;
  const hasMoreChips = promptChips.length > INITIAL_CHIP_COUNT;
  const visibleChips = showAllChips
    ? promptChips
    : promptChips.slice(0, INITIAL_CHIP_COUNT);
  const hiddenCount = promptChips.length - INITIAL_CHIP_COUNT;

  function scrollToBottom() {
    setTimeout(() => {
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    }, 50);
  }

  function handleChipClick(chip: PromptChip) {
    onAddEntries([
      { role: "user", text: chip.label },
      { role: "agent", text: chip.response },
    ]);
    scrollToBottom();
  }

  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    const response = matchResponse(text, promptChips, intentMap);
    onAddEntries([
      { role: "user", text },
      { role: "agent", text: response },
    ]);
    setInputValue("");
    scrollToBottom();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className={styles.panel}>
      {/* ── A. Header ── */}
      <div className={styles.header}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Sparkles size={12} />
        </div>
        <span className={styles.headerTitle}>Candidate Readiness Agent</span>
      </div>

      {/* Observation */}
      <div className={styles.observation}>
        <p className={styles.observationText}>{observation}</p>
      </div>

      {/* ── B. Prompt chips ── */}
      <div className={styles.chips}>
        <span className={styles.chipsLabel}>Ask the agent</span>
        <div className={styles.chipsInner}>
          {visibleChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={styles.chip}
              onClick={() => handleChipClick(chip)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {hasMoreChips && (
          <button
            type="button"
            className={styles.chipsMore}
            onClick={() => setShowAllChips((v) => !v)}
          >
            {showAllChips ? "Show less" : `+${hiddenCount} more prompts`}
          </button>
        )}
      </div>

      {/* ── C. Conversation thread ── */}
      <div
        className={`${styles.thread}${hasMessages ? ` ${styles.threadFilled}` : ""}`}
        ref={threadRef}
      >
        {hasMessages ? (
          history.map((entry, i) => (
            <div key={i} className={styles.msg}>
              <span
                className={`${styles.msgRole} ${entry.role === "agent" ? styles.msgRoleAgent : styles.msgRoleUser}`}
              >
                {entry.role === "agent" ? "Agent" : "You"}
              </span>
              <span
                className={`${styles.msgBubble} ${entry.role === "agent" ? styles.msgBubbleAgent : styles.msgBubbleUser}`}
              >
                {entry.text}
              </span>
            </div>
          ))
        ) : (
          <span className={styles.threadEmptyText}>
            Select a prompt above or type a question below.
          </span>
        )}
      </div>

      {/* ── D. Input row ── */}
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder="Ask about candidates, pipeline, or screening…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className={styles.sendBtn} onClick={handleSend}>
          Send
        </button>
      </div>

      {/* ── E. Agent Guardrails (collapsible) ── */}
      <div className={styles.guardrails}>
        <button
          type="button"
          className={styles.guardrailsToggle}
          onClick={() => setGuardrailsOpen((v) => !v)}
          aria-expanded={guardrailsOpen}
        >
          <span className={styles.guardrailsTitle}>Agent Guardrails</span>
          <span className={styles.guardrailsChevron} aria-hidden="true">
            {guardrailsOpen ? "▲" : "▼"}
          </span>
        </button>
        {guardrailsOpen && (
          <ul className={styles.guardrailsList}>
            <li className={styles.guardrailsItem}>No auto-hire or auto-reject decisions</li>
            <li className={styles.guardrailsItem}>No action based only on Fit Score</li>
            <li className={styles.guardrailsItem}>
              Requires recruiter confirmation before workflow actions
            </li>
            <li className={styles.guardrailsItem}>
              Uses Fit Score, screening evidence, and pipeline context
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
