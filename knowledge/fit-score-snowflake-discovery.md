# Fit Score Snowflake discovery

Concise notes from exploration and validation of `DS_DB.AIDSG_DEV.METRIC_FITFORMER`. Use with `skills/snowflake-data-context.md` for broader CID / platform context.

---

## 1. Repo context

- **Repo:** `product-copilot-beta`.
- **Purpose:** Copilot / MCP configuration (skills, policies, agents, local MCP server)—**not** a frontend dashboard application.
- **Use this repo for:** Snowflake discovery, query prototyping, and documenting dashboard/report intent.
- **Do not** build a web dashboard UI in this repo.

---

## 2. Primary candidate table

**Table:** `DS_DB.AIDSG_DEV.METRIC_FITFORMER`

**Current status:**

- Best discovered table so far for **Traditional vs Fitformer / new model candidate** comparison (numeric + label on the same row).
- **Do not** refer to Fitformer as **“Gen 3”** until Fit Score or DS owners confirm naming.
- In internal working docs, use **“Fitformer / new model candidate.”**

---

## 3. Confirmed columns

These columns exist on `METRIC_FITFORMER` (as of metadata / validation pass):

| Column |
|--------|
| REFNUM |
| CRM_USER_ID |
| JOB_ID |
| STATUS_UPDATED_DATE |
| MONTH |
| QUARTER |
| YEAR |
| JOB_ZONE |
| JOB_DOMAIN |
| JOB_SEQ_NO |
| JOB_CREATED_DATE |
| ONET_CODE |
| JOB_LANGUAGE |
| BAND |
| JOB_COUNTRY |
| JOB_CATEGORY |
| IS_ACTIVE |
| FIT_SCORE |
| FIT_LABEL |
| TITLE_SCORE |
| SKILLS_SCORE |
| EXPERIENCE_SCORE |
| LOCATION_SCORE |
| FITFORMER_FIT_SCORE |
| FITFORMER_FIT_LABEL |
| FITFORMER_SCORE |
| ML_LANGUAGE |
| RECRUITER_FEATURE_ACTION |
| MC_STATUS |
| LAST_VAL |
| MAX_VAL |
| FINAL_STANDARD_ORDER |
| CANDIDATE_STATUS_STANDARD_ORDER |
| CANDIDATE_STATUS_HIRING_PROGRESSION |

_All columns are nullable in `INFORMATION_SCHEMA` for this table; the validation snapshot had no nulls in the core score/label fields._

---

## 4. Traditional vs new model candidate fields

**Traditional (comparison baseline on this table):**

- `FIT_SCORE`
- `FIT_LABEL`

**Fitformer / new model candidate:**

- `FITFORMER_FIT_SCORE`
- `FITFORMER_FIT_LABEL`
- `FITFORMER_SCORE`

**Important:**

- `FITFORMER_SCORE` is **distinct** from `FITFORMER_FIT_SCORE` (they never matched across the full row count in validation).
- Prefer comparing **`FIT_SCORE` vs `FITFORMER_FIT_SCORE`** and **`FIT_LABEL` vs `FITFORMER_FIT_LABEL`** unless DS specifies otherwise.

---

## 5. Confirmed grain and dedupe issue

Observed in `AIDSG_DEV`:

| Metric | Value |
|--------|--------|
| Total rows | **930,093** |
| Distinct `REFNUM`, `CRM_USER_ID`, `JOB_ID` | **650,916** |

Facts:

- The table is **not** one row per candidate–job pair.
- About **32.74%** of distinct triples have **multiple** rows (**213,127** triples with duplicates).
- Duplicate rows **overlap in `YEAR` / `MONTH` / `QUARTER`** (every duplicate triple had more than one calendar period in the check run)—consistent with **stacked monthly/period snapshots**, not a single current fact.
- Natural grain is closer to **`REFNUM` + `CRM_USER_ID` + `JOB_ID` + `MONTH` + `YEAR`**, possibly with **`RECRUITER_FEATURE_ACTION`** (all duplicate triples showed multiple distinct values for that dimension in the aggregate check).
- **Do not** drive dashboard KPIs from raw row counts: that **double-counts history** and **distorts** disagreement / agreement rates across models.

---

## 6. Recommended snapshot logic

- Use an explicit **as-of** rule: prefer **`YEAR DESC`, `MONTH DESC`**, and optionally **`QUARTER DESC`**, before other tie-breakers.
- For **candidate–job pair** metrics, reduce to **one row per** `REFNUM` + `CRM_USER_ID` + `JOB_ID`.
- Typical pattern: **`ROW_NUMBER()`** over `(REFNUM, CRM_USER_ID, JOB_ID)` **`ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`**.
- **`STATUS_UPDATED_DATE` alone is not a reliable snapshot key:** for most duplicate triples, all duplicate rows shared the same timestamp; only a handful of triples had multiple distinct timestamps among duplicates.
- **Confirm** authoritative snapshot and tie-break rules **with DS / Fit Score owners** before production logic.

---

## 7. Score labels found

**`FIT_LABEL` (non-null distribution in validation snapshot):**

- A
- B
- C
- No Fit

**`FITFORMER_FIT_LABEL`:**

- A
- B
- C
- No Fit

**Important:**

- Strings such as “Incomplete Job,” “Incomplete Profile,” “Unsupported Language,” and “Doesn’t Exist” **did not appear** as label values in this table under basic substring checks.
- Report / dashboard **label taxonomies** should still allow those values if product can emit them elsewhere; for **this** table, expect **A / B / C / No Fit** only unless new pipelines add more.

---

## 8. Product language rules

Avoid misleading claims:

- Do **not** call this an **“accuracy”** dashboard.
- Do **not** claim the Fitformer / new model candidate is **“more accurate.”**

Prefer neutral analytics language:

- Score **distribution**
- **Model behavior comparison**
- **Score separation**
- **Model selectivity** (e.g., share in “No Fit” or A/B/C buckets)
- **Score movement** (with clear as-of / snapshot rules)

- **Hire alignment** only as a **proxy**, and only if outcome field definitions are validated with data owners.

When comparing two percentages, use **percentage point delta** (difference of percentages), not loose “percent improvement” language.

---

## 9. PII and governance cautions

- Do **not** include **`CRM_USER_ID`** in stakeholder-facing extracts.
- Do **not** select candidate **names, emails, phones, EEO, gender, race, ethnicity**, or other sensitive attributes.
- **`DS_DB.AIDSG_PROD.BIAS_AUDIT_FITFORMER_RAW`** (and similar bias-audit tables) carry **sensitive dimensions**—do **not** use for general dashboards without a **governed or redacted view**.
- **`AIDSG_DEV`** data must **not** be used for **executive or customer** reporting until **production parity** and **approvals** are explicit.

---

## 10. Recommended next SQL query

Safe **pattern** for a latest-snapshot confusion-style summary (add `WHERE REFNUM IN (...)` with an approved tenant list). Adjust warehouse, role, and predicates for cost control.

**Step 1 — latest row per candidate–job triple**

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
  /* WHERE REFNUM IN (...)  -- governance: approved tenants only */
),
latest AS (
  SELECT * FROM ranked WHERE rn = 1
),
```

**Step 2 — cell counts for `FIT_LABEL` (rows) × `FITFORMER_FIT_LABEL` (columns)**

Aggregate from `latest`, then compute row totals, column totals, and **A+B** buckets:

- **A+B** (traditional): rows where `FIT_LABEL` in `('A','B')`.
- **A+B** (Fitformer): rows where `FITFORMER_FIT_LABEL` in `('A','B')`.
- **No Fit** shares: `FIT_LABEL = 'No Fit'` vs `FITFORMER_FIT_LABEL = 'No Fit'`.

**Percentage point delta (example):**

- `pct_trad_ab := 100.0 * COUNT_IF(FIT_LABEL IN ('A','B')) / NULLIF(COUNT(*),0)`
- `pct_ff_ab  := 100.0 * COUNT_IF(FITFORMER_FIT_LABEL IN ('A','B')) / NULLIF(COUNT(*),0)`
- **A+B delta (percentage points):** `pct_ff_ab - pct_trad_ab`

Similarly for **No Fit**:

- `pct_trad_nf` vs `pct_ff_nf`; **delta:** `pct_ff_nf - pct_trad_nf`

**TOTAL row:** `COUNT(*)` on `latest` for the filtered population.

Report as a small **matrix + margin totals** (counts and **% of total**); footnote the **dedupe / as-of** rule and **DEV environment** until promoted.

---

## Prototype result: CIGNUS

Internal prototype only **`REFNUM = CIGNUS`** on **`DS_DB.AIDSG_DEV.METRIC_FITFORMER`**. Do **not** map this **`REFNUM`** to a customer or **company name.** No **candidate-level identifiers** or PII appear here.

### 1. Query status

- Queries completed **successfully** (distribution Query 1 + headline Query 2, as documented above).
- Population was **non-zero**.
- **82,640** deduped **candidate–job pairs** after latest-snapshot logic: `ROW_NUMBER()` over `(REFNUM, CRM_USER_ID, JOB_ID)` `ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`, keep `rn = 1`.

### 2. Distribution comparison table

| Label | Traditional Count | Traditional % | Fitformer Count | Fitformer % |
|-------|------------------:|--------------:|----------------:|------------:|
| A | 4,308 | 5.21 | 11,587 | 14.02 |
| B | 32,303 | 39.09 | 20,870 | 25.25 |
| C | 24,728 | 29.92 | 16,338 | 19.77 |
| No Fit | 21,301 | 25.78 | 33,845 | 40.95 |
| TOTAL | 82,640 | 100.00 | 82,640 | 100.00 |
| A+B | 36,611 | 44.30 | 32,457 | 39.28 |

_Fitformer column = **Fitformer / new model candidate** (not “Gen 3” until owners confirm)._

### 3. Headline metrics

- `candidate_job_pairs_compared`: **82,640**
- `traditional_ab_pct`: **44.30**
- `fitformer_new_model_ab_pct`: **39.28**
- `ab_pct_point_delta`: **-5.03**
- `traditional_no_fit_pct`: **25.78**
- `fitformer_new_model_no_fit_pct`: **40.92**
- `no_fit_pct_point_delta`: **15.15**

### 4. Product-safe interpretation

On 82,640 latest-snapshot candidate-job pairs, the Fitformer / new model candidate shows a more selective distribution than the traditional model. A+B concentration decreases by about 5.03 percentage points, while No Fit classification increases by about 15.15 percentage points. This suggests stronger score separation and a stricter allocation of candidates into lower-fit buckets. This is not an accuracy claim and should remain exploratory until DS/Fit Score owners confirm model semantics, production parity, and dedupe logic.

### 5. Dashboard implications

- The query can support **KPI cards**.
- The query can support a **Traditional vs Fitformer** distribution table.
- The query can support **A+B** and **No Fit** delta visualizations.
- The query can support a **product-facing dashboard prototype** (internal / product design), not a customer deliverable by default.
- It should **not** be **customer-facing** until **Fitformer naming**, **production table** (vs `AIDSG_DEV`), and **snapshot / dedupe** logic are approved.

---

## Related objects (brief)

- **`CID.RAW_SCHEMA`** has rich fit events and metadata (`FACT_CRM_FITSCORE`, `RB_FITSCORE_METADATA`, etc.) for alternative or joined analysis—see `skills/snowflake-data-context.md`.
- **`SNOWFLAKE.ACCOUNT_USAGE`** was not authorized in the discovery session; discovery used `INFORMATION_SCHEMA` and targeted aggregates.

---

*Includes internal prototype run for `REFNUM = CIGNUS` on `AIDSG_DEV.METRIC_FITFORMER`; not for customer or executive use without DS/Fit Score sign-off.*
