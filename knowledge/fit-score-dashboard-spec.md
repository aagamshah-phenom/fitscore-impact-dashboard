# Fit Score Model Comparison Dashboard — implementation spec

**Purpose:** Guidance for implementing the dashboard in the **frontend dashboard repository**. **Do not** build UI in `product-copilot-beta` (Copilot/MCP config only).

**Related:** `knowledge/fit-score-snowflake-discovery.md` (Snowflake discovery, grain, prototype numbers for `REFNUM = CIGNUS`).

---

## 1. Dashboard name

**Fit Score Model Comparison Dashboard**

---

## 2. Primary users

- **Product Managers**
- **Fit Score Engineering**
- **Data Science**
- **Customer Value Managers (CVMs)** — later, only via **customer-safe export** governed by Fit Score / DS / legal

---

## 3. Current data source

| Item | Detail |
|------|--------|
| Table | **`DS_DB.AIDSG_DEV.METRIC_FITFORMER`** |
| Status | **Prototype only**; not positioned as production or customer-backed without sign-off |
| Naming | Refer to **`FITFORMER_FIT_LABEL` / `FITFORMER_FIT_SCORE`** as **Fitformer / new model candidate** — **do not** label as **Gen 3** until Fit Score or DS owners approve |

Traditional comparison fields on the same row: **`FIT_LABEL`**, **`FIT_SCORE`**.

---

## 4. Required owner confirmations before production / customer use

Before external, executive, or customer-facing use, owners must confirm:

1. **`FITFORMER_FIT_LABEL`** (and related fields) map to **product-approved naming** — including whether stakeholders may eventually call this **Gen 3**.
2. Whether **`AIDSG_DEV`** has a **production equivalent** table or view with **parity** on grain, freshness, and label semantics.
3. Whether a **PII-safe production view** exists (no candidate identifiers or sensitive attributes in unrestrained extracts).
4. **Authoritative latest-snapshot logic** (ordering, tie-breakers — e.g. whether **`QUARTER`**, **`RECRUITER_FEATURE_ACTION`**, or other keys are required beyond `YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`).
5. Whether **outcome fields** in or outside this table can support an **honest hire-alignment proxy** (definitions validated with data owners).

---

## 5. Dashboard sections for v1

### A. Filters

- **REFNUM / tenant (customer surrogate)** — allowlist-approved values only  
- **Date or snapshot period** — aligned to agreed snapshot rules (calendar period, max `YEAR`/`MONTH`, or as-of date if introduced)  
- **Job category** (`JOB_CATEGORY`)  
- **Job country** (`JOB_COUNTRY` — consider normalization for duplicate country strings)  
- **Job language** (`JOB_LANGUAGE` or **`ML_LANGUAGE`** per DS confirmation)

Backend applies **`WHERE REFNUM IN (...)`** (or equivalent) and applies **dedupe** before aggregation.

### B. KPI cards

On the **filtered, deduped** population (**one row per** `REFNUM + CRM_USER_ID + JOB_ID` after latest snapshot):

1. Total **candidate-job pairs compared**  
2. **Traditional** **A+B** % (`FIT_LABEL` ∈ {A, B})  
3. **Fitformer / new model candidate** **A+B** % (`FITFORMER_FIT_LABEL` ∈ {A, B})  
4. **A+B** **percentage point delta** (Fitformer − Traditional)  
5. **Traditional** **No Fit** %  
6. **Fitformer** **No Fit** %  
7. **No Fit** **percentage point delta**

### C. Score distribution comparison

- **Side-by-side bar chart** — Traditional vs Fitformer counts or % across **A**, **B**, **C**, **No Fit**  
- **Table:**  
  `Label | Traditional Count | Traditional % | Fitformer Count | Fitformer %`  
  plus **TOTAL** and **A+B** rows consistent with KPI math

### D. A+B vs No Fit summary

- Two highlighted **percentage point deltas** (A+B, No Fit)  
- Optional **100% stacked bar** Traditional vs Fitformer (bucket mix: consider including **C** in stack or branch “A+B / C / No Fit” explicitly)

### E. Job-level diagnostics

Aggregate at **`REFNUM`, `JOB_ID`** (still **after** pair-level dedupe or with clear owner rule if job-level mixes multiple snapshots).

**Columns (conceptual — no candidate IDs in outputs):**

| Column | Purpose |
|--------|---------|
| REFNUM / tenant | Partition |
| JOB_ID | Group |
| JOB_CATEGORY | Slice |
| JOB_COUNTRY | Slice |
| JOB_LANGUAGE | Slice |
| candidate-job pair count | Volume in group |
| Traditional A+B % | Selectivity snapshot |
| Fitformer A+B % | Fitformer selectivity |
| A+B delta (pp) | Separation vs traditional |
| Traditional No Fit % | Low-fit concentration |
| Fitformer No Fit % | Fitformer low-fit concentration |
| No Fit delta (pp) | Shift in **No Fit** rate |
| issue flags | e.g. low volume, sparse labels — rules TBD with DS |

### F. Optional score movement matrix (“confusion-style”)

**Only if** product and governance approve **paired** labeling on the deduped population:

- **Rows:** Traditional **`FIT_LABEL`**
- **Columns:** **`FITFORMER_FIT_LABEL`**
- Cells: counts and/or row-% / col-% — copy must stay **distribution / movement**, never **accuracy**

---

## 6. Product language rules

- **Do not** present as **accuracy**, validation against ground truth, or “better/worse hiring” absent agreed outcomes  
- Use: **score distribution**, **model behavior comparison**, **model selectivity**, **score separation**  
- Prefer **percentage point delta** when comparing two percentages  
- **Do not** call Fitformer **Gen 3** until Fit Score / DS approval

---

## 7. Recommended visualizations

| Visualization | Use |
|---------------|-----|
| KPI cards | Headline metrics (§5.B) |
| Side-by-side bar chart | Label distribution (§5.C) |
| 100% stacked bar | A+B / C / No Fit mix (optional, §5.D) |
| Heatmap | Score movement matrix (§5.F) — gated |
| Ranked table | Job-level diagnostics (§5.E), sort by count or delta magnitude |
| Line chart *(later)* | **Only** if **time trend** snapshot rules and stable periods are approved |

---

## 8. Customer-safe disclaimer

> This view compares traditional Fit Score and the new model candidate across the analyzed population. It focuses on score distribution, score movement, and score separation. It should not be interpreted as final model accuracy unless validated against agreed outcome labels.

**(Internal)** prepend environment/source footnote until production view is confirmed (e.g. prototype table / DEV).

---

## 9. SQL query requirements

- **No `SELECT *`**
- **No PII** — no emails, phones, names, EEO, gender, race, ethnicity, etc.
- **No candidate identifiers** in API responses or UI-bound datasets (`CRM_USER_ID`, etc.). Use only aggregates or **job-level** dimensions approved for diagnostic views.
- **Dedupe before aggregation:** `ROW_NUMBER()` over `(REFNUM, CRM_USER_ID, JOB_ID)` with **owner-approved** `ORDER BY` (see discovery doc — default prototyping: `YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`; keep `rn = 1`).
- **Scope:** `REFNUM IN (...)` or equivalent **approved tenant list**
- Prefer **counts + ROUND(..., 2)** for percentages; fix **consistent rounding** for KPI vs table (discovery noted minor discrepancy between headline and distribution row when rounding differs)

---

## 10. Known risks

| Risk | Impact |
|------|--------|
| **`AIDSG_DEV` not production-approved** | Misleading rollout if presented as production customer truth |
| **Fitformer naming** not finalized | Wrong executive / customer vocabulary |
| **Snapshot logic** needs DS approval | Distributions shift when tie-break rules change |
| **REFNUM ≠ customer identity** without owner mapping | Wrong tenant attribution if filters misconfigured |
| **Hire alignment / outcomes** unvalidated | No defensible causal or accuracy claims |
| **Job country string fragmentation** | Skew in geographic slices unless normalized upstream |
| **Label set** may expand beyond A/B/C/No Fit | Dashboard must tolerate **Other** bucket or strict filters after validation |

---

*Spec version for handoff to the dashboard codebase; implementation details (stack, caching, RBAC) belong in that repo.*
