import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AgentChatPanel } from "../../components/AgentChatPanel";
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
import { PrioritizeQueueModal } from "../../components/modals/PrioritizeQueueModal";
import {
  CUSTOMER_SERVICE_CANDIDATES,
  CUSTOMER_SERVICE_SEGMENT_COUNTS,
} from "../../data/candidates";
import { JOBS_BY_SLUG } from "../../data/jobs";
import { READINESS_EVIDENCE } from "../../data/readinessEvidence";
import { SCREENING_LABEL } from "../../data/types";
import type { FunnelStage } from "../../data/types";
import { useDemoState } from "../../state/useDemoState";
import { Filter, Plus, Search } from "../../lib/icons";
import { JobDetailHeader } from "./JobDetailHeader";
import jobStyles from "./JobDetail.module.css";

const SEGMENTS = [
  { id: "all", label: "All Candidates", count: CUSTOMER_SERVICE_SEGMENT_COUNTS.all },
  { id: "ready", label: "Ready for Screening", count: CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening },
  { id: "needs-review", label: "Needs Review", count: CUSTOMER_SERVICE_SEGMENT_COUNTS.needsReview },
  { id: "low-priority", label: "Low Priority", count: CUSTOMER_SERVICE_SEGMENT_COUNTS.lowPriority },
  { id: "new-applicants", label: "New Applicants", count: CUSTOMER_SERVICE_SEGMENT_COUNTS.newApplicants },
];

const job = JOBS_BY_SLUG["customer-service-outfitter"]!;

const INITIAL_AGENT_MSG =
  "This high-volume role has 186 new applicants. I grouped the queue by Candidate Readiness so you do not need to review every profile manually.";

const FOLLOWUP_AGENT_MSG =
  "31 candidates are ready for screening. The remaining queue is split into 18 needing review, 42 low-priority candidates, and 12 with incomplete evidence. Next best step: review the 18 candidates needing recruiter judgment.";

const INITIAL_ACTIONS: ActionChip[] = [
  { id: "prioritize", label: "Prioritize queue", variant: "primary" },
  { id: "review-top", label: "Review top candidates", variant: "secondary" },
  { id: "show-low", label: "Show low-priority group", variant: "ghost" },
  {
    id: "explain",
    label: "Explain grouping",
    variant: "ghost",
    explain: {
      title: "How did we group these candidates?",
      items: [
        {
          label: "Profile fit",
          text: "Each applicant's profile was compared to the job requirements. Skills, experience, and role-specific attributes were scored.",
        },
        {
          label: "Screening evidence",
          text: "Candidates who completed screening were evaluated on response quality and depth. Incomplete screening was flagged as a gap.",
        },
        {
          label: "Readiness signal",
          text: "Combining profile fit and screening results produces the Candidate Readiness signal: Ready for Screening, Needs Review, or Low Priority.",
        },
      ],
      recommendation:
        "Start with the Ready for Screening group. Skip manual review for Low Priority candidates at this stage.",
    },
  },
];

const FOLLOWUP_ACTIONS: ActionChip[] = [
  { id: "review-needs-review", label: "Review needs-review group", variant: "primary" },
  { id: "show-low", label: "Show low-priority group", variant: "ghost" },
  { id: "return-jobs", label: "Return to jobs", variant: "ghost" },
];

const CS_AGENT_CHIPS = [
  {
    label: "Why do we need more HM interview candidates?",
    response:
      "The Customer Service Outfitter role has a target of 12 HM interviews but only 4 currently. Screening throughput is the bottleneck — 31 ready candidates haven't been actioned yet.",
  },
  {
    label: "Which candidates should I prioritize for screening?",
    response:
      "The 31 candidates in the Ready for Screening group have the strongest profile fit. Send them to screening as a batch before triaging the 18 that need review.",
  },
  {
    label: "What is the bottleneck in this pipeline?",
    response:
      "The bottleneck is the screening stage. You have 186 screened applicants but only 31 have been cleared for next steps. Sending the ready group unblocks the HM interview pipeline.",
  },
  {
    label: "What happens if I only send two candidates?",
    response:
      "Sending only 2 candidates would have minimal impact on the HM pipeline. You need 8 more HM-ready candidates to reach target. Bulk action on the ready group is the highest-leverage move.",
  },
];

export function CustomerServiceJobPage() {
  const {
    applyOverride,
    advanceStep,
    prioritizeQueue,
    pushToast,
    getFunnelCount,
    setFunnelStage,
    getConversationPhase,
    setConversationPhase,
    getAgentChat,
    pushAgentChat,
  } = useDemoState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("candidates");
  const [activeSegment, setActiveSegment] = useState("all");
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);

  useEffect(() => {
    // Opening CS page → Demo Guide step 5
    advanceStep(5);
  }, [advanceStep]);

  const phase = getConversationPhase("customer-service");

  const messages: ConversationMessage[] = useMemo(() => {
    const msgs: ConversationMessage[] = [
      { role: "agent", text: INITIAL_AGENT_MSG },
    ];
    if (phase === "post-action") {
      msgs.push({ role: "recruiter", text: "Send Ready for Screening group" });
      msgs.push({ role: "agent", text: FOLLOWUP_AGENT_MSG });
    }
    return msgs;
  }, [phase]);

  const actions = phase === "post-action" ? FOLLOWUP_ACTIONS : INITIAL_ACTIONS;

  const candidates = useMemo(
    () => CUSTOMER_SERVICE_CANDIDATES.map(applyOverride),
    [applyOverride],
  );

  const visibleCandidates = useMemo(() => {
    switch (activeSegment) {
      case "ready":
        return candidates.filter(
          (c) => c.readiness === "send-to-screening" || c.readiness === "ready-for-hm",
        );
      case "needs-review":
        return candidates.filter((c) => c.readiness === "needs-review");
      case "low-priority":
        return candidates.filter((c) => c.readiness === "low-priority");
      case "new-applicants":
        return candidates;
      default:
        return candidates;
    }
  }, [candidates, activeSegment]);

  // Derive funnel — "sent-screening" count updates after action
  const funnelStages: FunnelStage[] = useMemo(() => {
    const sentCount = getFunnelCount("customer-service", "sent-screening", 0);
    return job.funnel.map((s) =>
      s.id === "sent-screening" ? { ...s, count: sentCount } : s,
    );
  }, [getFunnelCount]);

  const pipelineMetrics = useMemo(() => ({
    ...job.pipeline,
  }), []);

  function handleAction(id: string) {
    switch (id) {
      case "prioritize":
        setPrioritizeOpen(true);
        break;
      case "review-top":
      case "review-needs-review":
        setActiveSegment("needs-review");
        break;
      case "show-low":
        setActiveSegment("low-priority");
        break;
      case "return-jobs":
        navigate("/jobs");
        break;
    }
  }

  function handleSend() {
    prioritizeQueue(job.id);
    setFunnelStage("customer-service", "sent-screening", CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening);
    pushToast(
      `${CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening} candidates prepared for screening.`,
      "success",
    );
    setConversationPhase("customer-service", "post-action");
    // Sending the ready-for-screening group → Demo Guide step 6
    advanceStep(6);
    setPrioritizeOpen(false);
  }

  const totalShown = visibleCandidates.length;
  const totalCount = activeSegment === "all" ? CUSTOMER_SERVICE_SEGMENT_COUNTS.all : totalShown;
  const chatHistory = getAgentChat("customer-service");

  return (
    <div className={jobStyles.layout}>
      <JobDetailHeader
        job={job}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        summary={{ visits: 4820, leads: 312, applicants: 632 }}
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
                showOverflow
              />

              <TableWrap>
                <Table>
                  <THead>
                    <tr>
                      <Th className={tableStyles.checkboxCell}>
                        <input type="checkbox" className={tableStyles.checkbox} aria-label="Select all" />
                      </Th>
                      <Th>Name</Th>
                      <Th>Hiring Status</Th>
                      <Th>Candidate Readiness</Th>
                      <Th>Screening Status</Th>
                      <Th>Recommended Action</Th>
                      <Th>Created Date</Th>
                      <Th>Profile Source</Th>
                      <Th>Lead Source</Th>
                      <Th>Location</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {visibleCandidates.map((c) => {
                      const evidence = READINESS_EVIDENCE[c.id];
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
                          <Td><HiringStatusPill status={c.hiringStatus} /></Td>
                          <Td>
                            {evidence ? (
                              <ReadinessPopover
                                evidence={evidence}
                                trigger={<ReadinessChip status={c.readiness} />}
                              />
                            ) : (
                              <ReadinessChip status={c.readiness} staticChip />
                            )}
                          </Td>
                          <Td>{c.screening ? SCREENING_LABEL[c.screening] : "—"}</Td>
                          <Td>
                            <span className={jobStyles.recommendedAction}>{c.recommendedAction}</span>
                          </Td>
                          <Td>{c.createdDate}</Td>
                          <Td>{c.profileSource}</Td>
                          <Td>{c.leadSource}</Td>
                          <Td>{c.location}</Td>
                        </Row>
                      );
                    })}
                  </TBody>
                </Table>
                <TableFooter>
                  <span>
                    Showing {totalShown > 0 ? 1 : 0} - {totalShown} of {totalCount}
                    {activeSegment === "all" ? " (sample shown)" : ""}
                  </span>
                  <span>
                    {CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening} ready for screening · {CUSTOMER_SERVICE_SEGMENT_COUNTS.needsReview} need review
                  </span>
                </TableFooter>
              </TableWrap>
            </>
          )}
        </div>

        {/* ── Right agent panel ── */}
        <div className={jobStyles.sideCol}>
          <AgentChatPanel
            jobId="customer-service"
            observation={`HM interview pipeline: ${job.pipeline.current} of ${job.pipeline.target} target. Screening bottleneck: 31 ready candidates not yet actioned.`}
            promptChips={CS_AGENT_CHIPS}
            history={chatHistory}
            onAddEntries={(entries) => pushAgentChat("customer-service", entries)}
          />
        </div>
      </div>

      <PrioritizeQueueModal
        open={prioritizeOpen}
        onOpenChange={setPrioritizeOpen}
        jobId={job.id}
        onSend={handleSend}
      />
    </div>
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
