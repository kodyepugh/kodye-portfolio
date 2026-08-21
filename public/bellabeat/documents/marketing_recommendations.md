# Revised marketing recommendations

## Evidence boundary

These recommendations are hypotheses for controlled testing. The case materials describe 30 consenting users, while the evidence contains 35 session identifiers with no authoritative mapping to underlying people. The unit of evidence below is therefore an observed session-day, session-hour, session profile, or feature log. Production audiences and triggers require current consented product telemetry and must not be inferred directly from the historical export.

| Recommendation | Evidence strength | Identifier risk | Feature-coverage risk | Revision status |
|---|---|---|---|---|
| 1. Personal-baseline consistency and recovery | Moderate | Medium | Low | Revised; fixed clusters removed |
| 2. Light movement and sedentary interruption | Moderate | Medium | Medium | Revised with wear/data-quality gate |
| 3. Preference-aware time-of-day delivery | Moderate for timing heterogeneity | Medium | Medium | Revised; activity time is not preference |
| 4. Sleep logging and regularity | Low to moderate | High | High | Downgraded; no causal benefit claim |
| 5. Adaptive weekday/weekend routines | Moderate for activity heterogeneity | Medium | Medium | Revised with stability threshold |
| 6. Consented multi-feature onboarding | Low | High | High | Downgraded; weight cadence limits added |
| 7. Telemetry-gated gap recovery | Unsupported by this export | High | High | Removed as an export-derived action; retained as a prerequisite-bound research idea |

## 1. Personal-baseline consistency and recovery

- **Observed evidence:** Activity varies within session profiles; the complete-day steps–active-minutes association remains strong (`r=0.819`). The original 23/11 clusters do not survive correlated-feature removal, so no fixed group supports targeting.
- **Unit of evidence:** Observed session-days nested within session identifiers.
- **Future production audience:** Consenting accounts with enough recent activity and recording-quality history to estimate a stable personal baseline.
- **Personalization trigger:** A prespecified, reliable change from the account's own rolling baseline, with an “insufficient history” state. Do not use cluster membership.
- **Evidence limitation:** The export shows association and variability, not campaign response or causal behavior change.
- **Identifier limitation:** Multiple session identifiers may belong to one person; session-level variability cannot be counted as independent-person prevalence.
- **Operational prerequisites:** Current timezone, trustworthy wear/recording completeness, consent, configurable goal type, and production exposure/outcome events.
- **Proposed experiment:** Randomize supportive recovery framing, a smaller next-step goal, and no message after a validated baseline deviation. Stratify by baseline reliability rather than cluster.
- **Guardrails:** Notification fatigue, opt-out, shame/stigma language, partial-day suppression, and no forced assignment when history is insufficient.
- **Allowed claims:** “A small next step can help you return to your own routine,” as motivational copy tested for effectiveness.
- **Prohibited claims:** “People like you are inactive,” fixed archetype labels, guaranteed wellness improvement, or claims derived from the three-session reduced cluster.

## 2. Light movement and sedentary interruption

- **Observed evidence:** Light activity accounts for 84.9% of recorded active minutes. Steps and selected sedentary minutes are inversely related within sessions (`r=-0.427`; complete days `r=-0.527`), and the direction survives three sedentary definitions. METs strongly confirm the recorded movement pattern.
- **Unit of evidence:** Observed activity minutes and session-days.
- **Future production audience:** Consenting accounts with verified current wear and reliable sedentary-state telemetry.
- **Personalization trigger:** A prolonged recorded inactive period outside sleep, conditioned on a complete, current device signal and the account's normal day.
- **Evidence limitation:** The historical export has no verified wear-time indicator and cannot show that a prompt changes behavior.
- **Identifier limitation:** Session evidence does not estimate how many independent people exhibit the pattern.
- **Operational prerequisites:** Wear detection, timezone, sleep-state exclusion, real-time data freshness, cooldown rules, and accessible alternatives.
- **Proposed experiment:** Randomize a brief light-movement prompt, a user-selected movement suggestion, and no prompt. Measure incremental movement in a bounded post-message window.
- **Guardrails:** False-positive inactive states, mobility/accessibility needs, medical neutrality, quiet hours, fatigue, and opt-out.
- **Allowed claims:** “Short movement can add to your recorded activity,” if phrased as a neutral product hypothesis.
- **Prohibited claims:** Disease prevention, medical risk reduction, confirmed prolonged sitting, or clinical exercise compliance.

## 3. Preference-aware time-of-day delivery

- **Observed evidence:** Aggregate step volume peaks at 19:00, while adequately observed session profiles peak from 06:00–20:00 and most commonly at 12:00.
- **Unit of evidence:** Session-hours summarized within session identifiers.
- **Future production audience:** Consenting accounts with at least two weeks of reliable hourly history and an explicit notification-time preference.
- **Personalization trigger:** A repeatable activity window combined with user-selected timing; observed activity time alone is not a preference signal.
- **Evidence limitation:** The export measures when movement occurred, not when a notification would be welcome or effective.
- **Identifier limitation:** Repeated session identifiers may belong to one person and can overstate the breadth of timing heterogeneity.
- **Operational prerequisites:** Verified timezone, quiet hours, preference controls, delivery/open telemetry, and enough history.
- **Proposed experiment:** Randomize explicit user-selected timing, model-suggested pre-activity timing, a neutral default, and no notification.
- **Guardrails:** Quiet hours, fatigue, missed timezone changes, workplace/safety contexts, and easy rescheduling.
- **Allowed claims:** “Choose a reminder time that fits your routine.”
- **Prohibited claims:** “Your preferred time is 19:00,” or treating a historical movement peak as optimal notification timing.

## 4. Sleep logging and regularity without causal promises

- **Observed evidence:** Sleep occurs for 25 session identifiers; 19 meet the paired weekend threshold. Their paired weekend-minus-weekday difference averages `+0.70` hours and has median `+0.32`. Prior activity to same-night sleep is null within sessions (`r=0.024`; complete prior days `r=0.023`).
- **Unit of evidence:** Recorded sleep session-days and paired session-level means.
- **Future production audience:** Consenting accounts that explicitly enable sleep tracking or request sleep feedback.
- **Personalization trigger:** Sufficient recent sleep-log history, transparent data-quality status, and user-selected feedback goals.
- **Evidence limitation:** Coverage is selective; the data do not show that activity improves sleep or that longer weekend sleep is beneficial.
- **Identifier limitation:** The 19 eligible session identifiers are not 19 verified independent people; session-bootstrap intervals may be optimistic.
- **Operational prerequisites:** Validated sleep detection, timezone, privacy review, explicit consent, and non-medical content review.
- **Proposed experiment:** Randomize descriptive regularity feedback, a logging-support prompt, and no message. Measure log continuity and self-rated usefulness, not promised sleep improvement.
- **Guardrails:** Anxiety, sleep-score fixation, pregnancy/medical contexts, privacy, message frequency, and access to settings.
- **Allowed claims:** “More consistent logging can reveal your recorded sleep pattern.”
- **Prohibited claims:** “Exercise will improve your sleep tonight,” “weekend sleep is healthier,” diagnosis, or treatment guidance.

## 5. Adaptive weekday/weekend routines

- **Observed evidence:** Among 34 eligible session identifiers, the median weekend-minus-weekday difference is `+3` steps; 17 are higher and 17 lower.
- **Unit of evidence:** Paired session-level weekday/weekend activity means.
- **Future production audience:** Consenting accounts with at least three weekends of reliable history and a stable, repeated direction.
- **Personalization trigger:** A prespecified within-account difference that replicates across multiple weekends; use neutral copy when unstable.
- **Evidence limitation:** The historical window is short and observational, and the direction can vary over time.
- **Identifier limitation:** The 17/17 split is a count of session identifiers, not independent people.
- **Operational prerequisites:** Timezone, calendar alignment, completeness checks, stability monitoring, and explicit routine preferences.
- **Proposed experiment:** Randomize direction-aware weekend planning, a generic weekend message, and no message. Measure baseline-relative weekend movement and rated relevance.
- **Guardrails:** Avoid moralizing weekday/weekend behavior, preserve rest/recovery choice, limit fatigue, and suppress when history changes.
- **Allowed claims:** “Your recorded weekends have recently looked different from your weekdays,” when the production history supports it.
- **Prohibited claims:** Universal weekend slump/boost claims or fixed classification from the historical export.

## 6. Consented multi-feature onboarding

- **Observed evidence:** Sleep has any data for 25 session identifiers, but only 19 have at least 10 days. Weight has data for 13 sessions; 100 staged rows reduce to 98 unique session/log records after two exact boundary duplicates, with at least 2 unique logs for 7 sessions, at least 5 for 3, and at least 10 for 2; the two largest sessions hold 76.5% of unique records. Heart rate is clean at unique timestamp grain for 15 session identifiers and 469 session-days, but remains selectively covered and appendix-only.
- **Unit of evidence:** Feature-data presence and logging cadence by session identifier.
- **Future production audience:** Consenting accounts eligible for a feature and explicitly interested in it; weight requires especially clear consent and privacy controls.
- **Personalization trigger:** In-product preference or explicit setup intent, not a single historical record or inferred body metric.
- **Evidence limitation:** Presence does not measure adoption, motivation, satisfaction, retention, or benefit.
- **Identifier limitation:** Sparse logs cannot be translated into a count of sustained-tracking people.
- **Operational prerequisites:** Consent, feature eligibility, privacy and sensitive-data review, trustworthy production events, clear deletion/export controls, and prespecified heart-rate coverage plus non-medical validation before any physiological messaging.
- **Proposed experiment:** Test preference-led onboarding versus contextual education and no prompt. Measure opted-in setup completion, sustained feature use, comprehension, and opt-out.
- **Guardrails:** Sensitive-weight handling, no body-fat targeting, no inferred medical state, clear data controls, and no cross-feature pressure.
- **Allowed claims:** “You can opt in to track another feature and control how it is used.”
- **Prohibited claims:** “13 users sustain weight tracking,” weight-loss expectations, body-fat targeting, or heart-rate wellness conclusions.

## 7. Gap recovery only after production engagement telemetry exists

- **Observed evidence:** The export records gaps and changing session coverage but cannot distinguish export boundaries, non-wear, technical failure, cohort exit, churn, dissatisfaction, or low motivation.
- **Unit of evidence:** Recording presence only; no app/device engagement event is present.
- **Future production audience:** Not identifiable from this dataset. A future audience would require a validated sync/app/device gap after prior stable use.
- **Personalization trigger:** A production-defined engagement event with confirmed freshness and technical-state diagnostics.
- **Evidence limitation:** This recommendation is unsupported by the historical export as an activation rule.
- **Identifier limitation:** Multiple session identifiers and unequal export windows can create apparent gaps unrelated to a person or product state.
- **Operational prerequisites:** App opens, syncs, device connection, notification delivery, error state, wear status, consent, and a validated gap definition.
- **Proposed experiment:** Only after event validation, randomize technical-help, supportive-recovery, and control messages. Measure reconnection, downstream retention, complaint rate, and opt-out.
- **Guardrails:** Do not message during known technical incidents, respect quiet periods and opt-out, avoid blame, and limit repeated attempts.
- **Allowed claims:** None from this export about engagement or churn.
- **Prohibited claims:** “Missing Fitbit rows mean disengagement,” “the account churned,” or “the person lacks motivation.”

## Portfolio-level prohibited uses

- Do not count 35 session identifiers as 35 independent people.
- Do not infer the unknown mapping to the 30 consenting users.
- Do not merge session identifiers on behavioral or physiological similarity.
- Do not use fixed activity clusters as production identities.
- Do not use body fat, weight, or heart rate for targeting or health claims from this dataset.
- Do not infer app/device engagement, retention, satisfaction, motivation, or wear from recording presence.
- Do not make causal, diagnostic, treatment, or population claims.
