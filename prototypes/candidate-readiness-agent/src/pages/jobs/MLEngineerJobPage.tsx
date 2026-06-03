import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgentChatPanel, type IntentEntry } from "../../components/AgentChatPanel";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import {
  ConversationThread,
  type ActionChip,
  type ConversationMessage,
} from "../../components/ConversationThread";
import { FunnelViz } from "../../components/FunnelViz";
import { HiringStatusPill } from "../../components/HiringStatusPill";
import { HMPipelinePanel } from "../../components/HMPipelinePanel";
import { ReadinessChip } from "../../components/ReadinessChip";
import { ReadinessPopover } from "../../components/ReadinessPopover";
import { RecommendationBlock } from "../../components/RecommendationBlock";
import { SegmentTabs } from "../../components/SegmentTabs";
import {
  Row,
  Table,
  TableFooter,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
} from "../../components/Table";
import tableStyles from "../../components/Table.module.css";
import { CompareCandidatesModal } from "../../components/modals/CompareCandidatesModal";
import { RyanScreeningModal } from "../../components/modals/RyanScreeningModal";
import { ML_CANDIDATES } from "../../data/candidates";
import { JOBS_BY_SLUG } from "../../data/jobs";
import { READINESS_EVIDENCE } from "../../data/readinessEvidence";
import type { FitGrade, FunnelStage } from "../../data/types";
import { useDemoState } from "../../state/useDemoState";
import { Filter, Plus, Search } from "../../lib/icons";
import { JobDetailHeader } from "./JobDetailHeader";
import jobStyles from "./JobDetail.module.css";

const SEGMENTS = [
  { id: "all", label: "All Candidates", count: 5 },
  { id: "ready", label: "Ready", count: 1 },
  { id: "needs-review", label: "Needs Review", count: 2 },
  { id: "needs-recruiter", label: "Needs Recruiter Review", count: 1 },
  { id: "send-to-screening", label: "Send to Screening", count: 1 },
];

const job = JOBS_BY_SLUG["ml-engineer"]!;

const INITIAL_AGENT_MSG =
  "This ML role is under target for HM Interviews. Historically, this role needs 5 HM interviews to fill. You currently have 2. I found 2 candidates close to ready, but only 1 has complete evidence for immediate HM review.";

const FOLLOWUP_AGENT_MSG =
  "Routhu Vivek was moved to HM Interview. This role is now at 3 of 5 target HM interviews. Next best step: review Ryan Reynolds' screening depth before moving another candidate forward.";

const POST_FASTRACK_MSG =
  "Pipeline coverage is now 100%. The HM interview target is covered. Next best step: monitor HM feedback before forwarding more candidates.";

const INITIAL_ACTIONS: ActionChip[] = [
  { id: "compare", label: "Compare candidates", variant: "primary" },
  {
    id: "explain",
    label: "Explain recommendation",
    variant: "ghost",
    explain: {
      title: "Why this recommendation?",
      items: [
        {
          label: "Pipeline health",
          text: "ML Engineer is at 2 of 5 HM interviews. Historical fill rate requires 5 HM interviews; at 2 the role is at risk.",
        },
        {
          label: "Candidate Readiness",
          text: "1 candidate (Routhu Vivek) has complete evidence and is ready for HM submission. 1 candidate (Ryan Reynolds) has strong profile fit but insufficient screening depth.",
        },
        {
          label: "Screening evidence",
          text: "Routhu has full technical and behavioral screening. Ryan's screening was shallow — technical depth is unconfirmed.",
        },
      ],
      recommendation:
        "Move Routhu Vivek to HM Interview. Hold Ryan Reynolds until screening evidence is strengthened.",
    },
  },
  { id: "not-now", label: "Not now", variant: "ghost" },
];

const FOLLOWUP_ACTIONS: ActionChip[] = [
  { id: "review-ryan", label: "Review Ryan's screening evidence", variant: "primary" },
  { id: "send-lalitha", label: "Send Lalitha to screening", variant: "secondary" },
  { id: "return-jobs", label: "Return to jobs", variant: "ghost" },
];

const ML_AGENT_CHIPS = [
  {
    label: "Why do we need more HM interview candidates?",
    response:
      "Historically, this role type needs 5 HM interviews to reach offer stage on time. This job currently has 2, so it is 3 candidates short of the target.",
  },
  {
    label: "Which candidates should I send to HM?",
    response:
      "Start with Routhu Vivek for immediate HM review: Fit A, 4.5/5 screening, and low risk. Benno Müller is the next comparison candidate because his screening is strong, but he has a minor ML skill gap. Do not send Ryan Reynolds yet; his profile is strong, but screening depth is weak. Lalitha Singari should be sent to screening before HM consideration.",
  },
  {
    label: "Show candidates with strong screening but weaker Fit Score",
    response:
      "Tair Malka has a 5/5 screening score but Fit C. This is a mismatch case. I recommend manual review rather than automatic HM submission.",
  },
  {
    label: "What happens if I only send two candidates?",
    response:
      "The HM pipeline would improve, but the role would still remain below the 5-interview target. The fill pace risk would not be fully addressed.",
  },
  {
    label: "Why not send this candidate?",
    response:
      "Ryan Reynolds has Fit A, but his screening score is 2/5 and responses did not show enough technical depth. Review evidence before HM submission.",
  },
  {
    label: "Optimize matching criteria",
    response:
      "The job mentions NLP, LLM, and AI Agents, but these are not fully represented in matching criteria. I can suggest an update, but recruiter approval is required.",
  },
  {
    label: "Reject all C candidates",
    response:
      "I can't reject candidates or recommend rejection based only on Fit Score. I can help you review lower-readiness candidates using Fit Score, screening evidence, and job context.",
  },
];

/**
 * Structured intent map for smarter free-text matching.
 * Higher priority entries are checked before lower ones when multiple match.
 */
const ML_INTENT_MAP: IntentEntry[] = [
  // ── Candidate-recommendation intent (highest priority) ──────────
  // Catches: "give me 3 candidates", "who should I send to HM", "fast track",
  //          "recommend for hiring manager", "add to HM round", "move forward", etc.
  {
    keywords: [
      "give me",
      "who should i send",
      "which candidates",
      "recommend candidates",
      "candidates to send",
      "candidates to add",
      "fast track",
      "fast-track",
      "move forward",
      "add to hm",
      "send to hm",
      "forward to hm",
      "add to interview",
      "hiring manager interview",
      "hm round",
      "hm interview",
      "who to send",
      "who can i send",
      "who should move",
      "who moves",
    ],
    response:
      "Start with Routhu Vivek for immediate HM review: Fit A, 4.5/5 screening, and low risk. Benno Müller is the next comparison candidate because his screening is strong, but he has a minor ML skill gap. Do not send Ryan Reynolds yet; his profile is strong, but screening depth is weak. Lalitha Singari should be sent to screening before HM consideration.\n\nThat gives you a safe path to close the 3-candidate gap without forwarding candidates only because of Fit Score.",
    priority: 10,
  },
  // ── Why do we need more / pipeline target ───────────────────────
  {
    keywords: [
      "why do we need more",
      "why more hm",
      "why target",
      "why 5",
      "need more candidates",
      "why is pipeline low",
      "pipeline target",
      "why not enough",
    ],
    response:
      "Historically, this role type needs 5 HM interviews to reach offer stage on time. This job currently has 2, so it is 3 candidates short of the target.",
    priority: 5,
  },
  // ── Why not Ryan ─────────────────────────────────────────────────
  {
    keywords: [
      "why not ryan",
      "why not send ryan",
      "ryan concern",
      "ryan reynolds",
      "ryan screening",
      "ryan issue",
    ],
    response:
      "Ryan Reynolds has Fit A, but his screening score is 2/5 and responses did not show enough technical depth. Review screening evidence before HM submission.",
    priority: 8,
  },
  // ── Reject / remove C candidates — guardrail ─────────────────────
  {
    keywords: [
      "reject all c",
      "reject c",
      "remove all c",
      "discard c candidates",
      "drop c candidates",
      "filter out c",
    ],
    response:
      "I can't reject candidates or recommend rejection based only on Fit Score. I can help you review lower-readiness candidates using Fit Score, screening evidence, and job context.",
    priority: 9,
  },
  // ── Optimize matching criteria ───────────────────────────────────
  {
    keywords: [
      "optimize matching",
      "matching criteria",
      "nlp llm",
      "ai agents",
      "update criteria",
      "job requirements",
      "criteria",
    ],
    response:
      "The job mentions NLP, LLM, and AI Agents, but these are not fully represented in matching criteria. I can suggest an update, but recruiter approval is required.",
    priority: 4,
  },
  // ── Only send two candidates ─────────────────────────────────────
  {
    keywords: ["only send two", "only 2", "just two", "two candidates", "send 2"],
    response:
      "The HM pipeline would improve, but the role would still remain below the 5-interview target. The fill pace risk would not be fully addressed.",
    priority: 3,
  },
  // ── Strong screening but weaker fit ─────────────────────────────
  {
    keywords: [
      "strong screening",
      "weaker fit",
      "high screening low fit",
      "tair",
      "malka",
      "fit c screening",
    ],
    response:
      "Tair Malka has a 5/5 screening score but Fit C. This is a mismatch case. I recommend manual review rather than automatic HM submission.",
    priority: 3,
  },
];

const FIT_GRADE_STYLE: Record<FitGrade, string> = {
  A: jobStyles.fitA,
  B: jobStyles.fitB,
  C: jobStyles.fitC,
  D: jobStyles.fitD,
};

export function MLEngineerJobPage() {
  const {
    applyOverride,
    advanceStep,
    setStep,
    state,
    getConversationPhase,
    setConversationPhase,
    getFunnelCount,
    setFunnelStage,
    pushToast,
    moveToHM,
    getAgentChat,
    pushAgentChat,
  } = useDemoState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("candidates");
  const [activeSegment, setActiveSegment] = useState("all");
  const [compareOpen, setCompareOpen] = useState(false);
  const [ryanOpen, setRyanOpen] = useState(false);

  useEffect(() => {
    advanceStep(2);
  }, [advanceStep]);

  const phase = getConversationPhase("ml-engineer");

  const messages: ConversationMessage[] = useMemo(() => {
    const msgs: ConversationMessage[] = [
      { role: "agent", text: INITIAL_AGENT_MSG },
    ];
    if (phase === "post-action") {
      msgs.push({ role: "recruiter", text: "Move selected to HM Interview" });
      msgs.push({ role: "agent", text: FOLLOWUP_AGENT_MSG });
    }
    if (phase === "post-action-2") {
      msgs.push({ role: "recruiter", text: "Fast-track recommended candidates" });
      msgs.push({ role: "agent", text: POST_FASTRACK_MSG });
    }
    return msgs;
  }, [phase]);

  const actions =
    phase === "post-action-2"
      ? []
      : phase === "post-action"
        ? FOLLOWUP_ACTIONS
        : INITIAL_ACTIONS;

  const candidates = useMemo(
    () => ML_CANDIDATES.map(applyOverride),
    [applyOverride],
  );

  const visibleCandidates = useMemo(() => {
    switch (activeSegment) {
      case "ready":
        return candidates.filter((c) => c.readiness === "ready-for-hm");
      case "needs-review":
        return candidates.filter((c) => c.readiness === "needs-review");
      case "needs-recruiter":
        return candidates.filter((c) => c.readiness === "needs-recruiter-review");
      case "send-to-screening":
        return candidates.filter((c) => c.readiness === "send-to-screening");
      default:
        return candidates;
    }
  }, [candidates, activeSegment]);

  // Derive funnel from state overrides
  const funnelStages: FunnelStage[] = useMemo(() => {
    const hmCount = getFunnelCount("ml-engineer", "hm-interview", 2);
    return job.funnel.map((s) =>
      s.id === "hm-interview" || s.id === "sent-hm" || s.id === "ready-hm"
        ? { ...s, count: s.id === "hm-interview" ? hmCount : s.id === "sent-hm" ? hmCount : Math.max(s.count, hmCount) }
        : s,
    );
  }, [getFunnelCount]);

  // Pipeline metrics derived from state
  const pipelineMetrics = useMemo(() => {
    const hmCount = getFunnelCount("ml-engineer", "hm-interview", 2);
    const target = job.pipeline.target;
    const gap = target - hmCount;
    const pct = Math.round((hmCount / target) * 100);
    return {
      ...job.pipeline,
      current: hmCount,
      gap,
      goalPct: pct,
      status: (gap <= 0 ? "healthy" : "at-risk") as "healthy" | "at-risk" | "overloaded",
    };
  }, [getFunnelCount]);

  function handleAction(id: string) {
    switch (id) {
      case "compare":
        setCompareOpen(true);
        break;
      case "review-ryan":
        setRyanOpen(true);
        break;
      case "send-lalitha":
        pushToast("Lalitha sent to screening queue.", "success");
        break;
      case "return-jobs":
        navigate("/jobs");
        break;
    }
  }

  function handleMoveToHM(ids: string[]) {
    moveToHM(ids);
    const newCount = 2 + ids.length;
    setFunnelStage("ml-engineer", "hm-interview", newCount);
    pushToast(`${ids.length} candidate${ids.length === 1 ? "" : "s"} moved to HM Interview.`, "success");
    setConversationPhase("ml-engineer", "post-action");
    advanceStep(4);
    setCompareOpen(false);
  }

  function notifyEvidenceViewed() {
    if (state.demoStep === 5) setStep(6);
  }

  const chatHistory = getAgentChat("ml-engineer");

  return (
    <div className={jobStyles.layout}>
      <JobDetailHeader
        job={job}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        summary={{ visits: 412, leads: 17, applicants: 64 }}
      />
      <div className={jobStyles.body}>
        {/* ── Left main column ── */}
        <div className={jobStyles.mainCol}>
          {activeTab !== "candidates" ? (
            <NonCandidateTab />
          ) : (
            <>
              <HMPipelinePanel metrics={pipelineMetrics} />

              <FunnelViz stages={funnelStages} />

              <RecommendationBlock copy={job.recommendation} />

              <ConversationThread
                messages={messages}
                actions={actions}
                onAction={handleAction}
              />

              <div className={jobStyles.tableHeader}>
                <div className={jobStyles.searchAndFilter}>
                  <span className={jobStyles.searchInput}>
                    <Search size={12} /> Search Candidates
                  </span>
                  <span className={jobStyles.filterBtn}>
                    <Filter size={12} /> Filter
                  </span>
                </div>
                <div className={jobStyles.headerActions}>
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={12} />}>
                    Add Candidates
                  </Button>
                </div>
              </div>

              <SegmentTabs
                tabs={SEGMENTS}
                activeId={activeSegment}
                onChange={setActiveSegment}
              />

              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <Th className={tableStyles.checkboxCell}>
                        <input type="checkbox" className={tableStyles.checkbox} aria-label="Select all" />
                      </Th>
                      <Th>Candidate</Th>
                      <Th>Fit Score</Th>
                      <Th>Screening Score</Th>
                      <Th>Evidence</Th>
                      <Th>Risk Flag</Th>
                      <Th>Candidate Readiness</Th>
                      <Th>Hiring Status</Th>
                      <Th>Recommended Action</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {visibleCandidates.map((c) => {
                      const evidence = READINESS_EVIDENCE[c.id];
                      const wasMoved = state.overrides[c.id]?.hiringStatus === "HM Interview";
                      const fitClass = c.fitScore ? FIT_GRADE_STYLE[c.fitScore] : "";
                      const scoreRaw = c.screeningScore;
                      const isLowScore = scoreRaw !== null && scoreRaw !== undefined && scoreRaw < 3;
                      return (
                        <Row key={c.id}>
                          <Td className={tableStyles.checkboxCell}>
                            <input type="checkbox" className={tableStyles.checkbox} aria-label={`Select ${c.name}`} />
                          </Td>
                          <Td>
                            <div className={tableStyles.nameCell}>
                              <Avatar name={c.name} size="md" />
                              <div className={tableStyles.nameText}>
                                <span className={tableStyles.nameTextPrimary}>{c.name}</span>
                                <span className={tableStyles.nameTextSecondary}>{c.role}</span>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            {c.fitScore ? (
                              <span className={`${jobStyles.fitScoreBadge} ${fitClass}`}>
                                {c.fitScore}
                              </span>
                            ) : (
                              <span className={jobStyles.screeningNA}>—</span>
                            )}
                          </Td>
                          <Td>
                            {scoreRaw === null || scoreRaw === undefined ? (
                              <span className={jobStyles.screeningNA}>Not completed</span>
                            ) : (
                              <div className={jobStyles.screeningScore}>
                                <span className={jobStyles.screeningScoreText}>{scoreRaw}/5</span>
                                <div className={jobStyles.screeningScoreBar}>
                                  <div
                                    className={`${jobStyles.screeningScoreFill} ${isLowScore ? jobStyles.screeningScoreLow : ""}`}
                                    style={{ width: `${(scoreRaw / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </Td>
                          <Td>
                            <span className={jobStyles.evidenceText}>{c.evidence ?? "—"}</span>
                          </Td>
                          <Td>
                            <RiskFlagCell flag={c.riskFlag ?? "—"} />
                          </Td>
                          <Td>
                            {evidence ? (
                              <ReadinessPopover
                                evidence={evidence}
                                trigger={
                                  <ReadinessChip
                                    status={c.readiness}
                                    onMouseEnter={notifyEvidenceViewed}
                                    onClick={notifyEvidenceViewed}
                                  />
                                }
                              />
                            ) : (
                              <ReadinessChip status={c.readiness} staticChip />
                            )}
                          </Td>
                          <Td>
                            <HiringStatusPill status={c.hiringStatus} changed={wasMoved} />
                          </Td>
                          <Td>
                            <span className={jobStyles.recommendedAction}>{c.recommendedAction}</span>
                          </Td>
                        </Row>
                      );
                    })}
                  </TBody>
                </Table>
                <TableFooter>
                  <span>Showing 1 - {visibleCandidates.length} of {visibleCandidates.length}</span>
                  <span>5 ready in queue · 1 fast-track recommendation</span>
                </TableFooter>
              </TableWrap>
            </>
          )}
        </div>

        {/* ── Right agent panel ── */}
        <div className={jobStyles.sideCol}>
          <AgentChatPanel
            jobId="ml-engineer"
            observation={`HM interview pipeline is at ${pipelineMetrics.current} of ${pipelineMetrics.target} target. ${pipelineMetrics.gap > 0 ? `${pipelineMetrics.gap} more candidates needed.` : "Target reached."}`}
            promptChips={ML_AGENT_CHIPS}
            intentMap={ML_INTENT_MAP}
            history={chatHistory}
            onAddEntries={(entries) => pushAgentChat("ml-engineer", entries)}
          />
        </div>
      </div>

      <CompareCandidatesModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        onMoveToHM={handleMoveToHM}
      />
      <RyanScreeningModal open={ryanOpen} onOpenChange={setRyanOpen} />
    </div>
  );
}

function RiskFlagCell({ flag }: { flag: string }) {
  if (flag === "None") return <span className={jobStyles.riskNone}>None</span>;
  const isHigh =
    flag.toLowerCase().includes("concern") ||
    flag.toLowerCase().includes("mismatch");
  return (
    <span className={isHigh ? jobStyles.riskHigh : jobStyles.riskMedium}>
      {flag}
    </span>
  );
}

function NonCandidateTab() {
  return (
    <div className={jobStyles.emptyState}>
      <div className={jobStyles.emptyTitle}>No demo content configured for this tab</div>
      <div className={jobStyles.emptySubtitle}>
        Return to the Candidates tab to continue the demo.
      </div>
    </div>
  );
}
