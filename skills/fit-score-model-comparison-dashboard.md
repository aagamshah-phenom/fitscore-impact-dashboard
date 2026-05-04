---
name: fit-score-model-comparison-dashboard
type: skill
description: >-
  Build, modify, and review Fit Score Model Comparison dashboards and reports from Snowflake
  using product-safe metrics. Use when the user works on Fit Score vs Fitformer comparison,
  METRIC_FITFORMER, distribution/KPI queries, score separation, or dashboard spec for
  the Model Comparison dashboard.
triggers:
  - fit score
  - fitscore
  - model comparison
  - fitformer
  - METRIC_FITFORMER
  - fit label
  - A+B
  - no fit
  - score distribution
  - score separation
requires:
  - snowflake
---

## Authoritative references

Read and follow:

- `knowledge/fit-score-snowflake-discovery.md` — table, grain, dedupe, prototype numbers, governance
- `knowledge/fit-score-dashboard-spec.md` — v1 sections, visualizations, SQL requirements, disclaimers

**Do not implement dashboard UI in `product-copilot-beta`** — this repo is Copilot/MCP configuration only; UI belongs in the **frontend dashboard repo**.

---

## 1. When to use this skill

Use when the task involves:

- Designing or reviewing **Fit Score Model Comparison** dashboards or slides/reports  
- Writing or reviewing **Snowflake SQL** for traditional vs **Fitformer / new model candidate** distributions  
- Choosing **metrics, copy, or charts** aligned to product-safe language  
- Validating that outputs meet **PII / governance** rules  

Do **not** use this skill to claim **accuracy**, to label Fitformer **Gen 3** without owner approval, or to map **REFNUM → customer name** without an approved mapping process.

---

## 2. Data source guidance

| Environment | Table | Notes |
|-------------|--------|--------|
| **Current prototype** | `DS_DB.AIDSG_DEV.METRIC_FITFORMER` | Internal / prototype; not executive or customer default |
| **Production** | TBD with DS / Fit Score | Require **PII-safe view** and **parity** confirmation before external use |

Always scope with **`WHERE REFNUM IN (...)`** (approved tenant list). Prefer **`LIMIT`** on exploratory row pulls; **aggregate after dedupe** for KPIs.

---

## 3. Traditional vs Fitformer field mappings

**Traditional (baseline on this table):**

- `FIT_SCORE`, `FIT_LABEL`

**Fitformer / new model candidate:**

- `FITFORMER_FIT_SCORE`, `FITFORMER_FIT_LABEL`  
- `FITFORMER_SCORE` exists but is **distinct** from `FITFORMER_FIT_SCORE` — **prefer** `FIT_SCORE` vs `FITFORMER_FIT_SCORE` and `FIT_LABEL` vs `FITFORMER_FIT_LABEL` unless DS says otherwise.

---

## 4. Dedupe / snapshot rules

- Table is **not** one row per candidate–job pair; rows can be **stacked by period** (e.g. `YEAR`/`MONTH`).  
- For **pair-level KPIs**: **one row per** `(REFNUM, CRM_USER_ID, JOB_ID)` after latest snapshot.  
- Default pattern (confirm with owners):

```sql
ROW_NUMBER() OVER (
  PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
  ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC
) AS rn
```

Keep **`rn = 1`**. **`STATUS_UPDATED_DATE` alone** is a weak tie-break; DS may require **`QUARTER`**, **`RECRUITER_FEATURE_ACTION`**, or other keys.

---

## 5. Metric definitions

On the **deduped** population for the filtered `REFNUM`(s):

| Metric | Definition |
|--------|----------------|
| Candidate–job pairs compared | `COUNT(*)` from deduped set |
| Traditional A+B % | `100 * COUNT_IF(FIT_LABEL IN ('A','B')) / total_pairs` |
| Fitformer A+B % | `100 * COUNT_IF(FITFORMER_FIT_LABEL IN ('A','B')) / total_pairs` |
| A+B pp delta | Fitformer A+B % − Traditional A+B % (same denominator) |
| Traditional No Fit % | `100 * COUNT_IF(FIT_LABEL = 'No Fit') / total_pairs` |
| Fitformer No Fit % | `100 * COUNT_IF(FITFORMER_FIT_LABEL = 'No Fit') / total_pairs` |
| No Fit pp delta | Fitformer No Fit % − Traditional No Fit % |

**Distribution table:** counts and % of total for **A, B, C, No Fit** separately for **each** label column; **TOTAL** = `total_pairs`; **A+B** row uses joint bucket counts above.

Use **consistent rounding** (e.g. 2 decimals) across KPI cards and tables to avoid headline/table mismatch.

**Labels observed in prototype data:** A, B, C, No Fit only — design for **Other** if new labels appear.

---

## 6. Product language rules

- **Do not** call this an **accuracy** dashboard or claim one model is “more accurate.”  
- Use: **score distribution**, **model behavior comparison**, **model selectivity**, **score separation**, **score movement** (with clear snapshot rules).  
- Compare rates with **percentage point delta**, not vague “percent better.”  
- **Do not** call Fitformer **Gen 3** until Fit Score / DS confirms.

---

## 7. Visualization recommendations

Align with `knowledge/fit-score-dashboard-spec.md`:

- **KPI cards** — headline counts and pp deltas  
- **Side-by-side bar chart** — Traditional vs Fitformer label distribution  
- **100% stacked bar** — optional mix (e.g. A+B / C / No Fit)  
- **Heatmap** — optional **score movement** matrix (Traditional rows × Fitformer columns), governance-gated  
- **Ranked table** — job-level diagnostics (no candidate IDs)  
- **Line chart** — only if **time trend** and period rules are approved  

---

## 8. Customer-safe disclaimer

Use verbatim for customer-facing or CVM export contexts (see full text in `knowledge/fit-score-dashboard-spec.md` §8). Internal runs should still footnote **DEV / prototype** source until production view is approved.

---

## 9. Governance and PII rules

- **No** `SELECT *`  
- **No** `CRM_USER_ID`, candidate names, emails, phones, EEO, gender, race, ethnicity, or similar in **stakeholder-facing** outputs  
- **No** ad hoc **REFNUM → company name** in copy; use approved naming only  
- Avoid **`DS_DB.AIDSG_PROD.BIAS_AUDIT_*_RAW`** for general dashboards unless a **redacted view** is approved  
- **Executive / customer** reporting requires **production parity** and owner sign-off  

---

## 10. Known risks and required owner confirmations

Before production or customer use, confirm (see discovery + spec):

1. Whether **`FITFORMER_FIT_LABEL`** maps to product naming (incl. eventual **Gen 3**)  
2. **Production equivalent** to `AIDSG_DEV.METRIC_FITFORMER`  
3. **PII-safe production view**  
4. **Final snapshot / dedupe** logic  
5. **Outcome / hire-alignment** proxies and field definitions  

Other risks: **JOB_COUNTRY** string fragmentation, **empty** `FINAL_STANDARD_ORDER` in related analyses, **DEV** skew vs prod.

---

## 11. Example SQL query patterns

**A. Latest snapshot CTE (pair-level)**

```sql
WITH ranked AS (
  SELECT
    REFNUM,
    CRM_USER_ID,
    JOB_ID,
    FIT_LABEL,
    FITFORMER_FIT_LABEL,
    ROW_NUMBER() OVER (
      PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
      ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC
    ) AS rn
  FROM DS_DB.AIDSG_DEV.METRIC_FITFORMER
  WHERE REFNUM IN (/* approved list */)
),
latest AS (
  SELECT FIT_LABEL, FITFORMER_FIT_LABEL
  FROM ranked
  WHERE rn = 1
),
counts AS (
  SELECT
    COUNT(*) AS total_pairs,
    COUNT_IF(FIT_LABEL = 'A') AS trad_a,
    /* ... trad_b, trad_c, trad_nf, ff_a, ff_b, ff_c, ff_nf, trad_ab, ff_ab ... */
  FROM latest
)
SELECT ... ;
```

**B. Headline metrics from `counts`**

- `candidate_job_pairs_compared` = `total_pairs`  
- A+B and No Fit % and **pp deltas** as in §5 (`100.0 * (ff_ab - trad_ab) / NULLIF(total_pairs,0)` etc.)

**C. Distribution rows** — `UNION ALL` of label rows + TOTAL + A+B from `counts` (see discovery doc §10).

**D. Job-level rollup** — `GROUP BY REFNUM, JOB_ID, JOB_CATEGORY, JOB_COUNTRY, JOB_LANGUAGE` after bringing `latest` to include those dimensions (still **no** candidate id in `SELECT` list for exports).

Do **not** run broad table scans without `REFNUM` filter and warehouse discipline.

---

## 12. Repo boundary

- **`product-copilot-beta`:** skills, policies, knowledge, MCP — **no** dashboard UI implementation here.  
- **Dashboard repo:** implement components, routing, data fetching, and access control; use this skill + linked **knowledge** files as the spec source.
