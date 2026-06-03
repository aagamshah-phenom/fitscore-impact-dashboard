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
import { KeepWarmModal } from "../../components/modals/KeepWarmModal";
import { RedirectCandidateModal } from "../../components/modals/RedirectCandidateModal";
import { STORE_OPS_CANDIDATES } from "../../data/candidates";
import { JOBS_BY_SLUG } from "../../data/jobs";
import { READINESS_EVIDENCE } from "../../data/readinessEvidence";
import { useDemoState } from "../../state/useDemoState";
import { Filter, Plus, Search } from "../../lib/icons";
import { JobDetailHeader } from "./JobDetailHeader";
import jobStyles from "./JobDetail.module.css";

const job = JOBS_BY_SLUG["store-operations-manager"]!;

const REDIRECT_TARGET = {
  title: "District Operations Manager — King of Prussia District",
  meta: "Open · 3 HM interviews scheduled · Pipeline capacity available",
};

const INITIAL_AGENT_MSG =
  "This job already has 10 candidates with the hiring manager. Historically, this role needs 6 HM interviews. I do not recommend forwarding more candidates right now.";

const FOLLOWUP_AGENT_MSG =
  "Warm update sent to Olivia Carter and Marcus Lee. Since the HM pipeline is full, the next best step is to wait for HM feedback or redirect strong candidates to similar roles with capacity.";

const FOLLOWUP2_AGENT_MSG =
  "Marcus Lee was suggested for District Operations Manager — King of Prussia District because that role has available HM capacity.";

const INITIAL_ACTIONS: ActionChip[] = [
  { id: "keep-warm", label: "Keep candidates warm", variant: "primary" },
  { id: "redirect", label: "Redirect strong candidates", variant: "secondary" },
  { id: "review-backlog", label: "Review backlog", variant: "ghost" },
  {
    id: "explain-no-forward",
    label: "Explain why not forward",
    variant: "ghost",
    explain: {
      title: "Why not forward more candidates?",
      items: [
        {
          label: "Pipeline capacity",
          text: "There are already 10 candidates in the HM queue for this role. Historically, this role fills from 6 HM interviews — the pipeline is above target.",
        },
        {
          label: "HM bandwidth",
          text: "Forwarding more candidates now risks overwhelming the hiring manager and slowing down feedback on candidates already in review.",
        },
        {
          label: "Better alternatives",
          text: "Strong candidates not yet forwarded can be kept warm or redirected to similar open roles with available HM capacity.",
        },
      ],
      recommendation:
        "Hold on forwarding. Send warm updates to keep engaged candidates interested, and redirect top matches to roles with available HM bandwidth.",
    },
  },
];

const FOLLOWUP_ACTIONS: ActionChip[] = [
  { id: "redirect-marcus", label: "Redirect Marcus Lee", variant: "primary" },
  { id: "return-jobs", label: "Return to jobs", variant: "ghost" },
  { id: "reset-demo", label: "Reset demo", variant: "ghost" },
];

const FOLLOWUP2_ACTIONS: ActionChip[] = [
  { id: "return-jobs", label: "Return to jobs", variant: "secondary" },
  { id: "reset-demo", label: "Reset demo", variant: "ghost" },
];

const STOREOPS_AGENT_CHIPS = [
  {
    label: "Why not forward more candidates?",
    response:
      "The HM pipeline already has 10 candidates, 4 over the target of 6. Forwarding more increases congestion and slows HM feedback time. Keep warm or redirect instead.",
  },
  {
    label: "Which candidates should I keep warm?",
    response:
      "Olivia Carter and Marcus Lee are strong candidates who are not yet in the HM queue. Sending them a warm update keeps them engaged without adding to pipeline congestion.",
  },
  {
    label: "Are there similar open roles for these candidates?",
    response:
      "Yes. Marcus Lee is a strong match for District Operations Manager — King of Prussia District, which currently has available HM interview capacity.",
  },
  {
    label: "When should I forward more candidates?",
    response:
      "Wait for HM feedback on the current 10 candidates. Once the HM interview backlog clears and the count drops below 6, it will be appropriate to forward additional candidates.",
  },
];

export function StoreOpsJobPage() {
  const {
    applyOverride,
    advanceStep,
    state,
    sendKeepWarmUpdate,
    redirectCandidate,
    pushToast,
    getConversationPhase,
    setConversationPhase,
    getAgentChat,
    pushAgentChat,
    resetDemo,
  } = useDemoState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("candidates");
  const [keepWarmOpen, setKeepWarmOpen] = useState(false);
  const [redirectFor, setRedirectFor] = useState<string | null>(null);

  useEffect(() => {
    advanceStep(5);
  }, [advanceStep]);

  const phase = getConversationPhase("store-ops");

  const messages: ConversationMessage[] = useMemo(() => {
    const msgs: ConversationMessage[] = [
      { role: "agent", text: INITIAL_AGENT_MSG },
    ];
    if (phase === "post-action" || phase === "post-action-2") {
      msgs.push({ role: "recruiter", text: "Send update" });
      msgs.push({ role: "agent", text: FOLLOWUP_AGENT_MSG });
    }
    if (phase === "post-action-2") {
      msgs.push({ role: "recruiter", text: "Suggest similar role for Marcus Lee" });
      msgs.push({ role: "agent", text: FOLLOWUP2_AGENT_MSG });
    }
    return msgs;
  }, [phase]);

  const actions =
    phase === "post-action-2"
      ? FOLLOWUP2_ACTIONS
      : phase === "post-action"
        ? FOLLOWUP_ACTIONS
        : INITIAL_ACTIONS;

  const candidates = useMemo(
    () => STORE_OPS_CANDIDATES.map(applyOverride),
    [applyOverride],
  );

  function handleAction(id: string) {
    switch (id) {
      case "keep-warm":
        setKeepWarmOpen(true);
        break;
      case "redirect":
      case "redirect-marcus":
        setRedirectFor("marcus-lee");
        break;
      case "return-jobs":
        navigate("/jobs");
        break;
      case "reset-demo":
        resetDemo();
        navigate("/jobs");
        break;
    }
  }

  function handleSendWarm() {
    sendKeepWarmUpdate(["olivia-carter", "marcus-lee"]);
    pushToast("Update sent to candidates.", "success");
    setConversationPhase("store-ops", "post-action");
    setKeepWarmOpen(false);
  }

  function handleRedirectSuggest() {
    if (!redirectFor) return;
    redirectCandidate(redirectFor);
    const candidate = candidates.find((c) => c.id === redirectFor);
    pushToast(
      `Redirect suggestion saved for ${candidate?.name ?? redirectFor}.`,
      "success",
    );
    setConversationPhase("store-ops", "post-action-2");
    setRedirectFor(null);
  }

  const redirectCandidateObj = redirectFor
    ? candidates.find((c) => c.id === redirectFor)
    : null;

  const chatHistory = getAgentChat("store-ops");

  return (
    <div className={jobStyles.layout}>
      <JobDetailHeader
        job={job}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        summary={{ visits: 1820, leads: 86, applicants: 142 }}
      />
      <div className={jobStyles.body}>
        {/* ── Left main column ── */}
        <div className={jobStyles.mainCol}>
          {activeTab !== "candidates" ? (
            <NonCandidateTab />
          ) : (
            <>
              <HMPipelinePanel metrics={job.pipeline} />

              <FunnelViz stages={job.funnel} />

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
                      <Th>Recommended Action</Th>
                      <Th>Reason</Th>
                      <Th>Created Date</Th>
                      <Th>Location</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {candidates.map((c) => {
                      const evidence = READINESS_EVIDENCE[c.id];
                      const updateSent = state.sentUpdates.includes(c.id);
                      const redirected = state.redirectedCandidates.includes(c.id);
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
                          <Td>
                            <RecommendedActionCell
                              label={c.recommendedAction}
                              updateSent={updateSent}
                              redirected={redirected}
                              onRedirect={
                                c.recommendedAction.startsWith("Redirect")
                                  ? () => setRedirectFor(c.id)
                                  : undefined
                              }
                            />
                          </Td>
                          <Td>
                            <span className={jobStyles.reasonCell}>{c.reason}</span>
                          </Td>
                          <Td>{c.createdDate}</Td>
                          <Td>{c.location}</Td>
                        </Row>
                      );
                    })}
                  </TBody>
                </Table>
                <TableFooter>
                  <span>Showing 1 - {candidates.length} of {candidates.length}</span>
                  <span>HM pipeline is over-capacity · Keep candidates warm or redirect</span>
                </TableFooter>
              </TableWrap>
            </>
          )}
        </div>

        {/* ── Right agent panel ── */}
        <div className={jobStyles.sideCol}>
          <AgentChatPanel
            jobId="store-ops"
            observation={`HM pipeline is over target: ${job.pipeline.current} of ${job.pipeline.target} target (${job.pipeline.goalPct}%). I do not recommend forwarding more candidates.`}
            promptChips={STOREOPS_AGENT_CHIPS}
            history={chatHistory}
            onAddEntries={(entries) => pushAgentChat("store-ops", entries)}
          />
        </div>
      </div>

      <KeepWarmModal
        open={keepWarmOpen}
        onOpenChange={setKeepWarmOpen}
        onSend={handleSendWarm}
      />
      {redirectCandidateObj && (
        <RedirectCandidateModal
          open={!!redirectFor}
          onOpenChange={(open) => {
            if (!open) setRedirectFor(null);
          }}
          candidateId={redirectCandidateObj.id}
          candidateName={redirectCandidateObj.name}
          currentRole={job.title}
          suggestedRoleTitle={REDIRECT_TARGET.title}
          suggestedRoleMeta={REDIRECT_TARGET.meta}
          reason="HM pipeline is full for this role and the candidate is a strong match for an open role with available capacity."
          onSuggest={handleRedirectSuggest}
        />
      )}
    </div>
  );
}

function RecommendedActionCell({
  label,
  updateSent,
  redirected,
  onRedirect,
}: {
  label: string;
  updateSent: boolean;
  redirected: boolean;
  onRedirect?: () => void;
}) {
  if (label === "Keep warm" && updateSent) {
    return <span className={jobStyles.recommendedAction}>Update sent</span>;
  }
  if (label.startsWith("Redirect") && redirected) {
    return <span className={jobStyles.recommendedAction}>Redirect suggested</span>;
  }
  if (onRedirect) {
    return (
      <button
        type="button"
        onClick={onRedirect}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          color: "var(--text-link)",
          fontWeight: 500,
          fontSize: "var(--fs-13)",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }
  return <span className={jobStyles.recommendedAction}>{label}</span>;
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
