# Candidate Readiness Agent — Clickable POV

Internal clickable prototype that explores a **Candidate Readiness Agent**
embedded inside a Phenom-style CRM.

The prototype focuses on three recruiter scenarios:

1. **Underfilled HM pipeline** — ML Engineer role with 2 ready candidates the
   agent recommends fast-tracking.
2. **High-volume applicant flow** — Customer Service role with 186 new
   applicants the agent groups into actionable buckets.
3. **HM interview backlog** — Store Operations Manager role where the agent
   recommends keeping strong candidates warm instead of forwarding more.

Candidate Readiness is the single visible decision signal everywhere — it
combines profile fit, screening evidence, and pipeline context. There is no
separate Fit Score or Voice Screening column.

## Run it locally

```bash
cd prototypes/candidate-readiness-agent
npm install   # only needed on the first run
npm run dev   # http://localhost:5173
```

Other scripts:

```bash
npm run build    # tsc + vite build
npm run preview  # serve the production build
npm run lint     # eslint
```

## Demo flow

A floating **Demo Guide** in the bottom-left walks you through the script:

1. Start from Jobs / Today's Hiring Priorities (`/jobs`)
2. Open ML Engineer underfilled pipeline
3. Compare ready candidates and move **Routhu Vivek** to HM Interview
4. Open Customer Service high-volume role and bulk prioritize the queue
5. Open Store Operations Manager backlog role and keep candidates warm
6. Hover **Candidate Readiness** chips to show the evidence popover

**Reset Demo** in the Demo Guide footer rolls every action back and returns to
`/jobs`.

## Stack

- React 19 + TypeScript + Vite
- React Router v7
- Radix UI primitives — only `@radix-ui/react-dialog` and `@radix-ui/react-popover`
- Plain CSS Modules — no Tailwind, no UI framework

## What's intentionally out of scope

- Global Candidates page
- Full Candidate Detail page
- Full AI Discovery page
- X+ chat launcher / chat panel
- Filters drawer / advanced filters
- Any tab content beyond the Candidates tab on the three POV jobs

## Folder layout

```
src/
  components/         # AppShell, primitives, modals, DemoGuide, Toast
  data/               # mock jobs, candidates, readiness evidence
  lib/                # cn + inline icon set
  pages/              # JobsPage + 3 job detail pages
  state/              # DemoState (Context + useReducer)
  styles/             # tokens.css + global.css
```

## Reference screenshots

Phenom reference screenshots live under `references/`. They are git-ignored —
they are only used as visual reference during development and are not part of
the prototype runtime.
