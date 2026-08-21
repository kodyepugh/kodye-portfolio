# Methodology appendix

## Scope and decision frame

This revision tests whether corrected export/session-identifier semantics and omitted feature families materially change the existing Bellabeat Fitbit wellness-behavior analysis. The decision is whether to retain the validated base and revise selected findings, or rebuild the analysis completely.

The unit of evidence is an observed session profile, session-day, session-hour, log, or timestamp. The analysis does not infer or reconstruct the unknown mapping from 35 session identifiers to the 30 consenting users named in the case materials.

## Sources, grains, and current fitness

| Table | Grain | Rows | Session identifiers | Role |
|---|---|---:|---:|---|
| `fitbit_clean.activity_minute` | session identifier, minute | 2,760,120 | 35 | Validated activity source of truth |
| `fitbit_clean.sleep_minute` | session identifier, log, minute | 382,780 | 25 | Validated sleep source of truth |
| `fitbit_clean.stg_heartrate_seconds` | session identifier, timestamp | 3,638,339 | 15 | Preserved staged source with exact boundary duplicates |
| `fitbit_clean.heart_rate_seconds` | session identifier, timestamp | 3,614,915 | 15 | Validated clean source for bounded non-medical appendix work |
| `fitbit_clean.stg_weight` | session identifier, log | 100 | 13 | Cadence and feature-data presence only |
| `fitbit_analytics.hourly_activity` | session identifier, hour | 46,002 | 35 | Time-of-day analysis |
| `fitbit_analytics.daily_activity` | session identifier, date | 1,935 | 35 | Daily activity analysis |
| `fitbit_analytics.daily_sleep` | session identifier, sleep-end date | 832 | 25 | Daily sleep analysis |
| `fitbit_analytics.analysis_daily` | session identifier, activity date | 1,935 | 35 | Fan-out-safe activity/sleep join |

The identifier, feature-coverage, analytical-revision, and QA queries were read-only against the protected `fit-pathway-496419-r7.fitbit_data` source dataset. The only approved BigQuery mutation in the finalization work was the deterministic creation or replacement of `fit-pathway-496419-r7.fitbit_clean.heart_rate_seconds`. No protected `fitbit_data` source table was modified.

## Metric definitions

- **Steps:** validated minute steps summed by session identifier-day.
- **Calories:** validated minute device estimates summed by session identifier-day; cross-session interpretation is limited because undisclosed device or personal inputs may contribute.
- **Active minutes:** counts of lightly, fairly, and very active minute classes.
- **Selected sedentary minutes:** timestamp-aligned sedentary minutes after subtracting timestamp-overlapping recorded sleep; raw sedentary minutes and the sleep-end-date assignment remain sensitivity definitions.
- **METs:** `mets_raw / 10`; daily `average_mets` averages the normalized minute values over observed minutes.
- **Sleep duration:** recorded minutes asleep divided by 60 and assigned to sleep end date.
- **Sleep efficiency:** `100 × minutes asleep / minutes in bed`.
- **Complete activity session-day:** exactly 1,440 observed activity-minute rows.
- **Recording coverage:** observed rows and dates, not confirmed wear, app/device engagement, retention, satisfaction, or motivation.

## Join validation

Before this revision, the validated pipeline established unique `session identifier, date` keys for daily activity and sleep, a one-to-zero-or-one daily join, 1,935 activity rows before and after joining, and no fan-out. The revision uses those tables without rematerializing or replacing them.

Duplicate-export audits do not join on behavioral similarity. They compare exact same-date minute-sequence hashes and bounded daily-summary tolerances across different session identifiers. Similarity is reported separately from exact duplication.

## Eligibility thresholds

- Longitudinal activity summaries: at least 14 observed activity session-days.
- Paired weekday/weekend activity: at least 10 weekday and 4 weekend observed session-days.
- Paired weekday/weekend sleep: at least 5 weekday, 3 weekend, and 10 total sleep session-days.
- Existing within-session sleep summaries: at least 10 sleep days when an estimate requires a session-specific relationship.
- Heart-rate exploratory eligibility: clean unique timestamps are available; a bounded appendix should require a prespecified minimum day/hour threshold and retain an “insufficient evidence” state. Thirteen session identifiers have at least 14 observed heart-rate days.
- Clustering review: 34 session identifiers with at least 14 activity days; candidate solutions with a group smaller than four are rejected as too granular.

## Statistical methods

- Pooled session-day and equal-session descriptive estimates are reported separately.
- Within-session correlations center each measure on its session mean.
- Between-session correlations use session-level means.
- Existing session-level bootstrap intervals resample session identifiers and are explicitly limited by unknown person-level clustering.
- Leave-one-session-out ranges test influence of a single session identifier.
- Complete-day sensitivity restricts activity measures to 1,440-minute days.
- The five-session omission stress range does not posit a user mapping; it measures worst-case influence when five session identifiers are removed.
- Paired weekend sleep uses one weekend-minus-weekday mean difference per eligible session identifier and a session-bootstrap interval.
- MET redundancy uses linear prediction from steps, calories, intensity-minute components, and selected sedentary time with grouped five-fold validation by session identifier.
- Segmentation checks include feature correlation, `k=2,3,4` silhouette, 25 random seeds, leave-one-session-out stability, correlated-feature removal, and MET addition.

## Sensitivity results retained

- Mean steps: pooled 7,200; equal session 6,857; equal date 7,196; complete-day 7,280.
- Complete-day within-session correlations: steps–active minutes `r=0.819`; steps–calories `r=0.868`; steps–selected sedentary `r=-0.527`.
- Complete-day sleep lag checks: prior-night sleep to activity `r=-0.134`; prior activity to same-night sleep `r=0.023`.
- Paired sleep weekend difference: mean `+0.70` hours, median `+0.32`, session-bootstrap 95% interval `+0.27 to +1.19`, across 19 eligible session identifiers.
- MET normalization maximum absolute difference from raw/10: below `0.000000001`.
- MET redundancy: grouped five-fold mean `R²=0.935`; adding METs to reduced clustering lowers silhouette from `0.447` to `0.238` and changes assignments materially.

## Feature-readiness decisions

- Heart rate is clean and validated for a bounded exploratory appendix, not the main wellness conclusions. The clean schema is `profile_id INT64`, `measured_at DATETIME`, `heart_rate_bpm INT64`, source lineage, `source_duplicate_count INT64`, and `invalid_heart_rate BOOL`, at unique session-identifier/timestamp grain. The approved transformation removed 23,424 exact cross-period boundary rows and produced 3,614,915 rows across 15 session identifiers, 469 session-days, and 8,499 session-hours. All eight post-build checks passed: row and source reconciliation, 15-session preservation, key uniqueness, required nulls, range flags, and retained 36–203 BPM bounds. All 469 heart-rate days overlap an activity day and 8,489 heart-rate hours overlap an activity hour, but 1,539 of those hours have zero steps, so heart-rate presence cannot verify wear. Median positive sampling intervals vary among 3, 5, and 10 seconds; 1,114 internal gaps exceed five minutes and 399 exceed one hour. Covered sessions differ descriptively from uncovered sessions (equal-session mean steps 7,753 versus 6,185). The 469-row daily extract prepares coverage, observed quantiles, mean, extrema, and variability metrics; p10 is a lower-observed decile and not resting heart rate. Prespecified coverage eligibility, movement/time-of-day adjustment, selection-bias framing, and explicit non-medical language remain mandatory.
- Weight is limited to feature presence and cadence: 100 staged source rows reduce to 98 unique session/log records after removing two exact cross-period boundary duplicates. Thirteen sessions have any unique record, seven have at least two, three have at least five, and two have at least ten. Four sessions span at least 30 days, while six contain a single unique record. The two largest sessions account for 76.5% of unique records; their cadence is approximately daily, while other repeated sessions have median intervals from 1 to 17 days. The cadence thresholds are unchanged by deduplication, so the marketing conclusion remains unchanged. These records do not support longitudinal weight change or activity-to-weight analysis.
- Body fat is excluded: four usable values across three session identifiers; 96% missing.
- Distance is excluded: no validated minute-level lineage and material earlier-period coverage misalignment.

## Query safety and cost accounting

All revision SQL was dry-run successfully before read-only execution. The initial nine-query audit estimated **1,587,108,742 bytes** and **$0.00902167**. Four corrected queries were dry-run again before rerun, estimating **1,164,812,764 bytes** and **$0.00662119**. Total estimated processing for the executed revision passes was **2,751,921,506 bytes** and **$0.01564286** at `$6.25/TiB`, before free-tier or capacity effects.

The complete SQL is preserved under `sql/qa/21_identifier_coverage.sql` through `sql/qa/29_distance_audit.sql`; bounded outputs are under `reports/analysis/data/audit_*.csv`.

The approved heart-rate cleaning run on 2026-08-04 separately processed 1,881,902,722 bytes across the repeated audits, duplicate/preflight checks, clean-table build, post-build QA, clean readiness audit, and daily extract—approximately `$0.01069738` at `$6.25/TiB`. The transformation SQL is `sql/clean/heart_rate_seconds.sql`; validation is in `sql/qa/30_heart_rate_duplicate_lineage.sql` through `sql/qa/33_heart_rate_clean_readiness.sql`, with the execution record in `reports/execution/heart_rate_cleaning_20260804.json`.

## Unresolved limitations

- No authoritative session-to-user mapping exists.
- Session-level resampling cannot account for unknown multiple sessions per person.
- Timestamps have no verified timezone.
- Recording presence does not verify wear or product engagement.
- Heart rate is clean, but selective coverage, sampling gaps, unverified timezone, and missing age/health context limit it to bounded non-medical exploration.
- Sleep and weight coverage are selective.
- The eight legacy figures were reviewed and subsequently rebuilt, replaced, or retired. Ten canonical figures now pass final QA; this remediation is complete.
- The portable HTML passed artifact validation, packaging, rendered interaction, responsive, fallback, and print QA. Results are recorded in `browser_qa.md`.
