import type { ReadinessEvidence } from "./types";

export const READINESS_EVIDENCE: Record<string, ReadinessEvidence> = {
  "routhu-vivek": {
    status: "ready-for-hm",
    summary:
      "Profile evidence and screening evidence both support moving this candidate forward.",
    profileFit: "Strong",
    screeningEvidence: "Strong",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "HM pipeline under target",
    riskConcern: "Low",
    riskLevel: "low",
    recommendedNextAction: "Fast-track to HM Interview",
  },
  "ryan-reynolds": {
    status: "needs-review",
    summary:
      "Profile evidence is strong, but screening responses did not show enough technical depth.",
    profileFit: "Strong",
    screeningEvidence: "Weak",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "HM pipeline under target",
    riskConcern: "Screening depth concern",
    riskLevel: "medium",
    recommendedNextAction: "Review screening transcript before moving forward",
  },
  "benno-muller": {
    status: "needs-recruiter-review",
    summary:
      "Profile is a strong match; screening responses are submitted but awaiting evaluation.",
    profileFit: "Good",
    screeningEvidence: "Pending evaluation",
    experienceMatch: "Within range",
    locationMatch: "Remote-acceptable",
    pipelineContext: "HM pipeline under target",
    riskConcern: "Evaluation pending",
    riskLevel: "low",
    recommendedNextAction: "Review screening evaluation before HM Interview",
  },
  "tair-malka": {
    status: "needs-review",
    summary:
      "Screening evidence is strong, but the profile shows a meaningful gap from the target persona.",
    profileFit: "Gap on core ML stack",
    screeningEvidence: "Strong",
    experienceMatch: "Above range",
    locationMatch: "International — relocation required",
    pipelineContext: "HM pipeline under target",
    riskConcern: "Profile / persona mismatch",
    riskLevel: "medium",
    recommendedNextAction: "Manual review by recruiter",
  },
  "lalitha-singari": {
    status: "send-to-screening",
    summary:
      "Profile looks good but no screening evidence yet. Sending to screening will produce a clear readiness signal.",
    profileFit: "Good",
    screeningEvidence: "Not started",
    experienceMatch: "Within range",
    locationMatch: "Remote-acceptable",
    pipelineContext: "HM pipeline under target",
    riskConcern: "Missing screening evidence",
    riskLevel: "low",
    recommendedNextAction: "Send to screening",
  },
  // Customer Service
  "cs-amber-thomas": readyForScreening("Strong retail background; no screening yet."),
  "cs-darius-johnson": readyForScreening(
    "Recent customer service experience; profile fit is solid.",
  ),
  "cs-priscila-vargas": readyForScreening(
    "Front-desk experience aligned to role expectations.",
  ),
  "cs-marcus-bell": {
    status: "needs-review",
    summary:
      "Screening completed with mixed signals — manager-level experience may be a fit gap for this part-time role.",
    profileFit: "Strong",
    screeningEvidence: "Mixed",
    experienceMatch: "Above range",
    locationMatch: "Good",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Over-qualified concern",
    riskLevel: "medium",
    recommendedNextAction: "Review screening evidence",
  },
  "cs-haylee-nguyen": {
    status: "needs-review",
    summary:
      "Profile is a good match but screening responses on availability are unclear.",
    profileFit: "Good",
    screeningEvidence: "Unclear availability",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Availability mismatch",
    riskLevel: "medium",
    recommendedNextAction: "Manual review",
  },
  "cs-trevor-park": lowPriority("Warehouse background only; weak retail evidence."),
  "cs-celia-roberts": lowPriority("Limited experience; out-of-state location."),
  "cs-jared-okafor": lowPriority("Profile partially matches; out-of-state location."),
  "cs-ainsley-mosley": {
    status: "ready-for-hm",
    summary:
      "Strong retail supervisor profile with completed, high-scoring screening.",
    profileFit: "Strong",
    screeningEvidence: "Strong",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Low",
    riskLevel: "low",
    recommendedNextAction: "Fast-track to HM Interview",
  },
  "cs-omar-rivera": {
    status: "needs-review",
    summary:
      "Screening still in progress; wait for completion before deciding.",
    profileFit: "Good",
    screeningEvidence: "In progress",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Incomplete evidence",
    riskLevel: "low",
    recommendedNextAction: "Wait for screening completion",
  },
  // Store Ops
  "olivia-carter": {
    status: "strong-candidate",
    summary:
      "Strong management profile with positive screening — should be kept warm rather than added to a full pipeline.",
    profileFit: "Strong",
    screeningEvidence: "Strong",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "HM pipeline is over-capacity",
    riskConcern: "Pipeline congestion",
    riskLevel: "low",
    recommendedNextAction: "Keep warm with a short update",
  },
  "marcus-lee": {
    status: "strong-candidate",
    summary:
      "Strong operations leader; better suited to a similar open role with available HM capacity.",
    profileFit: "Strong",
    screeningEvidence: "Strong",
    experienceMatch: "Above range",
    locationMatch: "Good",
    pipelineContext: "HM pipeline is over-capacity",
    riskConcern: "Better fit elsewhere",
    riskLevel: "low",
    recommendedNextAction: "Redirect to similar role",
  },
  "priya-shah": {
    status: "needs-review",
    summary:
      "Solid retail operations background but HM backlog means no immediate action is recommended.",
    profileFit: "Good",
    screeningEvidence: "Adequate",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "HM backlog — pipeline full",
    riskConcern: "Pipeline congestion",
    riskLevel: "low",
    recommendedNextAction: "Hold for later",
  },
};

function readyForScreening(detail: string): ReadinessEvidence {
  return {
    status: "send-to-screening",
    summary: detail,
    profileFit: "Good",
    screeningEvidence: "Not started",
    experienceMatch: "Within range",
    locationMatch: "Good",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Missing screening evidence",
    riskLevel: "low",
    recommendedNextAction: "Send to screening",
  };
}

function lowPriority(detail: string): ReadinessEvidence {
  return {
    status: "low-priority",
    summary: detail,
    profileFit: "Partial",
    screeningEvidence: "Not started",
    experienceMatch: "Below range",
    locationMatch: "Out of preferred radius",
    pipelineContext: "High-volume applicant flow",
    riskConcern: "Low likelihood of fit",
    riskLevel: "low",
    recommendedNextAction: "Hold for later",
  };
}
