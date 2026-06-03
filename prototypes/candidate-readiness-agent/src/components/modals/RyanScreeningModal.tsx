import { useState } from "react";
import { Sparkles } from "../../lib/icons";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { cn } from "../../lib/cn";
import styles from "./RyanScreeningModal.module.css";

interface RyanScreeningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EvalChoice = "yes" | "maybe" | "no";

const QUESTIONS = [
  {
    q: "Describe a machine learning model you built and how you evaluated performance.",
    a: "Ryan described coursework and a small classification project, but could not clearly explain evaluation tradeoffs beyond accuracy.",
    rating: 2,
  },
  {
    q: "How have you used Python in production or on a team project?",
    a: "Ryan mentioned Python scripting and notebooks, but did not provide strong evidence of production deployment or collaboration.",
    rating: 2,
  },
  {
    q: "Explain how you would approach an NLP model for matching candidates to jobs.",
    a: "Ryan gave a high-level answer about embeddings, but did not explain model validation, bias checks, or operational monitoring.",
    rating: 2,
  },
];

const TRANSCRIPT = [
  {
    role: "agent" as const,
    name: "Sarah / AI Agent",
    text: "Thanks for joining, Ryan. Let's start: can you describe a machine learning model you built and how you evaluated its performance?",
  },
  {
    role: "candidate" as const,
    name: "Ryan Reynolds",
    text: "Sure, in my coursework I built a classification model to predict customer churn. I evaluated it mainly with accuracy.",
    weak: true,
  },
  {
    role: "agent" as const,
    name: "Sarah / AI Agent",
    text: "Got it. How have you used Python in a production environment or on a team project?",
  },
  {
    role: "candidate" as const,
    name: "Ryan Reynolds",
    text: "I use Python a lot — mostly notebooks for analysis and some scripting. I haven't deployed anything to production officially.",
    weak: true,
  },
  {
    role: "agent" as const,
    name: "Sarah / AI Agent",
    text: "Understood. Last one: how would you approach building an NLP model for matching candidates to job descriptions?",
  },
  {
    role: "candidate" as const,
    name: "Ryan Reynolds",
    text: "I'd use embeddings to represent both candidates and jobs and compute similarity. Something like sentence transformers.",
    weak: true,
  },
  {
    role: "agent" as const,
    name: "Sarah / AI Agent",
    text: "Thanks, Ryan. We'll follow up on next steps shortly.",
  },
];

function StarRating({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "lg" }) {
  const starClass = size === "lg" ? styles.evalStar : styles.star;
  const filledClass = size === "lg" ? styles.evalStarFilled : styles.starFilled;
  const emptyClass = size === "lg" ? styles.evalStarEmpty : styles.starEmpty;
  const containerClass = size === "lg" ? styles.evalStars : styles.stars;
  return (
    <div className={containerClass}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={cn(starClass, i < rating ? filledClass : emptyClass)} />
      ))}
    </div>
  );
}

export function RyanScreeningModal({ open, onOpenChange }: RyanScreeningModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary");
  const [evalChoice, setEvalChoice] = useState<EvalChoice>("maybe");

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ryan Reynolds — Screening Review"
      subtitle="Candidate Readiness: Needs Review · ML Engineer"
      size="xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Keep in review
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Add recruiter note
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </>
      }
    >
      <div className={styles.innerLayout}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {/* Meta bar */}
          <div className={styles.metaBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Screening completed</span>
              <span className={styles.metaValue}>May 21, 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Recommended rating</span>
              <span className={cn(styles.metaValue, styles.metaValueWarn)}>2.0 / 5</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Average rating</span>
              <span className={cn(styles.metaValue, styles.metaValueWarn)}>2.0 / 5</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Questions answered</span>
              <span className={styles.metaValue}>3 of 3</span>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={cn(styles.tab, activeTab === "summary" && styles.tabActive)}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              type="button"
              className={cn(styles.tab, activeTab === "transcript" && styles.tabActive)}
              onClick={() => setActiveTab("transcript")}
            >
              Transcript
            </button>
          </div>

          {/* Tab content */}
          <div className={styles.tabContent}>
            {activeTab === "summary" ? (
              QUESTIONS.map((q, i) => (
                <div key={i} className={styles.questionBlock}>
                  <p className={styles.questionText}>
                    <strong>Q{i + 1}:</strong> {q.q}
                  </p>
                  <div className={styles.answerLabel}>Candidate summary</div>
                  <p className={styles.answerText}>{q.a}</p>
                  <div className={styles.ratingRow}>
                    <span className={styles.ratingLabel}>Rating:</span>
                    <StarRating rating={q.rating} />
                    <span className={styles.ratingNum}>{q.rating}/5</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.transcript}>
                {TRANSCRIPT.map((turn, i) => (
                  <div key={i} className={styles.transcriptTurn}>
                    <div
                      className={cn(
                        styles.turnAvatar,
                        turn.role === "agent"
                          ? styles.avatarAgent
                          : styles.avatarCandidate,
                      )}
                    >
                      {turn.role === "agent" ? "AI" : "RR"}
                    </div>
                    <div className={styles.turnBody}>
                      <div className={styles.turnName}>{turn.name}</div>
                      <div
                        className={cn(
                          styles.turnBubble,
                          turn.role === "agent"
                            ? styles.bubbleAgent
                            : styles.bubbleCandidate,
                        )}
                      >
                        {turn.role === "candidate" && "weak" in turn && turn.weak ? (
                          <span className={styles.weakHighlight}>{turn.text}</span>
                        ) : (
                          turn.text
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className={styles.rightCol}>
          <div className={styles.evalSection}>
            <div className={styles.evalSectionTitle}>Evaluation</div>

            <div className={styles.evalRow}>
              <span className={styles.evalRowLabel}>Recommended rating</span>
              <span className={styles.evalRowValue}>2.0 / 5</span>
              <StarRating rating={2} size="lg" />
            </div>

            <div className={styles.evalRow}>
              <span className={styles.evalRowLabel}>Average rating</span>
              <span className={styles.evalRowValue}>2.0 / 5</span>
              <StarRating rating={2} size="lg" />
            </div>

            <div className={styles.evalRow} style={{ marginBottom: 0 }}>
              <span className={styles.evalRowLabel}>Overall evaluation</span>
              <div className={styles.evalToggles}>
                <button
                  type="button"
                  className={cn(
                    styles.evalToggle,
                    styles.evalToggleYes,
                    evalChoice === "yes" && styles.evalToggleActive,
                  )}
                  onClick={() => setEvalChoice("yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={cn(
                    styles.evalToggle,
                    styles.evalToggleMaybe,
                    evalChoice === "maybe" && styles.evalToggleActive,
                  )}
                  onClick={() => setEvalChoice("maybe")}
                >
                  Maybe
                </button>
                <button
                  type="button"
                  className={cn(
                    styles.evalToggle,
                    styles.evalToggleNo,
                    evalChoice === "no" && styles.evalToggleActive,
                  )}
                  onClick={() => setEvalChoice("no")}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className={styles.agentAssessment}>
            <div className={styles.agentAssessmentTitle}>
              <Sparkles size={12} /> Agent assessment
            </div>
            <p className={styles.agentAssessmentText}>
              Ryan has Fit A based on profile evidence, but screening responses did not show
              enough technical depth. Recommendation: review manually before HM submission.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
