# Fit Score Model Comparison Dashboard — implementation spec

**Purpose:** Guidance for implementing the dashboard in the **frontend dashboard repository** and supporting **scheduled metrics** in **`usage-metrics`**. **Do not** build UI in `product-copilot-beta` (Copilot/MCP config only).

**Related:** `knowledge/fit-score-snowflake-discovery.md` (sources, grain, joins, governance).

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

## 3. Current data source and architecture

| Item | Detail |
|------|--------|
| **Fact table** | **`PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE`** |
| **Payload** | **`fitscore_with_feedback`** (JSON) |
| **Gen 3** | **LLM FitScore arm** — extracted from JSON; **not** Fitformer |
| **Gen 2 / Fitformer** | **`DS_DB.AIDSG_DEV.METRIC_FITFORMER`** is **out of scope** for Gen 3; see discovery doc **historical** section only |

**Label columns (conceptual — parse in pipeline or warehouse):**

- **Traditional:** `parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING`
- **Gen 3 (LLM):** `parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING`

**Numeric scores:**

- **Traditional:** `parse_json(fitscore_with_feedback):armScores.traditional.fitscore`
- **Gen 3 (LLM):** `parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore`

**Serving pattern:** implement **scheduled aggregation** through the **`usage-metrics`** repo (materialized metrics / APIs). **Avoid** wiring the dashboard UI to **live Snowflake** queries against the fact table for routine loads.

---

## 4. Required owner confirmations before production / customer use

Before external, executive, or customer-facing use, owners must confirm:

1. **JSON schema stability** for `fitscore_with_feedback` (path names, nulls, type coercions for `fitscore`).
2. **PII-safe production paths** for aggregated datasets exposed to the UI (no candidate identifiers in unrestrained API payloads).
3. **`CANDIDATE_STATUS`** **value list** on `SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA` — exact strings for **hired** (do **not** assume `'HIRED'` until validated).
4. **Join coverage** between `FACT_CRM_FITSCORE` and `DENOISED_HIRING_DATA` on `REFNUM` + `JOB_ID` + `CRM_USER_ID` (sparsity, lag, orphan rows).
5. **Slice dimensions** available in the aggregated tables (job category, country, language, etc.) — confirm which come from fact vs enrichment.

---

## 5. Dashboard sections for v1

### A. Filters

- **REFNUM / tenant (customer surrogate)** — allowlist-approved values only  
- **Date or score period** — aligned to pipeline partition / refresh cadence (and underlying `SCORE_UPDATED_DATE` semantics in source SQL)  
- **Job / req dimensions** — as exposed by **`usage-metrics`** aggregates (e.g. category, country, language) once confirmed in schema  

Backend applies **`WHERE REFNUM IN (...)`** (or equivalent) upstream; **`latest row per pair`** must be applied **before** aggregation using:

```sql
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
  ORDER BY SCORE_UPDATED_DATE DESC
) = 1
```

### B. KPI cards

On the **filtered, deduped** population (**one row per** `REFNUM + CRM_USER_ID + JOB_ID` after latest `SCORE_UPDATED_DATE`):

1. Total **candidate-job pairs compared**  
2. **Traditional** **A+B** % (traditional label ∈ {A, B})  
3. **Gen 3 (LLM)** **A+B** % (LLM label ∈ {A, B})  
4. **A+B** **percentage point delta** (Gen 3 − Traditional)  
5. **Traditional** **No Fit** %  
6. **Gen 3** **No Fit** %  
7. **No Fit** **percentage point delta**

### C. Score distribution comparison

- **Side-by-side bar chart** — Traditional vs Gen 3 (LLM) counts or % across **A**, **B**, **C**, **No Fit**  
- **Table:**  
  `Label | Traditional Count | Traditional % | Gen 3 Count | Gen 3 %`  
  plus **TOTAL** and **A+B** rows consistent with KPI math

### D. A+B vs No Fit summary

- Two highlighted **percentage point deltas** (A+B, No Fit)  
- Optional **100% stacked bar** Traditional vs Gen 3 (bucket mix: consider including **C** explicitly)

### E. Job-level diagnostics

Aggregate at **`REFNUM`, `JOB_ID`** (still **after** pair-level dedupe).

**Columns (conceptual — no candidate IDs in outputs):**

| Column | Purpose |
|--------|---------|
| REFNUM / tenant | Partition |
| JOB_ID | Group |
| Job slice dimensions | As available from aggregates |
| candidate-job pair count | Volume in group |
| Traditional A+B % | Selectivity snapshot |
| Gen 3 A+B % | LLM arm selectivity |
| A+B delta (pp) | Separation vs traditional |
| Traditional No Fit % | Low-fit concentration |
| Gen 3 No Fit % | LLM low-fit concentration |
| No Fit delta (pp) | Shift in **No Fit** rate |
| issue flags | e.g. low volume — rules TBD |

### F. Optional score movement matrix (“confusion-style”)

**Only if** product and governance approve **paired** labeling on the deduped population:

- **Rows:** Traditional **label** (`armScores.traditional.fit`)
- **Columns:** **Gen 3** **label** (`armScores.llmFitScore.fit`)
- Cells: counts and/or row-% / col-% — copy stays **distribution / movement**, never **accuracy**

### G. Progression / hire alignment (optional, gated)

- Join keys: **`REFNUM`**, **`JOB_ID`**, **`CRM_USER_ID`** to **`SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA`**
- **Candidate status:** **`CANDIDATE_STATUS`** from denoised hiring data  
- **Hired metrics:** filter on hired status **only** after **validating exact** `CANDIDATE_STATUS` values in the table  
- Frame as **proxy alignment**, not model accuracy  

---

## 6. Product language rules

- **Do not** present as **accuracy**, validation against ground truth, or “better/worse hiring” absent agreed outcomes  
- Use: **score distribution**, **model behavior comparison**, **model selectivity**, **score separation**  
- Prefer **percentage point delta** when comparing two percentages  
- **Gen 3** = **LLM FitScore arm**; **do not** equate Gen 3 with **Fitformer** (Gen 2)

---

## 7. Recommended visualizations

| Visualization | Use |
|---------------|-----|
| KPI cards | Headline metrics (§5.B) |
| Side-by-side bar chart | Label distribution (§5.C) |
| 100% stacked bar | A+B / C / No Fit mix (optional, §5.D) |
| Heatmap | Score movement matrix (§5.F) — gated |
| Ranked table | Job-level diagnostics (§5.E) |
| Line chart *(later)* | **Only** if **time trend** rules and stable pipeline periods are approved |

---

## 8. Customer-safe disclaimer

> This view compares traditional Fit Score and the Gen 3 LLM Fit Score arm across the analyzed population. It focuses on score distribution, score movement, and score separation. It should not be interpreted as final model accuracy unless validated against agreed outcome labels.

**(Internal)** footnote **data lineage** (fact table + **`usage-metrics`** refresh cadence) until customer-facing packaging is approved.

---

## 9. SQL / pipeline requirements

- **No `SELECT *`** in published metric definitions  
- **No PII** — no emails, phones, names, EEO, gender, race, ethnicity, etc.  
- **No candidate identifiers** in API responses or UI-bound datasets (`CRM_USER_ID`, etc.). Use only aggregates or **job-level** dimensions approved for diagnostic views.  
- **Dedupe before aggregation:** `ROW_NUMBER()` / **`QUALIFY`** pattern in §5.A on **`FACT_CRM_FITSCORE`** (`ORDER BY SCORE_UPDATED_DATE DESC`).  
- **Scope:** `REFNUM IN (...)` or equivalent **approved tenant list**  
- Prefer **counts + ROUND(..., 2)** for percentages; fix **consistent rounding** for KPI vs table  
- **Prefer implementing metric SQL in `usage-metrics`** (scheduled) rather than **live** warehouse calls from the UI  

---

## 10. Known risks

| Risk | Impact |
|------|--------|
| **JSON path drift** in `fitscore_with_feedback` | Broken or null extractions in aggregates |
| **Gen 3 vs Fitformer confusion** | Wrong executive narrative if Gen 2 tables are mixed into Gen 3 reporting |
| **Latest-row tie-breakers** | If multiple rows share the same `SCORE_UPDATED_DATE`, distributions may need an explicit secondary key from engineering |
| **REFNUM ≠ customer identity** without owner mapping | Wrong tenant attribution if filters misconfigured |
| **Hire / outcome fields** unvalidated | No defensible hire-alignment claims until `CANDIDATE_STATUS` values are confirmed |
| **Join sparsity** (fit fact vs denoised hiring) | Skewed progression metrics if many pairs fail the join |

---

*Spec for handoff to the dashboard + `usage-metrics` codebases; RBAC and runtime stack belong there.*
