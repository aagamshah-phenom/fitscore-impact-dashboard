---
name: fit-score-model-comparison-dashboard
type: skill
description: >-
  Build, modify, and review Fit Score Model Comparison dashboards and reports. Gen 3 is the
  LLM FitScore arm from PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE (fitscore_with_feedback JSON).
  Fitformer is Gen 2; do not use METRIC_FITFORMER for Gen 3. Prefer scheduled aggregation via
  the usage-metrics repo over live Snowflake from the UI. Use when the user works on Traditional
  vs LLM arm comparison, FACT_CRM_FITSCORE, DENOISED_HIRING_DATA joins, or dashboard spec.
triggers:
  - fit score
  - fitscore
  - model comparison
  - FACT_CRM_FITSCORE
  - fitscore_with_feedback
  - llm fitscore
  - gen 3 fit score
  - traditional fit
  - METRIC_FITFORMER
  - fitformer
  - fit label
  - A+B
  - no fit
  - score distribution
  - score separation
  - usage-metrics
requires:
  - snowflake
---

## Authoritative references

Read and follow:

- `knowledge/fit-score-snowflake-discovery.md` — authoritative table, JSON paths, latest-row logic, joins, governance, **historical METRIC_FITFORMER** notes
- `knowledge/fit-score-dashboard-spec.md` — v1 sections, visualizations, pipeline requirements, disclaimers

**Do not implement dashboard UI in `product-copilot-beta`** — this repo is Copilot/MCP configuration only; UI belongs in the **frontend dashboard repo**. **Production metrics** should flow from **`usage-metrics`** (scheduled aggregation), not ad hoc live Snowflake from the browser.

---

## 1. When to use this skill

Use when the task involves:

- Designing or reviewing **Fit Score Model Comparison** dashboards or slides/reports  
- Writing or reviewing **SQL or pipeline logic** for **Traditional vs Gen 3 (LLM FitScore arm)**  
- Choosing **metrics, copy, or charts** aligned to product-safe language  
- Validating that outputs meet **PII / governance** rules  

**Terminology:**

- **Gen 3** = **LLM FitScore arm** (`armScores.llmFitScore` in `fitscore_with_feedback`).  
- **Fitformer** = **Gen 2** — **do not** use **`DS_DB.AIDSG_DEV.METRIC_FITFORMER`** as the Gen 3 source.  
- **`METRIC_FITFORMER`** content in discovery is **historical only** and explicitly **invalid for Gen 3**.

Do **not** use this skill to claim **accuracy**, or to map **REFNUM → customer name** without an approved mapping process.

---

## 2. Data source guidance

| Role | Object | Notes |
|------|--------|--------|
| **Authoritative fact** | `PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE` | Parse **`fitscore_with_feedback`** |
| **Progression / status** | `SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA` | Join on **`REFNUM` + `JOB_ID` + `CRM_USER_ID`**; **`CANDIDATE_STATUS`** |
| **Historical / Gen 2 only** | `DS_DB.AIDSG_DEV.METRIC_FITFORMER` | **Not** for Gen 3; see discovery §10 |

**Architecture:** prefer **scheduled jobs in `usage-metrics`** materializing aggregates the dashboard consumes. Avoid **live Snowflake** from the UI for heavy fact scans.

Always scope exploration with **`WHERE REFNUM IN (...)`** (approved tenant list). Prefer **`LIMIT`** on exploratory row pulls; **aggregate after dedupe** for KPIs.

---

## 3. JSON field mappings (`fitscore_with_feedback`)

**Traditional (baseline):**

- Label: `parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING`
- Numeric: `parse_json(fitscore_with_feedback):armScores.traditional.fitscore`

**Gen 3 (LLM FitScore arm):**

- Label: `parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING`
- Numeric: `parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore`

---

## 4. Dedupe / latest score rule

On **`FACT_CRM_FITSCORE`**, use **engineering-confirmed** latest row per pair:

```sql
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
  ORDER BY SCORE_UPDATED_DATE DESC
) = 1
```

If duplicates share the same **`SCORE_UPDATED_DATE`**, ask owners for a **secondary tie-breaker**.

*(The older `YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC` pattern applies only to legacy **`METRIC_FITFORMER`** exploration — see discovery doc §10.)*

---

## 5. Metric definitions

On the **deduped** population for the filtered `REFNUM`(s), using **traditional** vs **Gen 3** **labels** (`trad_label`, `gen3_label`):

| Metric | Definition |
|--------|----------------|
| Candidate–job pairs compared | `COUNT(*)` from deduped set |
| Traditional A+B % | `100 * COUNT_IF(trad_label IN ('A','B')) / total_pairs` |
| Gen 3 A+B % | `100 * COUNT_IF(gen3_label IN ('A','B')) / total_pairs` |
| A+B pp delta | Gen 3 A+B % − Traditional A+B % (same denominator) |
| Traditional No Fit % | `100 * COUNT_IF(trad_label = 'No Fit') / total_pairs` |
| Gen 3 No Fit % | `100 * COUNT_IF(gen3_label = 'No Fit') / total_pairs` |
| No Fit pp delta | Gen 3 No Fit % − Traditional No Fit % |

**Distribution table:** counts and % of total for **A, B, C, No Fit** separately for **each** arm; **TOTAL** = `total_pairs`; **A+B** row uses bucket counts above.

Use **consistent rounding** (e.g. 2 decimals) across KPI cards and tables.

**Hired / outcome cuts:** join **`DENOISED_HIRING_DATA`**; use **`CANDIDATE_STATUS = 'HIRED'`** only **after** validating exact values in that table.

---

## 6. Product language rules

- **Do not** call this an **accuracy** dashboard or claim Gen 3 is “more accurate.”  
- Use: **score distribution**, **model behavior comparison**, **model selectivity**, **score separation**, **score movement** (with clear latest-row rules).  
- Compare rates with **percentage point delta**, not vague “percent better.”  
- **Gen 3** = **LLM arm**; **Fitformer** = **Gen 2** — do not conflate.

---

## 7. Visualization recommendations

Align with `knowledge/fit-score-dashboard-spec.md`:

- **KPI cards** — headline counts and pp deltas  
- **Side-by-side bar chart** — Traditional vs **Gen 3 (LLM)** label distribution  
- **100% stacked bar** — optional mix (e.g. A+B / C / No Fit)  
- **Heatmap** — optional **score movement** matrix (Traditional rows × Gen 3 columns), governance-gated  
- **Ranked table** — job-level diagnostics (no candidate IDs)  
- **Line chart** — only if **time trend** and pipeline period rules are approved  

---

## 8. Customer-safe disclaimer

Use verbatim for customer-facing or CVM export contexts (see full text in `knowledge/fit-score-dashboard-spec.md` §8). Internal runs should footnote **`usage-metrics`** refresh and lineage.

---

## 9. Governance and PII rules

- **No** `SELECT *`  
- **No** `CRM_USER_ID`, candidate names, emails, phones, EEO, gender, race, ethnicity, or similar in **stakeholder-facing** outputs  
- **No** ad hoc **REFNUM → company name** in copy; use approved naming only  
- Avoid **`DS_DB.AIDSG_PROD.BIAS_AUDIT_*_RAW`** for general dashboards unless a **redacted view** is approved  
- **Executive / customer** reporting requires **owner-approved** aggregates and hire-field validation  

---

## 10. Known risks and required owner confirmations

Before production or customer use, confirm (see discovery + spec):

1. **JSON schema** stability for **`fitscore_with_feedback`**  
2. **Secondary tie-breaker** if `SCORE_UPDATED_DATE` ties  
3. **`CANDIDATE_STATUS`** canonical values (especially **hired**)  
4. **Join coverage** fact ↔ denoised hiring  
5. **Dimensional fields** surfaced by **`usage-metrics`** for filters and job diagnostics  

Other risks: **conflation of Gen 2 Fitformer with Gen 3 LLM**, **label taxonomy drift**, **sparse joins** skewing progression metrics.

---

## 11. Example SQL query patterns

**A. Latest snapshot per pair from `FACT_CRM_FITSCORE`**

```sql
WITH latest AS (
  SELECT
    REFNUM,
    CRM_USER_ID,
    JOB_ID,
    parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING AS trad_label,
    parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING AS gen3_label,
    parse_json(fitscore_with_feedback):armScores.traditional.fitscore AS trad_fitscore,
    parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore AS gen3_fitscore
  FROM PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE
  WHERE REFNUM IN (/* approved list */)
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
    ORDER BY SCORE_UPDATED_DATE DESC
  ) = 1
)
SELECT
  COUNT(*) AS total_pairs,
  COUNT_IF(trad_label IN ('A','B')) AS trad_ab,
  COUNT_IF(gen3_label IN ('A','B')) AS gen3_ab
  /* ... extend for distribution and pp deltas ... */
FROM latest;
```

**B. Optional join to progression**

```sql
FROM latest f
LEFT JOIN SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA h
  ON f.REFNUM = h.REFNUM
 AND f.JOB_ID = h.JOB_ID
 AND f.CRM_USER_ID = h.CRM_USER_ID
-- Use h.CANDIDATE_STATUS; validate hired literals before filtering
```

**C. Historical reference only — do not use for Gen 3**

```sql
-- INVALID for Gen 3 / LLM arm — Fitformer (Gen 2) exploration table only:
-- FROM DS_DB.AIDSG_DEV.METRIC_FITFORMER
```

Do **not** run broad table scans without `REFNUM` filter and warehouse discipline.

---

## 12. Repo boundary

- **`product-copilot-beta`:** skills, policies, knowledge — **no** dashboard UI implementation here.  
- **Dashboard repo:** components, routing, data fetching, access control — reads **pre-aggregated** data from **`usage-metrics`** where possible.  
- **`usage-metrics` repo:** own scheduled SQL/transforms implementing §4–§5 logic against Snowflake.
