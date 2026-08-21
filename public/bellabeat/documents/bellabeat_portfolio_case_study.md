# Bellabeat Wellness-Behavior Analysis: From Public Fitbit Files to Testable App Strategy

**Portfolio case study | Kodye Pugh | August 2026**

This case study shows how I turned a public, historical Fitbit export into a controlled session-level analysis and a set of testable product hypotheses for the Bellabeat app.

> **Essential interpretation boundary.** The case materials describe 30 consenting Fitbit users, while the analytical files contain 35 export/session identifiers. No authoritative session-to-user mapping exists. I treat those identifiers as session profiles, not verified people. The results describe recorded session-level behavior, are not estimates from 35 independent users, and are not representative of Bellabeat customers.

## Executive Summary

Bellabeat asked how smart-device usage trends could inform its marketing strategy. I focused the answer on the Bellabeat app because it is the shared feedback and engagement layer across the product ecosystem. The analysis supports three product directions: make progress personal, make small amounts of movement feel worthwhile, and let customers shape the timing of routines. Each direction is a hypothesis for a consented Bellabeat experiment, not a causal conclusion from the Fitbit export.

The strongest evidence concerns recorded movement. Across 1,935 observed session-days, daily steps averaged 7,200 and had a median of 6,835. Alternative weighting choices produced similar central estimates: 6,857 with equal session weighting, 7,196 with equal date weighting, and 7,280 on complete 1,440-minute days. Light activity supplied 84.9% of recorded active minutes. Within sessions, steps were strongly associated with active minutes (`r=0.824`) and moderately inversely associated with selected sedentary minutes (`r=-0.427`). These patterns make personal baselines and approachable movement the most defensible starting points.

Routine evidence argues against one universal schedule. Adequately observed session profiles peaked at different hours from 06:00 through 20:00, and weekend activity divided evenly: 17 eligible sessions were higher and 17 were lower than their weekday average. A separate session-by-date heatmap shows changing activity trajectories and missing dates; it does not visualize hourly behavior. Together, the results support preference-aware timing and adaptive weekday/weekend routines.

The analysis also sets clear limits. Prior activity had essentially no within-session relationship with same-night recorded sleep (`r=0.024`). Sleep, heart rate, and weight were available for smaller and selective subsets; body fat and distance were excluded from validated findings. A fixed clustering taxonomy was retired after reduced-feature assignments changed sharply (`ARI=0.084`) and produced a group of only three sessions. Bellabeat should use continuous personal baselines rather than assigning customers to fixed behavioral identities.

The recommended next step is a sequenced product test, supported by first-party telemetry. Bellabeat should first measure app use, sync status, device state, delivery, and feature exposure so recording gaps are not misread as disengagement. It can then test personal-progress feedback, light-movement content, and customer-controlled timing with explicit outcome metrics and guardrails. Sleep feedback should remain descriptive and optional until current, representative product evidence supports more.

## Table of Contents

- [Business Context and Analytical Objective](#business-context-and-analytical-objective)
- [From Public Source Files to Analytical Data](#from-public-source-files-to-analytical-data)
- [Analytical Approach and Quality Controls](#analytical-approach-and-quality-controls)
- [Findings and Business Implications](#findings-and-business-implications)
- [Strategic Recommendations](#strategic-recommendations)
- [Measurement and Next Steps](#measurement-and-next-steps)
- [Limitations](#limitations)
- [Technical and Reproducibility Appendix](#technical-and-reproducibility-appendix)

## Business Context and Analytical Objective

Bellabeat is a wellness technology company founded by Urška Sršen and Sando Mur. In the case scenario, its portfolio includes the Bellabeat app, Leaf tracker, Time watch, Spring smart water bottle, and a membership program. These products help customers understand activity, sleep, stress, hydration, mindfulness, and other daily habits. The stated audience is women seeking greater understanding of their health and wellness.

The historical Fitbit export contains no reliable sex, gender, age, or other demographic fields. I therefore did not attempt to describe women-specific behavior, infer demographic identity, or claim that the observed sessions represent Bellabeat's audience. I used the export only to identify product hypotheses that Bellabeat could test with current, consented, and appropriately representative customers.

### The decision to support

The practical question was: **Which recorded behavior patterns are reliable enough to shape Bellabeat app content and lifecycle experiments, and what evidence would be needed before scaling them?** That framing required both analytical discipline and product restraint. A useful result had to connect observed behavior to a decision, preserve the distinction between association and causation, and name the telemetry and experiment that would determine whether an idea works.

I selected the Bellabeat app as the product focus because it is where device data can become understandable feedback, user-controlled prompts, feature education, and routines. The analysis can therefore inform four business levers:

1. **Product engagement:** helping customers interpret change relative to their own recent baseline.
2. **Lifecycle communication:** delivering reminders or summaries at customer-controlled times.
3. **Feature education:** making optional wellness features discoverable without implying that missing data means disengagement.
4. **Retention learning:** testing whether relevant, low-pressure feedback improves return behavior without increasing fatigue or opt-outs.

The analysis does not estimate campaign return, customer lifetime value, subscription conversion, clinical outcomes, or causal product impact. The export contains no Bellabeat account events, campaign exposure, notification delivery, device state, or outcome labels. Those questions require first-party product data and prospective experiments.

### Decision Scope

The analysis helps Bellabeat decide which low-risk app hypotheses merit current testing. Each recommendation is traceable to observed evidence, supported by the telemetry needed to define exposure and eligibility, and paired with a measurable outcome and explicit guardrails.

Evidence readiness also determines product scope. Broad movement evidence can support prioritized experiments; selective or unstable evidence should guide instrumentation, consent, and future research rather than be presented as a finished customer insight.

### Stakeholders and accountability

The official case-study stakeholders are Urška Sršen, Bellabeat cofounder and Chief Creative Officer; Sando Mur, cofounder and a member of the executive team; and the Bellabeat marketing analytics team. Product management, lifecycle marketing, data engineering, privacy, design, and customer research are reasonable implementation partners, but they are inferred roles rather than people named in the case materials.

I defined the business framing, analytical direction, feature and method decisions, protected-data boundaries, interpretation, recommendations, and final approval. A local AI coding agent supported scoped implementation, execution, repository inspection, provenance checks, report assembly, and publication QA.

[Back to top](#top)

## From Public Source Files to Analytical Data

The data did not originate in BigQuery. The starting point was a collection of public Fitbit CSV files distributed through Kaggle and attributed there to a Zenodo source. The files cover March 12-April 11 and April 12-May 12, 2016, for up to 62 calendar dates. I downloaded and preserved the original CSVs before analysis, then organized local copies by source period and feature family. Consistent file and folder names made the two exports distinguishable, while the preserved originals remained separate from every cleaned or derived output.

### Why the workflow moved from Excel to BigQuery

I first used Excel to inspect filenames, headers, sample records, date formats, feature families, and obvious quality issues. That familiar inspection step clarified the shape of the export. It also revealed a practical limit: the minute- and second-level files exceeded a spreadsheet's comfortable row capacity. The validated long activity-minute table alone contains 2,760,120 clean rows, and staged heart rate contains 3,638,339 rows.

I deliberately selected BigQuery and Standard SQL for scalable profiling, transformation, joins, aggregation, and validation. BigQuery was the analysis environment, not the data source. Using the BigQuery command-line interface with existing Google Cloud authentication made query execution reviewable and kept credentials out of the repository. Preserved source files were uploaded to a protected raw/source dataset, while cleaned and standardized tables, analytical summaries, and reporting outputs were separated into derived layers.

The resulting architecture followed a simple progression:

1. **Preserved originals:** immutable public CSV downloads organized locally by period and feature family.
2. **Protected source layer:** uploaded source tables retained without destructive updates.
3. **Staging and clean layers:** standardized timestamps, numeric fields, duplicate handling, and feature-specific rules.
4. **Hourly and daily summaries:** one row per declared observation grain, with validated keys before joins.
5. **Analytical and reporting outputs:** relationship estimates, sensitivities, figures, decision records, and publication artifacts.

This separation prevented presentation work from changing analytical evidence. It also made every visible number traceable to a declared source, transformation, and validation result.

The minute-level activity files were normalized into a narrow, long table and selected as the detailed source of truth. Wide activity layouts were retained for parity checks and manageable review outputs, not used as a competing analytical base. The first-column source identifier was renamed in technical tables for clarity, while its meaning remained explicitly documented as an export/session key rather than a verified person identifier.

### Primary working environment and authorship

The primary tools I personally selected and used were **Excel**, **BigQuery**, **Standard SQL**, the **BigQuery CLI with configured Google Cloud authentication**, and the **local filesystem and version-controlled repository**. Excel supported initial inspection. BigQuery and SQL supported the scalable analytical workflow. The repository preserved query text, execution evidence, data dictionaries, figures, QA results, and publication files.

A local AI coding agent supported repository inspection, authorized implementation and execution, deterministic rebuilding and packaging, provenance checks, and browser, mobile, accessibility, offline, and print QA. I retained ownership of the business question, analytical strategy, protected-source boundaries, method and feature decisions, discrepancy investigation, interpretation, recommendations, execution approvals, and final validation. The agent did not independently define the business objective or approve analytical conclusions.

Repository Python utilities, notebook-compatible outputs, and local report scripts functioned as supporting implementation dependencies. They reproduced approved calculations, created the approved figures, assembled portable artifacts, and checked the finished package. They were not the primary analysis environment I chose for the case study and are not presented as equivalent to Excel, BigQuery, or SQL in my tools narrative.

### Source suitability and the identifier constraint

The inventory contains 29 source tables, 15,316,113 rows, 311 columns, and 599.45 MiB across daily, hourly, minute, second-level, sleep, weight, and related feature families. That breadth is useful for testing analytical judgment, but it does not guarantee representativeness or independent observations.

The most important issue is the mismatch between the case description and the files. The scenario says 30 consenting Fitbit users; the files contain 35 first-column identifiers. Cross-period overlap, date-range structure, and duplicate-export evidence suggest that identifiers can represent export/session profiles, yet no authoritative mapping connects them to unique people. I therefore use terms such as **session identifier**, **session profile**, **session-day**, and **session-hour**. Counts, eligibility rules, correlations, sensitivities, and visual labels all follow that unit.

No unrelated historical dataset was added merely to create a comparison. A second legacy dataset would not repair the missing identity map, missing demographics, or missing Bellabeat product outcomes. The more decision-relevant next source is consented, governed first-party Bellabeat telemetry collected for a prospective test.

### Feature readiness

Activity and MET data cover all 35 session identifiers and support the main behavioral story. Sleep covers 25 identifiers and 832 recorded days, so it supports bounded matched and paired comparisons but not a universal conclusion. Heart rate covers 15 identifiers and belongs in a non-medical technical appendix. Weight appears for 13 identifiers, yet two sessions provide 76.5% of the 98 unique logs; it supports presence and cadence only. Body fat has four usable values across three identifiers, with 94 of 98 weight records missing body fat, so it is excluded. Distance is excluded because minute lineage is absent and source-versus-reconstructed coverage does not reconcile.

Absence is not behavior. A missing record may reflect source coverage, synchronization, device state, export construction, non-wear, or feature choice. It cannot be labeled churn, low motivation, or disengagement without first-party telemetry.

[Back to top](#top)

## Analytical Approach and Quality Controls

The analytical design used the session identifier as its grouping unit and matched each method to a declared grain. The principal grains were session-day for daily movement, session-hour for timing, session-specific matched activity-sleep pairs for lagged relationships, and feature-log or timestamp for readiness and cleaning. This prevented the narrative from switching silently between records, dates, sessions, and people.

### Decisions that materially shaped the result

**Preserve zero-step days; distinguish them from missing dates.** Recorded zero-step days remained in the activity panel because a row with zero is an observation. Missing dates remained absent. Of 1,935 activity session-days, 1,891 have exactly 1,440 minute rows and 44 are partial. There are 250 recorded zero-step days, 246 of them complete, so dropping zeros would remove mostly complete observations and bias movement upward.

**Use the complete-day definition as a sensitivity, not as the only truth.** A complete activity day is exactly 1,440 activity-minute rows. Main results use all observed session-days, while complete-day estimates test whether partial coverage changes the conclusion. The pooled mean of 7,200 steps, equal-session mean of 6,857, equal-date mean of 7,196, and complete-day mean of 7,280 tell the same directional story despite different weights.

**Protect joins and temporal alignment.** Daily activity and sleep keys were checked for uniqueness before joining. Sleep was assigned to its end date, and lagged questions matched prior activity to same-night recorded sleep or prior-night sleep to next-day activity within a session. Selected sedentary time subtracts timestamp-overlapping sleep minutes, while raw and sleep-end-date variants remain available as sensitivities. These rules prevent join fan-out and avoid treating sleep as sedentary waking time.

**Use relationships for description, not intervention claims.** Within-session correlations measure how a session differs from its own typical level. Between-session correlations compare session averages. Pooled complete-day and leave-one-session checks test sensitivity to coverage and influence. None establishes that changing one behavior will cause another to change.

**Retire unstable segments.** The initial clustering used correlated activity inputs and produced groups of 23 and 11 eligible sessions. Removing correlated features changed the solution to 31 and 3 sessions, with original-versus-reduced `ARI=0.084`; leave-one-session stability fell as low as `0.034`. Even though one reduced solution had a higher silhouette (`0.447` versus `0.314`), the tiny group and unstable memberships failed the operational rule. The portfolio therefore does not name or market to fixed behavioral types.

### Data Validation and Quality Assurance

Source and staging checks verified schemas, data types, timestamp parsing, expected ranges, null and invalid-value flags, duplicate keys, and lineage across both source periods and table families. These checks established the period boundaries and analytical grain before any feature was summarized or joined.

| Evidence layer | Validation applied |
|---|---|
| Activity minutes | Activity components were integrated at the session-minute grain with unique composite keys. The 2,760,120-row clean source reconciled to derived totals; recorded zeros were preserved, and complete 1,440-minute days were distinguished from partial days. |
| Sleep minutes and days | Exact sleep-minute rows repeated across the export boundary were removed deterministically, eliminating 4,300 duplicates. The clean grain is session identifier × sleep log × minute; summaries were created only after validation, assigned overnight sleep to its end date, and checked for unique daily keys and fan-out-free joins. Selected sedentary time subtracts timestamp-overlapping sleep, with alternative definitions retained for sensitivity checks. |
| Weight | The 100 staged rows became 98 unique session-log records after two exact boundary duplicates were removed. Because logging is sparse and concentrated, weight is retained only for presence and cadence. |
| Body fat | Body fat was assessed separately and excluded: only four usable values appear across three session identifiers, and 94 of 98 unique weight records are missing body-fat values. |
| Heart rate | Exact duplicates were removed deterministically at the session-timestamp grain; coverage and sampling cadence were assessed. The result remains a non-medical appendix analysis because coverage is selective. |
| Reconstructed summaries and analysis joins | Minute-to-hour and minute-to-day summaries were reconciled with supplied summaries at declared grains. Complete-day status, key uniqueness, preserved activity session-days, fan-out-free joins, MET normalization, and feature eligibility were checked before analysis. |

Robustness checks compared pooled, equal-session, equal-date, complete-day, and leave-one-session-out movement estimates; paired-eligibility rules for sleep; alternative sedentary definitions; and clustering feature sets, group sizes, and assignment stability. The final pipeline passed the required source, transformation, analytical, and publication checks. Correctness and representativeness remain different questions: QA shows that the stated definitions were applied consistently, but it cannot make this historical export current, demographic, causal, representative, or equivalent to Bellabeat customer telemetry.

The complete twelve-decision register, metric definitions, eligibility rules, lineage, and query-safety evidence appear in the [Technical and Reproducibility Appendix](#technical-and-reproducibility-appendix).

[Back to top](#top)

## Findings and Business Implications

### Theme 1: Movement varies, so progress should be personal

Across 1,935 observed session-days, recorded steps ranged from 0 to 37,322. The pooled mean was 7,200, the median 6,835, and the middle half of observations ranged from 2,913 to 10,629. The right-skewed distribution shows why a single average cannot serve as a universal target. It summarizes the export, but it does not describe a typical Bellabeat customer or establish a clinically appropriate goal.

The central estimate is nevertheless reasonably robust to weighting. Equal-session weighting gives 6,857, equal-date weighting 7,196, and complete-day weighting 7,280. Leave-one-session-out pooled means range from 6,890 to 7,372; simultaneous omission of five sessions broadens the range to 5,971-8,055. The implication is not “7,200 steps for everyone.” It is that within-person change and a customer's own recent pattern are more meaningful product anchors than a universal threshold.

![Histogram of 1,935 observed session-days showing a right-skewed daily-step distribution, with labeled pooled mean 7,200, median 6,835, and equal-session mean 6,857.](../analysis/figures/01_daily_steps_distribution.png)

The calendar trend also changes as session coverage and source periods change. Shaded export-boundary dates and varying numbers of observed sessions warn against reading a rise or fall as a market trend. This figure is descriptive of the files, not evidence of seasonality or intervention impact.

![Time series from March 12 to May 12, 2016 showing daily mean, seven-day centered mean, daily median, shaded export-boundary dates, and the number of session identifiers observed.](../analysis/figures/02_daily_steps_trend.png)

**Business implication.** Bellabeat should test progress feedback that compares a customer with their own recent baseline, celebrates feasible improvement, and avoids declaring a fixed behavioral identity. The experiment must evaluate whether the framing improves meaningful engagement without encouraging unsafe or demotivating target pursuit.

### Theme 2: Light activity is the most accessible movement opportunity

Observed session-days averaged 185.5 light, 12.9 fairly active, and 20.0 very active minutes. Light activity represented 84.9% of recorded active minutes. That makes small, approachable movement the broadest behavior surface in this export. It does not prove that light activity causes a health result, and recorded intensity is not the same as verified wear or exertion.

![Horizontal bars showing mean recorded minutes per observed session-day: light activity 185.5, fairly active 12.9, and very active 20.0, with a callout that light activity is 84.9% of recorded active minutes.](../analysis/figures/03_activity_intensity_composition.png)

Within sessions, steps and active minutes move together strongly (`r=0.824`), as do steps and recorded calories (`r=0.835`). Steps and selected sedentary minutes move in opposite directions (`r=-0.427`). Complete-day estimates remain similar: `0.819`, `0.868`, and `-0.527`, respectively. Between-session estimates answer a different question and are not substitutes for within-session change.

![Grouped horizontal bars comparing within-session and between-session correlations for steps-active minutes, steps-calories, steps-selected sedentary minutes, sleep-lag relationships, sleep efficiency, and the mechanically coupled time-in-bed relationship.](../analysis/figures/05_within_between_relationships.png)

**Business implication.** Bellabeat can test low-pressure content such as a short walk, stretch, or movement break as a feasible way to accumulate activity. The product should reward completion or useful movement, not claim calorie burn, medical benefit, or universal equivalence. Feedback should remain adjustable and respectful of disability, recovery, safety, and customer preference.

### Theme 3: Routines differ across hours, dates, and weekends

The aggregate hourly profile peaks at 19:00, but adequately observed session profiles peak from 06:00 through 20:00; the modal session-specific peak is 12:00. These values come from the session-hour timing analysis in `session_time_of_day.csv`. They show that an evening default may be reasonable as an initial hypothesis, but a single fixed send time would ignore substantial routine diversity.

Weekend activity reinforces the same point. Among 34 eligible sessions, the median weekend-minus-weekday difference was +3 steps and the mean was -75; 17 sessions were higher on weekends and 17 were lower. There is no universal “weekend boost” or “weekend drop” to target.

The heatmap below answers a different question. It standardizes daily steps within each session profile so dates can be compared on a common color scale. Gray cells are missing dates, not zero-step days. It shows session-by-date trajectories and changing coverage; it does **not** visualize hourly timing and is not evidence for a 19:00 prompt.

![Heatmap with neutral session labels S01-S35 across March-May dates, showing within-session standardized daily steps and gray missing dates distinct from observed low or zero-step days.](../analysis/figures/08_session_activity_heatmap.png)

**Business implication.** Bellabeat should combine observed timing with explicit customer choice. A timing experiment can begin with morning, midday, and evening options, learn from delivery and response telemetry, and permit different weekday and weekend routines. The guardrails are quiet hours, preference overrides, opt-outs, and notification fatigue.

### Theme 4: Sleep and optional features require restraint

Sleep appears for 25 session identifiers and 832 recorded days; 19 identifiers meet an at-least-ten-day descriptive threshold. Within sessions, prior-day steps and same-night recorded sleep are essentially unrelated (`r=0.024`), with a complete-prior-day result of `r=0.023`. Prior-night sleep to next-day activity is slightly negative (`r=-0.127`; complete activity days `r=-0.134`). These estimates do not support a message that more activity in this export predicts more sleep that night.

![Dot plot of eligible session-specific within-session correlations between prior-day steps and same-night recorded sleep, spanning negative and positive values around an overall correlation of 0.024.](../analysis/figures/04_sleep_activity_within_session.png)

Weekend sleep is more positive but still selective. For 19 eligible sessions, weekend-minus-weekday recorded sleep averaged +0.70 hours, had a median of +0.32 hours, and a session-bootstrap 95% interval of +0.27 to +1.19 hours; 13 sessions were longer and six shorter. This is a paired descriptive result among covered sessions, not a causal or population claim.

![Paired dot-and-line plot for 19 eligible session identifiers, showing weekend-minus-weekday recorded sleep from about negative 0.54 to positive 3.32 hours, with mean positive 0.70 and median positive 0.32.](../analysis/figures/09_weekend_sleep_differences.png)

Feature presence is uneven: activity and METs appear for 35 identifiers, sleep for 25, heart rate for 15, and weight for 13. Presence can reflect file construction, device capability, synchronization, or feature choice. Weight has only 98 unique logs and is heavily concentrated; body fat is nearly absent. None of these counts measures product engagement.

![Three-panel chart showing 1,891 complete and 44 partial activity session-days, feature data present for 35 activity/MET, 25 sleep, 15 heart-rate, and 13 weight session identifiers, and weight cadence thresholds of 13 any, 7 at least two, 3 at least five, and 2 at least ten.](../analysis/figures/07_recording_feature_presence.png)

**Business implication.** Sleep feedback should be optional, descriptive, and framed around the customer's own recorded pattern. Optional-feature education should explain why data may be absent and let customers control enrollment. Bellabeat should not infer motivation, medical status, or churn from missing records.

### Theme 5: Personal baselines are safer than fixed segments

The original clustering result looked superficially interpretable, with group sizes of 23 and 11 and silhouette `0.314`. But correlated activity measures dominated the feature set. After reducing those inputs, assignments changed sharply (`ARI=0.084`), the groups became 31 and 3, and leave-one-session stability fell as low as `0.034`. Adding METs did not rescue an operationally credible taxonomy.

![Horizontal bars showing original, reduced-feature, and MET-added silhouette values plus adjusted Rand index stability values, including original-versus-reduced ARI 0.084 and minimum leave-one-session ARI 0.034.](../analysis/figures/06_segmentation_stability.png)

A clean cluster label can be more persuasive than its evidence warrants. Here it would convert unstable assignments and ambiguous identity into customer types that the data cannot support.

**Business implication.** Bellabeat should personalize on continuous, revisable signals: recent baseline, stated goal, preferred timing, opted-in features, and observed response. Any future segmentation should be trained on verified customers, tested out of sample, checked for stability and group size, and monitored for fairness and drift.

[Back to top](#top)

## Strategic Recommendations

### 1. Progress is personal

**Product idea.** Show a rolling personal baseline, a modest customer-adjustable next step, and progress language that recognizes direction rather than imposing a universal target.

**Evidence.** Daily movement varies widely, central estimates remain similar under several weighting choices, and fixed clusters are unstable. These facts support within-person comparison; they do not establish an ideal step count.

**Test.** Randomize eligible, consented customers to personal-baseline feedback versus the existing experience. Measure qualified return rate, baseline-card engagement, movement-recording continuity, and change relative to each customer's pre-period. Guardrails include opt-out, support contacts, unsafe goal escalation, and adverse sentiment.

### 2. Small movement counts

**Product idea.** Offer approachable movement options—such as a short walk, stretch, or movement break—and recognize completion without turning recorded intensity into a medical claim.

**Evidence.** Light activity accounts for 84.9% of active minutes, while steps co-vary positively with active minutes and inversely with selected sedentary time within sessions.

**Test.** Compare brief movement content with a neutral app message. Measure content starts and completions, incremental active minutes relative to baseline, next-day return, and sustained use. Guardrails include notification fatigue, dismissals, quiet hours, accessibility feedback, and customer-controlled difficulty.

### 3. Your routine, your timing

**Product idea.** Ask customers to choose preferred windows, use observed response only with consent, and allow weekday and weekend schedules to differ.

**Evidence.** Session-specific activity peaks span 06:00-20:00, and weekend activity divides 17 higher versus 17 lower. The aggregate 19:00 peak is not a universal schedule.

**Test.** Compare fixed timing, customer-selected timing, and consented adaptive timing. Measure delivered-message engagement, action within a defined window, weekly retained engagement, preference changes, and opt-outs. Guardrails include quiet-hour violations, excessive frequency, fatigue, and loss of customer control.

### Bounded sleep principle

Offer sleep summaries only to customers who opt in and have sufficient recent coverage. Describe personal patterns; do not promise that more steps will improve sleep. Measure understanding and usefulness while monitoring anxiety, confusion, and support contacts.

### Telemetry prerequisite

Before recovery or re-engagement automation, distinguish app open, account state, device connection, sync success, feature enrollment, notification delivery, dismissal, and wear-related signals where consent and policy allow. A recording gap alone must never activate a churn label.

[Back to top](#top)

## Measurement and Next Steps

The recommendations become business decisions only through prospective measurement. Bellabeat should define exposure, eligibility, outcome windows, and guardrails before launch; verify telemetry end to end; randomize at the customer level where appropriate; and report intention-to-treat results. Novelty effects, multiple testing, uneven device capability, and missing outcomes should be handled in the analysis plan rather than after results are known.

### Sequenced next steps

1. Validate current first-party identifiers, consent rules, device capabilities, and demographic coverage.
2. Instrument app opens, sync outcomes, feature enrollment, content exposure, delivery, dismissal, and preference changes.
3. Establish recent personal baselines and minimum observation thresholds before personalization.
4. Run a small telemetry QA cohort and reconcile events against product logs.
5. Test **Progress is personal** with a preregistered primary outcome and safety guardrails.
6. Test **Small movement counts** and **Your routine, your timing** separately before evaluating combinations.
7. Review effect heterogeneity only on appropriately consented and sufficiently sized groups; avoid inventing segments after the fact.
8. Scale only if benefits persist beyond novelty and guardrails remain within agreed limits.

### Outcome framework

| Decision area | Primary measure | Supporting measure | Guardrail |
|---|---|---|---|
| Personal progress | Qualified return or baseline-card engagement | Change from personal movement baseline | Unsafe escalation, opt-out, adverse sentiment |
| Light movement | Content completion or incremental active minutes | Next-day and weekly retained engagement | Fatigue, accessibility complaints, dismissals |
| Timing | Action after delivered prompt | Preference retention and weekly engagement | Quiet-hour breach, opt-out, frequency burden |
| Optional sleep | Summary usefulness among eligible opt-ins | Understanding of personal pattern | Anxiety, confusion, support contacts |

### Further questions

Which customer-selected goals make personal progress feel motivating rather than evaluative? How much recent data is needed for a stable baseline across different device and sync patterns? Does timing personalization improve action after delivery, or merely shift when already-engaged customers respond? Which forms of light-movement content are useful across mobility needs? What explanatory copy helps customers understand missing or optional feature data? These are research and experiment questions, not conclusions available from the historical export.

[Back to top](#top)

## Limitations

1. **Identity is unresolved.** Thirty consenters and 35 file identifiers cannot be reconciled into verified people. All results remain session-level.
2. **The export is historical and selective.** March 12-May 12, 2016 records do not represent current Bellabeat customers, products, or market conditions.
3. **Demographics are unavailable.** The data cannot support women-specific, age-specific, or other demographic conclusions.
4. **Coverage varies.** Activity is broadest; sleep, heart rate, and weight are selective. Missingness is not evidence of motivation or churn.
5. **Wear and device state are unverified.** Zero-step observations are preserved, but the export cannot distinguish every non-wear, sync, or device condition.
6. **Observational relationships are non-causal.** Correlations, paired differences, and temporal patterns do not establish intervention effects or health outcomes.
7. **Measurement definitions matter.** Sedentary time, sleep-day assignment, complete-day thresholds, and weighting choices are explicit but remain analytical choices.
8. **Some features are not decision-ready.** Distance and body fat are excluded; weight is cadence-only; heart rate is non-medical and appendix-only.
9. **No business outcomes are present.** The data contain no Bellabeat conversion, retention, revenue, campaign, or product-exposure measures.
10. **Timezone is unverified.** Hour labels are useful for session-pattern description, but the export does not provide authoritative timezone context for production scheduling.
11. **Generalization requires a new study.** Recommendations must be tested with current, consented, representative Bellabeat customers and governed first-party telemetry, including current preferences and advertising or lifecycle-performance outcomes where those decisions are in scope.

These limits do not make the analysis unusable. They define its proper role: a reproducible way to prioritize low-risk product hypotheses and design the evidence needed for the next decision.

[Back to top](#top)

## Technical and Reproducibility Appendix

### A. Canonical source tables and observation grains

| Analytical object | Declared grain | Role |
|---|---|---|
| Clean activity minutes | Session identifier × timestamp | Complete-day checks, daily activity construction |
| Daily activity summary | Session identifier × activity date | Main movement estimates and sensitivities |
| Session-hour summary | Session identifier × hour | Timing profiles and peak-hour analysis |
| Daily sleep summary | Session identifier × sleep end date | Matched and paired sleep analyses |
| Clean heart rate | Session identifier × timestamp | Non-medical readiness appendix |
| Weight logs | Session identifier × timestamped log | Presence and cadence only |

The protected source dataset was not updated, replaced, truncated, or deleted for publication. Cleaned tables belong in `fitbit_clean`; analytical summaries belong in `fitbit_analytics`.

### B. Complete analytical decision register

#### Decision 1: Interpret the first-column identifier as an export/session key

- **Problem:** The case describes 30 consenters, but the files contain 35 identifiers without a mapping.
- **Alternatives:** Treat identifiers as people; reconstruct an unverified crosswalk; or use a neutral session unit.
- **Evidence:** Identifier overlap, export periods, and duplicate-file evidence do not establish unique people.
- **Solution:** Use session identifier/profile terminology and neutral labels throughout.
- **Downstream effect:** No unique-person, demographic, or population-level claim is allowed.

#### Decision 2: Preserve recorded zero-step days

- **Problem:** Zero steps can look like missingness or non-wear.
- **Alternatives:** Drop zeros; convert them to missing; or preserve recorded rows.
- **Evidence:** 250 zero-step days are recorded and 246 meet the 1,440-minute completeness rule.
- **Solution:** Retain zeros and distinguish them from absent dates.
- **Downstream effect:** Movement estimates do not silently exclude low recorded days.

#### Decision 3: Define a complete activity day as exactly 1,440 minute rows

- **Problem:** Partial days can change daily totals.
- **Alternatives:** Use a looser threshold; exclude all partial days; or use completeness as a sensitivity.
- **Evidence:** 1,891 of 1,935 session-days are complete; 44 are partial.
- **Solution:** Report all observed days as primary and complete days as sensitivity.
- **Downstream effect:** Coverage robustness is visible without discarding observed data.

#### Decision 4: Assign sleep to its end date

- **Problem:** Overnight sleep crosses calendar dates.
- **Alternatives:** Start date, end date, or split intervals.
- **Evidence:** End-date assignment aligns the recorded episode with the waking date and supports declared lag logic.
- **Solution:** Use sleep end date in the daily sleep key.
- **Downstream effect:** Prior-activity/same-night and prior-night/next-day joins are reproducible.

#### Decision 5: Prevent activity-sleep join fan-out

- **Problem:** Duplicate daily keys could inflate matched rows.
- **Alternatives:** Join raw logs; deduplicate after joining; or validate unique summaries first.
- **Evidence:** The intended relationship grain is one daily record per session and date.
- **Solution:** Aggregate and validate keys before joining.
- **Downstream effect:** Relationship denominators and correlations are not duplicated by join structure.

#### Decision 6: Select timestamp-overlapping sleep subtraction for sedentary time

- **Problem:** Raw sedentary minutes can include recorded sleep.
- **Alternatives:** Use raw sedentary time; subtract sleep by end date; or subtract timestamp overlap.
- **Evidence:** Timestamp overlap most directly removes sleep minutes from the same recorded interval.
- **Solution:** Select overlap-adjusted sedentary time and retain raw/end-date variants as sensitivities.
- **Downstream effect:** The main inverse steps-sedentary relationship uses a more defensible waking-time measure.

#### Decision 7: Normalize MET values and limit their role

- **Problem:** Minute MET values are stored in scaled integer form and overlap conceptually with activity features.
- **Alternatives:** Use raw scale; normalize and promote to main finding; or normalize as supporting evidence.
- **Evidence:** Dividing by 10 yields interpretable MET units; grouped prediction is high (`R²=0.935`) and adds little independent structure.
- **Solution:** Normalize METs and keep them supporting-only.
- **Downstream effect:** METs do not duplicate the main movement story or rescue unstable clustering.

#### Decision 8: Limit calorie interpretation

- **Problem:** Recorded calories are mechanically and device-model related to movement.
- **Alternatives:** Treat as health outcome; omit entirely; or use as a bounded activity-related measure.
- **Evidence:** Steps-calories association is stronger within sessions (`r=0.835`) than between sessions (`r=0.547`).
- **Solution:** Use calories descriptively and avoid causal, clinical, or between-person claims.
- **Downstream effect:** Recommendations focus on movement behaviors rather than calorie promises.

#### Decision 9: Exclude distance from validated findings

- **Problem:** Source and reconstructed distance coverage do not reconcile, and minute lineage is incomplete.
- **Alternatives:** Prefer source totals; prefer reconstruction; or exclude.
- **Evidence:** The audit found 593 reconstructed-only and 49 source-only earlier-period rows.
- **Solution:** Exclude distance from findings and recommendations.
- **Downstream effect:** No portfolio claim depends on an unresolved distance measure.

#### Decision 10: Limit weight and exclude body fat

- **Problem:** Weight and body-fat logs are sparse and concentrated.
- **Alternatives:** Model change; summarize values; or restrict to readiness.
- **Evidence:** Weight has 98 unique logs across 13 sessions, with 76.5% from two sessions; body fat has four usable values across three sessions and 94 of 98 missing.
- **Solution:** Report weight presence/cadence only and exclude body fat.
- **Downstream effect:** No weight-loss or body-composition inference appears.

#### Decision 11: Clean heart rate but keep it non-medical and appendix-only

- **Problem:** Second-level heart rate is large, duplicated, selective, and clinically sensitive.
- **Alternatives:** Ignore; use as a main behavioral outcome; or prepare a bounded readiness appendix.
- **Evidence:** 3,638,339 staged rows become 3,614,915 clean rows after 23,424 duplicates; coverage is 15 sessions and 469 session-days.
- **Solution:** Deduplicate deterministically, validate 36-203 BPM, and restrict interpretation.
- **Downstream effect:** Heart rate demonstrates engineering rigor without becoming a medical claim.

![Horizontal bars for 15 neutral heart-rate appendix labels showing observed heart-rate session-days from 3 to 44, with a dashed 14-day descriptive threshold.](../analysis/figures/10_heart_rate_appendix_coverage.png)

#### Decision 12: Retire the fixed clustering taxonomy

- **Problem:** Correlated features and small samples can create fragile customer types.
- **Alternatives:** Keep original labels; accept a reduced-feature solution; or retire segmentation.
- **Evidence:** Original 23/11 groups change to 31/3, `ARI=0.084`, with minimum leave-one-session `ARI=0.034`.
- **Solution:** Retire fixed clusters and use continuous personal signals.
- **Downstream effect:** Product recommendations avoid unstable labels and require future out-of-sample validation.

### C. Metric definitions and eligibility

| Metric | Definition |
|---|---|
| Observed session-day | Session identifier × date with a daily activity record |
| Complete activity day | Exactly 1,440 activity-minute rows for a session-date |
| Active minutes | Very + fairly + lightly active minutes |
| Selected sedentary minutes | Raw sedentary minutes less timestamp-overlapping recorded sleep minutes |
| Within-session relationship | Association after centering observations within session identifier |
| Between-session relationship | Association between session-level averages |
| Equal-session estimate | Each session contributes equal weight regardless of observed-day count |
| Equal-date estimate | Each calendar date contributes equal weight regardless of session coverage |

Eligibility thresholds include at least 14 activity days for session-level activity profiles and clustering, at least 10 sleep days for descriptive sleep coverage, at least two weekday and two weekend observations for paired comparisons, and at least five matched pairs for displayed session-specific correlations. Thresholds are analytical rules, not clinical standards.

### D. Methods and sensitivity checks

Descriptive summaries report means, medians, ranges, quartiles, counts, and coverage. Timing uses session-hour profiles. Paired weekend comparisons use within-session weekend-minus-weekday differences; the weekend sleep interval is a session-level bootstrap. Relationship panels distinguish within-session, between-session, and complete-day estimates. Activity sensitivity includes pooled, equal-session, equal-date, complete-day, leave-one-session, and five-session omission results. Clustering checks feature redundancy, silhouette, group size, original-versus-reduced assignment agreement, and leave-one-session stability.

### E. SQL and transformation lineage

Materialized-table SQL is preserved under `sql/clean/` and `sql/analytics/`; validation SQL is under `sql/qa/` and related analysis directories. The principal lineage is preserved source → clean minute or feature table → daily/hourly summary → `fitbit_analytics.analysis_daily` and related analytical outputs → exported evidence tables and canonical figures → portfolio Markdown → portable artifact JSON → offline HTML.

Every substantive query in the analytical project was dry-run before execution, with estimated bytes and cost reported. Destination tables and full proposed SQL were reviewed before replacement.

### F. Validation and release evidence

| Validation area | Result |
|---|---|
| Minute-table QA | 23 of 23 passed |
| Blocking pipeline phase tests | 64 of 64 passed |
| Catalog checks | 15 of 15 passed |
| Final validation checks | 25 of 25 passed |
| Activity days | 1,935 total; 1,891 complete; 44 partial |
| Heart-rate cleaning | 3,638,339 staged; 3,614,915 clean; 23,424 duplicates removed |
| Final read-only dry run | 3,065,163,296 bytes; approximately $0.01742344 at $6.25/TiB |

The publication validator separately checks narrative structure, tools and authorship language, data-origin chronology, recommendation uniqueness, word ranges, figure hashes, offline behavior, native responsive tables, navigation, path portability, claim containment, and unchanged canonical analytical files.

### G. Approved figure register

| ID | Figure | Analytical role |
|---|---|---|
| F01 | Daily steps distribution | Variability and estimator context |
| F02 | Daily steps trend | Coverage-aware calendar context |
| F03 | Activity intensity composition | Light-activity share |
| F04 | Activity and sleep within sessions | Restraint on sleep claims |
| F05 | Within/between relationships | Grain-specific associations |
| F06 | Segmentation stability | Retirement of fixed taxonomy |
| F07 | Recording feature presence | Coverage and optionality |
| F08 | Session-by-date activity trajectories | Date patterns; not hourly timing |
| F09 | Weekend sleep differences | Selective paired sleep result |
| F10 | Heart-rate appendix coverage | Non-medical readiness only |

All ten PNGs are approved analytical outputs embedded byte-for-byte in the offline HTML. They were not resampled, relabeled, recolored, or regenerated.

### H. AI-assisted execution provenance

The local AI coding agent supported repository inspection, authorized implementation and execution, deterministic rebuilds, provenance checks, and browser-based desktop, mobile, accessibility, offline, navigation, and print QA. It also helped reconcile conflicts among the official guide, working document, and validated analytical package.

I defined and approved the business framing, analytical strategy, evidence boundaries, tool choices, methodology and feature decisions, interpretations, recommendations, execution plans, and final deliverables. Existing Google Cloud authentication was used only within the authorized workflow; no credentials were printed, copied, logged, or committed.

### I. Guide compliance and source authority

The official guide requirements, source-authority hierarchy, material-statistic register, figure lineage, recommendation crosswalk, and documented conflict resolutions are maintained in [`portfolio_source_map.md`](portfolio_source_map.md).

### J. Reproducibility map and source note

- Analytical narrative: `reports/analysis/wellness_behavior_analysis.md`
- Methodology: `reports/analysis/methodology_appendix.md`
- Identifier audit: `reports/analysis/identifier_population_audit.md`
- Decision memo: `reports/analysis/analysis_decision_memo.md`
- Feature matrix: `reports/analysis/feature_inclusion_exclusion_matrix.csv`
- Recommendations: `reports/analysis/marketing_recommendations.md`
- Final analytical validation: `reports/analysis/final_validation_report.md`
- Portfolio source map: `reports/portfolio/portfolio_source_map.md`
- Deterministic portfolio builder: `scripts/build_portfolio_case_study.py`
- Publication validator: `scripts/validate_portfolio_publication.py`

The public Fitbit CSV collection was obtained through Kaggle and attributed there to a Zenodo source. The historical export is suitable for demonstrating analytical method, data quality control, and hypothesis formation. It is not a current market sample and should not be used to make demographic, medical, or causal claims.

[Back to top](#top)
