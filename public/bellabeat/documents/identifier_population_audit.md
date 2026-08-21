# Identifier and population audit

## Conclusion

The Bellabeat case materials state that **30 Fitbit users consented to provide tracker data**. The validated analytical files contain **35 unique export/session identifiers** and **1,935 observed session-days**. No authoritative field maps those identifiers to the 30 consenting users, so the number of underlying people represented in the usable files is **not verifiable**.

The audit found no confirmed duplicate export block across different session identifiers. The identifier issue therefore changes interpretation and inference more than the validated daily/hourly grain. It does not justify merging identifiers, and it does not establish 35 independent people.

## What is verified

| Statement | Status | Evidence |
|---|---|---|
| Case materials describe 30 consenting users | Case-description fact | User-supplied case context |
| Analytical activity files contain 35 unique session identifiers | Verified | `fitbit_clean.activity_minute` and `fitbit_analytics.analysis_daily` |
| Analytical activity files contain 1,935 observed session-days | Verified | Unique `session identifier, activity date` rows |
| One identifier can persist across source periods | Verified | 32 activity, 22 sleep, 13 heart-rate, and 6 weight identifiers occur in both source periods |
| A session identifier maps one-to-one to a consenting user | Not verified | No authoritative linkage field or source rule |
| The usable files represent exactly 30 underlying people | Not verifiable | Session-to-user mapping is absent |
| The 35 session identifiers are 35 independent people | Not supported | Export/session semantics and unknown person-level clustering |

## Identifier behavior by feature

| Feature | Earlier-period identifiers | Later-period identifiers | Combined identifiers | In both periods | In one period only |
|---|---:|---:|---:|---:|---:|
| Activity, steps, calories, intensity, METs | 34 | 33 | 35 | 32 | 3 |
| Sleep | 23 | 24 | 25 | 22 | 3 |
| Heart rate | 14 | 14 | 15 | 13 | 2 |
| Weight | 11 | 8 | 13 | 6 | 7 |

All 35 activity session identifiers have steps, calories, intensity, MET, and supplied daily-distance presence. Sleep covers 25, heart rate 15, and weight 13. Thirteen heart-rate identifiers also have sleep; five heart-rate identifiers have weight; nine sleep identifiers have weight. Feature absence is therefore selective and must not be treated as a complete absence of the underlying behavior.

## Source-overlap and duplicate handling

The prepared clean tables removed **10,500 activity-minute rows** and **4,300 sleep-minute rows** duplicated at the two-period boundary under the **same session identifier**. This is a verified repeated-export boundary issue already handled by the validated cleaning pipeline. It is not evidence that two different identifiers belong to one person.

Across 592 pairs of different session identifiers with at least one overlapping activity date:

- exact full minute-sequence matches: **0 session-days**;
- exact daily-summary matches across steps, calories, active minutes, and average METs: **0 session-days**;
- near-daily-summary matches under the predeclared tolerances: **10 session-days across four pairs**, with no pair exceeding 6.5% of its overlapping dates;
- exact calorie sequences: **0 session-days**;
- exact step sequences: **615 session-days**, all of which were all-zero step sequences;
- exact intensity sequences: **598 session-days**, all of which were zero-active-minute sequences;
- exact MET sequences: **502 session-days**;
- exact cross-session sleep-log sequences or shared sleep log IDs: **0 pairs**;
- exact cross-session weight records: **0 pairs**.

The zero-heavy step, intensity, and MET matches are common empty-activity patterns. Because calories and full records do not match, these are behavioral/data-pattern similarities, not duplicated export blocks. Twelve weight-session pairs reuse a log ID, but none has matching content; the weight `log_id` is therefore not globally unique and cannot establish duplication or identity.

Within a session, 100 staged weight rows reduce to 98 unique `(session identifier, log ID)` records after two exact cross-period boundary duplicates. Those 98 records occupy 98 unique session-days. The distinction changes the two-largest-session concentration from the rounded legacy treatment of 77% of staged rows to **76.5% of unique records**; it does not change the feature-presence and cadence-only decision.

## Pseudoreplication and weighting risk

The 1,935 session-days are repeated observations, not independent people. The 35 session identifiers are also not known to be independent people. Session-level bootstrap resampling, within-session centering, and leave-one-session-out checks address repeated rows within a session but cannot account for unknown clustering of multiple sessions within the same person. Their intervals may therefore be optimistic for person-level inference.

Step estimates remain directionally stable across defensible session-neutral weightings:

| Estimator | Mean daily steps |
|---|---:|
| Pooled observed session-days | 7,200 |
| Equal weight per session identifier | 6,857 |
| Equal weight per calendar date | 7,196 |
| Complete 1,440-minute session-days only | 7,280 |
| Session identifiers with at least 14 activity days | 7,204 |

The pooled leave-one-session-out range is **6,890–7,372 steps**. A conservative stress test that removes any five session identifiers produces a much wider **5,971–8,055** range. That stress test is not a reconstructed 30-user estimate; it shows how strongly an unknown five-session dependency could affect a headline mean.

## Implications for inference

- Daily and hourly calculations remain valid at the observed session-day or session-hour grain.
- Within-session relationships remain descriptive of variation inside an export/session record, not necessarily inside a unique person across all exports.
- Between-session correlations, concentration shares, clustering, counts of higher/lower weekend patterns, and session bootstrap intervals must not be promoted to person-level prevalence.
- No session identifiers are merged or dropped on behavioral similarity.
- Marketing recommendations remain hypotheses for testing on current production telemetry, not claims about 30 or 35 independent people.

## Reproducible evidence

- SQL: `sql/qa/21_identifier_coverage.sql` through `sql/qa/25_duplicate_sleep_weight.sql`
- Query results: `reports/analysis/data/audit_21_identifier_coverage.csv` through `audit_25_duplicate_sleep_weight.csv`
- Weight row-unit audit: `sql/qa/34_weight_log_units.sql` and `reports/analysis/data/audit_34_weight_log_units.csv`
- Calculations: `scripts/revise_identifier_analysis.py`
- Executed notebook: `notebooks/fitbit_identifier_revision_audit.ipynb`
