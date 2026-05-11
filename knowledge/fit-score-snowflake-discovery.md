# Fit Score Snowflake discovery

Notes for Fit Score **Traditional vs Gen 3 (LLM FitScore arm)** analytics. Use with `skills/snowflake-data-context.md` for broader CID / platform context.

---

## 1. Repo context

- **Repo:** `product-copilot-beta`.
- **Purpose:** Copilot / MCP configuration (skills, policies, agents, local MCP server)—**not** a frontend dashboard application.
- **Use this repo for:** documenting sources, grain, joins, and dashboard/report intent.
- **Do not** build a web dashboard UI in this repo.

---

## 2. Authoritative source (engineering confirmed)

| Item | Detail |
|------|--------|
| **Main table** | `PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE` |
| **Gen 3** | **LLM FitScore arm** — *not* Fitformer; do **not** use `DS_DB.AIDSG_DEV.METRIC_FITFORMER` for Gen 3. |
| **Gen 2** | **Fitformer** (legacy / separate pipeline). |
| **Payload** | Use the **`fitscore_with_feedback`** JSON object on the fact row. |

**Label fields (string):**

| Arm | Expression |
|-----|------------|
| **Gen 3 (LLM)** | `parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING` |
| **Traditional** | `parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING` |

**Numeric score fields:**

| Arm | Expression |
|-----|------------|
| **Gen 3 (LLM)** | `parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore` |
| **Traditional** | `parse_json(fitscore_with_feedback):armScores.traditional.fitscore` |

Pairing identity for deduplication and joins: **`REFNUM`**, **`CRM_USER_ID`**, **`JOB_ID`**.

---

## 3. Latest score per candidate–job pair

Engineering-confirmed **latest row** logic:

```sql
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
  ORDER BY SCORE_UPDATED_DATE DESC
) = 1
```

Use this (not ad hoc `YEAR`/`MONTH` ordering on other tables) as the default **one row per** `(REFNUM, CRM_USER_ID, JOB_ID)` rule for `FACT_CRM_FITSCORE` unless owners publish a different tie-breaker.

---

## 4. Progression and candidate status

| Item | Detail |
|------|--------|
| **Table** | `SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA` |
| **Join to fit fact** | **`REFNUM`** + **`JOB_ID`** + **`CRM_USER_ID`** |
| **Status field** | **`CANDIDATE_STATUS`** (available from `DENOISED_HIRING_DATA`) |

**Hired metrics:** use **`CANDIDATE_STATUS = 'HIRED'`** only **after** validating exact allowed values in `DENOISED_HIRING_DATA` (case, spelling, and synonym rows). Until that validation is done, treat hire-related cuts as **provisional** and document assumptions in any report footnote.

---

## 5. Dashboard data architecture

- **Do not** depend on **live Snowflake queries from the dashboard UI** for these KPIs at scale.
- **Preferred pattern:** **scheduled aggregation** in the **`usage-metrics` repo** (or equivalent pipeline), materializing metrics the UI reads from **pre-aggregated** stores or APIs the pipeline owns.
- Ad hoc Snowflake in Copilot or notebooks remains useful for **discovery** and **SQL validation**, not as the production serving path described in the product spec.

---

## 6. Score labels and taxonomies

Expect the same **A / B / C / No Fit** style vocabulary where product emits standard labels; **confirm** live distributions on `FACT_CRM_FITSCORE` after parsing JSON. Allow for **Other** or expanded label sets if pipelines add values.

---

## 7. Product language rules

Avoid misleading claims:

- Do **not** call this an **“accuracy”** dashboard.
- Do **not** claim Gen 3 (LLM arm) is **“more accurate”** without agreed outcome definitions.

Prefer neutral analytics language:

- Score **distribution**
- **Model behavior comparison** (Traditional vs LLM arm)
- **Score separation**
- **Model selectivity** (e.g., share in “No Fit” or A/B/C buckets)
- **Score movement** (with clear latest-row / snapshot rules)

- **Hire alignment** only as a **proxy**, and only after **`CANDIDATE_STATUS`** (and hire definition) is validated on `DENOISED_HIRING_DATA`.

When comparing two percentages, use **percentage point delta** (difference of percentages), not loose “percent improvement” language.

---

## 8. PII and governance cautions

- Do **not** include **`CRM_USER_ID`** in stakeholder-facing extracts.
- Do **not** select candidate **names, emails, phones, EEO, gender, race, ethnicity**, or other sensitive attributes.
- **`DS_DB.AIDSG_PROD.BIAS_AUDIT_FITFORMER_RAW`** (and similar bias-audit tables) carry **sensitive dimensions**—do **not** use for general dashboards without a **governed or redacted view**.
- Scope production reporting with **`WHERE REFNUM IN (...)`** (or equivalent) and approved warehouse/role discipline.

---

## 9. Recommended SQL pattern (illustrative)

Safe **shape** for pair-level analytics (add governance filters and avoid broad scans). **Not** executed as part of this doc maintenance.

```sql
SELECT
  REFNUM,
  JOB_ID,
  /* CRM_USER_ID: keep internal / join only; omit from stakeholder exports */
  parse_json(fitscore_with_feedback):armScores.traditional.fit::STRING AS trad_label,
  parse_json(fitscore_with_feedback):armScores.llmFitScore.fit::STRING AS gen3_label,
  parse_json(fitscore_with_feedback):armScores.traditional.fitscore AS trad_fitscore,
  parse_json(fitscore_with_feedback):armScores.llmFitScore.fitscore AS gen3_fitscore
FROM PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE
WHERE REFNUM IN (/* approved tenants */)
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY REFNUM, CRM_USER_ID, JOB_ID
  ORDER BY SCORE_UPDATED_DATE DESC
) = 1
;
```

Join to progression when needed:

```sql
/* Conceptual join — adjust SELECT lists for PII policy */
FROM latest_fitscores f
JOIN SPX_DB.FEEDBACK_SCHEMA.DENOISED_HIRING_DATA h
  ON f.REFNUM = h.REFNUM
 AND f.JOB_ID = h.JOB_ID
 AND f.CRM_USER_ID = h.CRM_USER_ID
```

---

## 10. Historical discovery only — `METRIC_FITFORMER` (**invalid for Gen 3**)

> **⚠️ Deprecated for current product path:** **`DS_DB.AIDSG_DEV.METRIC_FITFORMER` must not be used as the source for Gen 3 (LLM FitScore arm).**  
> **Fitformer is Gen 2.** Gen 3 comparisons belong on **`FACT_CRM_FITSCORE`** and **`fitscore_with_feedback`** as above.

The material below is **retained only** as a record of earlier exploration on **`METRIC_FITFORMER`**. Do **not** map its **Fitformer** columns to **Gen 3** naming.

### 10.1 Prior primary candidate table (historical)

**Table:** `DS_DB.AIDSG_DEV.METRIC_FITFORMER`

Previously documented as a table with **Traditional vs Fitformer** numeric + label columns on the same row. That comparison is **Gen 2-era**, not the LLM arm.

### 10.2 Historical columns (metadata snapshot)

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

### 10.3 Historical field mapping (Fitformer = Gen 2 only)

- **Traditional (on that table):** `FIT_SCORE`, `FIT_LABEL`
- **Fitformer (Gen 2):** `FITFORMER_FIT_SCORE`, `FITFORMER_FIT_LABEL` (and related columns)

`FITFORMER_SCORE` was **distinct** from `FITFORMER_FIT_SCORE` in past validation.

### 10.4 Historical grain / dedupe notes (`METRIC_FITFORMER`)

The table was **not** one row per candidate–job pair; duplicates stacked by period dimensions. Earlier prototyping used **`ROW_NUMBER()`** over **`(REFNUM, CRM_USER_ID, JOB_ID)`** with **`ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`**. **That logic applies to the old table only,** not to the authoritative **`FACT_CRM_FITSCORE`** latest-row rule in §3.

### 10.5 Archived prototype: CIGNUS on `METRIC_FITFORMER`

Internal prototype only **`REFNUM = CIGNUS`** on **`DS_DB.AIDSG_DEV.METRIC_FITFORMER`**. **Do not** map this **`REFNUM`** to a customer or **company name.** **Historical / Gen 2 table only** — **invalid for Gen 3** LLM arm analytics.

#### Query status (archived)

- Queries completed successfully (distribution + headline aggregates).
- **82,640** deduped **candidate–job pairs** after legacy snapshot logic: `ROW_NUMBER()` over `(REFNUM, CRM_USER_ID, JOB_ID)` `ORDER BY YEAR DESC, MONTH DESC, STATUS_UPDATED_DATE DESC`, keep `rn = 1`.

#### Distribution comparison table (Fitformer = Gen 2; archival)

| Label | Traditional Count | Traditional % | Fitformer Count | Fitformer % |
|-------|------------------:|--------------:|----------------:|------------:|
| A | 4,308 | 5.21 | 11,587 | 14.02 |
| B | 32,303 | 39.09 | 20,870 | 25.25 |
| C | 24,728 | 29.92 | 16,338 | 19.77 |
| No Fit | 21,301 | 25.78 | 33,845 | 40.95 |
| TOTAL | 82,640 | 100.00 | 82,640 | 100.00 |
| A+B | 36,611 | 44.30 | 32,457 | 39.28 |

#### Headline metrics (archival)

- `candidate_job_pairs_compared`: **82,640**
- `traditional_ab_pct`: **44.30**
- `fitformer_new_model_ab_pct`: **39.28**
- `ab_pct_point_delta`: **-5.03**
- `traditional_no_fit_pct`: **25.78**
- `fitformer_new_model_no_fit_pct`: **40.92**
- `no_fit_pct_point_delta`: **15.15**

#### Archived interpretation note

On 82,640 legacy-snapshot pairs, **Fitformer (Gen 2)** showed a more selective distribution than traditional on **this DEV table**. This is **not** comparable to **Gen 3 (LLM arm)** on **`FACT_CRM_FITSCORE`** and is **not** an accuracy claim.

---

## Related objects (brief)

- **`CID.RAW_SCHEMA`** and related objects may still matter for broader fit-event context—see `skills/snowflake-data-context.md`.
- Production analytics for the Model Comparison dashboard should align with **`FACT_CRM_FITSCORE`** + **`usage-metrics`** aggregation per §5.

---

*Gen 3 source of truth: `PROD_DB.EXTERNAL_SCHEMA.FACT_CRM_FITSCORE` + `fitscore_with_feedback`. `METRIC_FITFORMER` is historical / Gen 2 only.*
