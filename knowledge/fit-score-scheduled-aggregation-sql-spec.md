# Fit Score dashboard — scheduled aggregation SQL specification

**Scope:** Documentation and SQL design guidance for the **`usage-metrics`** (or equivalent) **scheduled aggregation job** that materializes metrics for the Fit Score Model Comparison dashboard.

**Not in scope:** Executing queries in Snowflake, changing application code, or defining UI contracts beyond aggregate outputs.

**Architecture:** The dashboard must **not** run live Snowflake queries against the fact table for routine loads. This job **runs on a schedule**, writes **aggregated, PII-safe** rows, and the UI consumes **those** results only.

---

## 1. Purpose of the scheduled aggregation

- **Reduce cost and latency:** Avoid repeated full scans of `FACT_CRM_FITSCORE` from user-driven sessions.
- **Enforce governance:** A single pipeline applies **latest-row logic**, **REFNUM allowlists**, and **PII rules** before anything reaches the dashboard layer.
- **Stable metrics:** Precompute **Traditional vs Gen 3 (LLM arm)** label distributions, **A+B** and **No Fit** shares, **percentage point deltas**, and optional **job-level** rollups so KPIs and charts do not drift with ad hoc SQL in the browser.
- **Optional outcomes:** Optionally attach **candidate status** from denoised hiring data for progression-style metrics, with **hire and funnel cuts explicitly provisional** until `CANDIDATE_STATUS` values are validated.

---

## 2. Input tables

| Role | Object | Usage |
|------|--------|--------|
| **Primary fact** | `PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE` | Extract labels/scores from `fitscore_with_feedback`; apply **latest score** per triple. |
| **Outcome / status** | `SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA` | Optional join for **`CANDIDATE_STATUS`** and progression guidance. **Not** required for core label distribution KPIs. |

**Pairing grain for deduplication and joins:**

- `REFNUM`
- `CRM_USER_ID`
- `JOB_ID`

**Note:** `CRM_USER_ID` may appear **only inside** the pipeline for joining and deduplication. It **must not** appear in **published** aggregate tables (see §14).

---

## 3. Field extraction paths

All paths read from **`fitscore_with_feedback`** via `parse_json`. **Do not** use `SELECT *` anywhere in job SQL; list columns explicitly.

| Concept | Snowflake expression |
|---------|----------------------|
| **Traditional label** | `parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING` |
| **Gen 3 (LLM) label** | `parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING` |
| **Traditional numeric score** | `parse_json(fitscore_with_feedback):armScores.traditional.fitscore` |
| **Gen 3 (LLM) numeric score** | `parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore` |

**Assumptions (to confirm with engineering):**

- `fitscore_with_feedback` is non-null for rows included in customer-facing populations (or nulls are excluded / bucketed explicitly).
- Types for `fitscore` nodes coerce cleanly in Snowflake (may need `::FLOAT` or `TRY_TO_DOUBLE` after validation).
- Label strings align with product taxonomy (e.g. `A`, `B`, `C`, `No Fit`); pipeline should tolerate **unknown / null** labels via an **Other** bucket or exclusion counts.

**Dimensional columns for job-level rollups (if present on fact or enrichment):**

- List explicit columns once confirmed — e.g. `JOB_TITLE`, `JOB_CATEGORY`, or equivalents on `FACT_CRM_FITSCORE` or a **governed** dimension join.
- If not available on the fact, job-level aggregates may be **REFNUM + JOB_ID** only until a safe dimension source is added.

---

## 4. Latest score CTE

**Rule:** For each **`(REFNUM, CRM_USER_ID, JOB_ID)`**, keep the row with the **latest `SCORE_UPDATED_DATE`**.

**Illustrative pattern (comments mark assumptions):**

```sql
-- ASSUMPTION: SCORE_UPDATED_DATE is the authoritative “as of” timestamp for latest score.
-- OPEN: If ties (same timestamp) exist, add a secondary ORDER BY column from owners.
latest_scores AS (
  SELECT
    REFNUM,
    JOB_ID,
    CRM_USER_ID,
    SCORE_UPDATED_DATE,
    parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING AS trad_label,
    parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING AS gen3_label,
    parse_json(fitscore_with_feedback):armScores.traditional.fitscore AS trad_fitscore,
    parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore AS gen3_fitscore
    -- Add JOB_TITLE, JOB_CATEGORY, etc. only if confirmed on source or join — explicit list, no SELECT *.
  FROM PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE
  WHERE REFNUM IN (/* approved tenant allowlist — pipeline parameter */)
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
    ORDER BY SCORE_UPDATED_DATE DESC
  ) = 1
)
```

**Downstream stages must treat `latest_scores` as the only population for pair-level metrics** unless product defines a different grain.

---

## 5. Score distribution by REFNUM and month

**Intent:** Time-sliced label counts for trending / monthly tables, still **without** exposing `CRM_USER_ID`.

**Month key (recommended):** Derive from **`SCORE_UPDATED_DATE`** for the **latest** row per triple, e.g. `DATE_TRUNC('MONTH', SCORE_UPDATED_DATE) AS score_month`.

**Illustrative aggregation (pair-level counts after latest CTE):**

```sql
-- ASSUMPTION: “Month” for dashboard = calendar month of SCORE_UPDATED_DATE on the latest row per triple.
monthly_label_counts AS (
  SELECT
    REFNUM,
    DATE_TRUNC('MONTH', SCORE_UPDATED_DATE) AS score_month,
    trad_label,
    gen3_label,
    COUNT(*) AS pair_count
  FROM latest_scores
  GROUP BY 1, 2, 3, 4
)
```

**Optional expansion:** Separate **wide** tables with columns for each label value can be built in a follow-on step using `SUM(CASE WHEN ...)` — keep **aggregated only**.

---

## 6. Traditional vs Gen 3 A+B %

**Definition (on deduped latest triples):**

- **Traditional A+B %** = `100.0 * (count of pairs where trad_label IN ('A','B')) / NULLIF(total_pairs, 0)`
- **Gen 3 A+B %** = `100.0 * (count of pairs where gen3_label IN ('A','B')) / NULLIF(total_pairs, 0)`

**Pair denominator:** `COUNT(*)` over **`latest_scores`** for the filtered `REFNUM`(s) and any other approved slice (e.g. month).

Use **consistent rounding** (e.g. 2 decimal places) across all published percentage columns.

---

## 7. Traditional vs Gen 3 No Fit %

**Definition:**

- **Traditional No Fit %** = `100.0 * COUNT_IF(trad_label = 'No Fit') / NULLIF(total_pairs, 0)`
- **Gen 3 No Fit %** = `100.0 * COUNT_IF(gen3_label = 'No Fit') / NULLIF(total_pairs, 0)`

**Assumption:** Literal **`'No Fit'`** matches production; validate against parsed label distinct values. If product uses different casing or synonyms, map in a **single governed** place in the pipeline.

---

## 8. A/B percentage point delta

**Definition (not percent change):**

- **A+B percentage point delta** = **Gen 3 A+B % − Traditional A+B %**

Report **percentage points** (difference of two percentages), not multiplicative “percent improvement.”

---

## 9. No Fit percentage point delta

**Definition:**

- **No Fit percentage point delta** = **Gen 3 No Fit % − Traditional No Fit %**

Same rule: **percentage point delta** only.

---

## 10. Candidate status join

**Outcome table:** `SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA`

**Join keys (to latest fact grain):**

- `REFNUM`
- `JOB_ID`
- `CRM_USER_ID`

**Illustrative left join (status for enrichment only; still aggregate out individuals):**

```sql
-- ASSUMPTION: At most one meaningful status row per triple after dedupe, OR owners define pick-one rules.
-- OPEN: If multiple rows per triple, use QUALIFY / MAX_BY or status priority table from owners.
latest_with_status AS (
  SELECT
    ls.REFNUM,
    ls.JOB_ID,
    ls.SCORE_UPDATED_DATE,
    ls.trad_label,
    ls.gen3_label,
    h.CANDIDATE_STATUS
    -- CRM_USER_ID omitted from SELECT when writing to published outputs; may exist only inside JOIN condition.
  FROM latest_scores ls
  LEFT JOIN SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA h
    ON ls.REFNUM = h.REFNUM
    AND ls.JOB_ID = h.JOB_ID
    AND ls.CRM_USER_ID = h.CRM_USER_ID
)
```

**Published tables:** Aggregate to **`REFNUM`** (and optional month, job, status bucket) — **never** emit `CRM_USER_ID`.

---

## 11. Interview / post-interview / hired metric guidance

**Status field:** `CANDIDATE_STATUS` from `DENOISED_HIRING_DATA`.

**Governance:**

- **Hired and funnel metrics are PENDING** until **`CANDIDATE_STATUS`** **allowed values** are **validated** (exact strings, case, duplicates, and business meaning of “interview” vs “post-interview”).
- Do **not** ship customer or executive **hire-rate** KPIs based on assumed literals such as `'HIRED'` without that validation.
- Until validation completes, the job may:
  - Emit **only** raw **distribution of status** among rows that successfully joined (aggregated counts by `CANDIDATE_STATUS` **as stored**), **marked provisional** in table comments or metadata, **or**
  - Omit hire-specific columns entirely from v1 outputs.

**Suggested pattern after validation (illustrative — replace literals with approved mapping):**

```sql
-- PENDING: Replace status literals with validated taxonomy from data owners.
-- Example only — DO NOT use in production until validated:
-- COUNT_IF(CANDIDATE_STATUS IN (/* approved hired values */))
```

**Product language:** Frame any outcome-based cuts as **proxies** aligned to **`CANDIDATE_STATUS`**, not model **accuracy**.

---

## 12. Job-level distribution by JOB_ID, job title, job category (if available)

**Grain:** `REFNUM` + `JOB_ID` (+ optional **`score_month`**) **after** `latest_scores`.

**Dimensions:**

- **`JOB_ID`:** Expect on fact or join; include in aggregates.
- **`job_title`, `job_category`:** Include **only** if present under **explicit column names** on a governed source (fact or approved dimension). **Do not** guess column names in production without schema confirmation.

**Illustrative rollup:**

```sql
-- ASSUMPTION: JOB_TITLE and JOB_CATEGORY column names TBD — omit until confirmed.
job_level_summary AS (
  SELECT
    REFNUM,
    JOB_ID,
    DATE_TRUNC('MONTH', SCORE_UPDATED_DATE) AS score_month,
    /* JOB_TITLE,     -- add when available */
    /* JOB_CATEGORY,  -- add when available */
    COUNT(*) AS pair_count,
    COUNT_IF(trad_label IN ('A', 'B')) AS trad_ab_pairs,
    COUNT_IF(gen3_label IN ('A', 'B')) AS gen3_ab_pairs,
    COUNT_IF(trad_label = 'No Fit') AS trad_no_fit_pairs,
    COUNT_IF(gen3_label = 'No Fit') AS gen3_no_fit_pairs,
    /* Percentages from aggregates in same SELECT (no forward reference to aliases). */
    ROUND(100.0 * COUNT_IF(trad_label IN ('A', 'B')) / NULLIF(COUNT(*), 0), 2) AS trad_ab_pct,
    ROUND(100.0 * COUNT_IF(gen3_label IN ('A', 'B')) / NULLIF(COUNT(*), 0), 2) AS gen3_ab_pct,
    ROUND(
      100.0 * COUNT_IF(gen3_label IN ('A', 'B')) / NULLIF(COUNT(*), 0)
      - 100.0 * COUNT_IF(trad_label IN ('A', 'B')) / NULLIF(COUNT(*), 0),
      2
    ) AS ab_pp_delta,
    ROUND(100.0 * COUNT_IF(trad_label = 'No Fit') / NULLIF(COUNT(*), 0), 2) AS trad_no_fit_pct,
    ROUND(100.0 * COUNT_IF(gen3_label = 'No Fit') / NULLIF(COUNT(*), 0), 2) AS gen3_no_fit_pct,
    ROUND(
      100.0 * COUNT_IF(gen3_label = 'No Fit') / NULLIF(COUNT(*), 0)
      - 100.0 * COUNT_IF(trad_label = 'No Fit') / NULLIF(COUNT(*), 0),
      2
    ) AS no_fit_pp_delta
  FROM latest_scores
  GROUP BY
    REFNUM,
    JOB_ID,
    DATE_TRUNC('MONTH', SCORE_UPDATED_DATE)
    /* , JOB_TITLE, JOB_CATEGORY — when confirmed */
)
```

**Note:** Prefer a **nested CTE** that computes `*_pct` from `*_pairs` and `pair_count` if you want a single rounding pass and cleaner diffs; the above stays valid when inlined.

---

## 13. Proposed output table schema

**Recommendation:** One **tenant-month summary** table and one **tenant-month-job** table (names illustrative). All tables **exclude `CRM_USER_ID`**. Use **`VARCHAR`/numeric types** appropriate to Snowflake and the `usage-metrics` target (Snowflake table, Parquet, etc.).

### 13.1 `FIT_SCORE_DASHBOARD_REFNUM_MONTHLY` (illustrative name)

| Column | Type | Description |
|--------|------|-------------|
| `REFNUM` | VARCHAR | Tenant surrogate |
| `SCORE_MONTH` | DATE | `DATE_TRUNC('MONTH', SCORE_UPDATED_DATE)` |
| `PAIR_COUNT` | NUMBER | Latest triples in scope |
| `TRAD_A_CNT` … | NUMBER | Optional per-label counts for Traditional |
| `GEN3_A_CNT` … | NUMBER | Optional per-label counts for Gen 3 |
| `TRAD_AB_PCT` | NUMBER(5,2) | Traditional A+B % |
| `GEN3_AB_PCT` | NUMBER(5,2) | Gen 3 A+B % |
| `AB_PP_DELTA` | NUMBER(5,2) | **Percentage point delta** (Gen 3 − Traditional) |
| `TRAD_NO_FIT_PCT` | NUMBER(5,2) | Traditional No Fit % |
| `GEN3_NO_FIT_PCT` | NUMBER(5,2) | Gen 3 No Fit % |
| `NO_FIT_PP_DELTA` | NUMBER(5,2) | **Percentage point delta** (Gen 3 − Traditional) |
| `JOB_AGG_RUN_ID` / `LOADED_AT` | VARCHAR / TIMESTAMP | Pipeline audit |
| `METRIC_VERSION` | VARCHAR | Spec / SQL version |

### 13.2 `FIT_SCORE_DASHBOARD_REFNUM_JOB_MONTHLY` (illustrative name)

| Column | Type | Description |
|--------|------|-------------|
| `REFNUM` | VARCHAR | Tenant |
| `JOB_ID` | VARCHAR | Job identifier |
| `SCORE_MONTH` | DATE | Month of latest `SCORE_UPDATED_DATE` |
| `JOB_TITLE` | VARCHAR | **Nullable** until source confirmed |
| `JOB_CATEGORY` | VARCHAR | **Nullable** until source confirmed |
| `PAIR_COUNT` | NUMBER | Pairs for this job in month |
| `TRAD_AB_PCT` | NUMBER(5,2) | … |
| `GEN3_AB_PCT` | NUMBER(5,2) | … |
| `AB_PP_DELTA` | NUMBER(5,2) | … |
| `TRAD_NO_FIT_PCT` | NUMBER(5,2) | … |
| `GEN3_NO_FIT_PCT` | NUMBER(5,2) | … |
| `NO_FIT_PP_DELTA` | NUMBER(5,2) | … |

### 13.3 `FIT_SCORE_DASHBOARD_STATUS_COUNTS_REFNUM_MONTHLY` (optional, provisional)

Only if/product approves **provisional** status reporting:

| Column | Type | Description |
|--------|------|-------------|
| `REFNUM` | VARCHAR | |
| `SCORE_MONTH` | DATE | |
| `CANDIDATE_STATUS` | VARCHAR | **Raw** value from denoised table |
| `PAIR_COUNT` | NUMBER | Count of latest triples with that status after join |
| `IS_PROVISIONAL` | BOOLEAN | **TRUE** until status taxonomy validated |

**Do not** add **hired-specific** percentage columns until **`CANDIDATE_STATUS`** validation is complete.

---

## 14. PII and governance rules

- **No `SELECT *`:** Every stage lists columns explicitly.
- **Do not expose `CRM_USER_ID`** (or any candidate identifier) in **final** aggregate tables, filenames, logs shipped to the dashboard, or BI extracts.
- **No** names, emails, phones, addresses, EEO, or sensitive attributes in pipeline outputs.
- **REFNUM allowlist:** Restrict `FACT_CRM_FITSCORE` (and joins) to **approved** tenants for each run.
- **Least privilege:** Warehouse/role appropriate for batch size; monitor scan cost.
- **Bias / audit raw tables:** Do **not** route general dashboard metrics through **`BIAS_AUDIT_*_RAW`** unless a **redacted** approved view exists.
- **Documentation:** Store **metric definitions** and **this spec version** with the job so changes are traceable.

---

## 15. Assumptions and open questions

| Topic | Assumption or open question |
|-------|-----------------------------|
| **Tie-breaking** | **OPEN:** Secondary sort if `SCORE_UPDATED_DATE` ties for a triple. |
| **Label literals** | **OPEN:** Confirm exact strings for `No Fit` and any non–A/B/C values; define **Other** handling. |
| **JSON nulls** | **OPEN:** Whether null arms are excluded from denominators or counted in an explicit bucket. |
| **Job dimensions** | **OPEN:** Confirm `JOB_TITLE` / `JOB_CATEGORY` (or equivalent) on fact vs join. |
| **Join cardinality** | **OPEN:** 0..1 vs many rows per triple on `DENOISED_HIRING_DATA`; define pick-one rules. |
| **`CANDIDATE_STATUS`** | **PENDING:** Validate full value set before **hired** or funnel KPIs. |
| **Month definition** | **ASSUMPTION:** Calendar month in UTC vs account timezone — confirm with owners. |
| **Refresh cadence** | **OPEN:** Daily vs hourly; alignment with `FACT_CRM_FITSCORE` freshness. |

---

## Cross-references

- `knowledge/fit-score-snowflake-discovery.md` — source tables, joins, historical `METRIC_FITFORMER` notes.
- `knowledge/fit-score-dashboard-spec.md` — dashboard sections and product language.
- `skills/fit-score-model-comparison-dashboard.md` — Copilot skill for metrics and governance.

---

*Document type: SQL specification for scheduled aggregation only; not executed as part of repo maintenance.*
