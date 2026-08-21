# Analysis decision memo

## Decision: Option B — Partial reanalysis

The validated daily and hourly base remains usable, and no duplicated export block was found across different session identifiers. A complete rebuild is therefore not justified. Targeted wording changes alone are insufficient, however, because paired weekend sleep, MET treatment, weight cadence, heart-rate readiness, and segmentation materially change selected conclusions and recommendations.

## Why the base survives

- Daily activity and sleep keys remain unique.
- The analytical join remains one activity session-day to zero-or-one sleep-end-date row with no fan-out.
- Cross-session duplicate checks found no exact full activity sequence, exact daily summary, sleep log, or weight record.
- Pooled, equal-session, equal-date, complete-day, and adequately observed-session step estimates are close enough to preserve the central activity description.
- Headline within-session activity relationships remain stable under complete-day and leave-one-session-out checks.

## Original findings that survive with session-level wording

- Daily activity is right-skewed and variable.
- The pooled step mean exceeds the equal-session mean.
- Step volume is not dominated by one session identifier.
- Steps strongly track active minutes within and between session profiles.
- Steps are inversely associated with selected sedentary minutes within sessions.
- Light activity supplies most recorded active minutes.
- Session-level activity timing is heterogeneous.
- Prior activity does not show a supported positive relationship with same-night recorded sleep.
- Recording coverage is generally dense for activity and selective for other features.

## Findings materially changed

- Weekend sleep is now an eligible paired-session comparison: mean `+0.70` hours and median `+0.32` across 19 session identifiers, rather than only the pooled `+0.50`-hour contrast.
- METs are added as a supporting relative-intensity measure. They strongly confirm the activity measures but are 93.5% predictable in grouped validation from steps, calories, intensity composition, and sedentary time, so they do not justify a new primary conclusion or segment.
- Weight is recast from staged-row presence to unique-record cadence: 100 staged rows reduce to 98 unique session/log records after two exact boundary duplicates; seven sessions have at least two unique records, three have at least five, and two have at least ten. The two largest sessions hold 76.5% of unique records, so the conclusion remains presence/cadence only.
- Heart rate is now cleaned and validated at unique session-timestamp grain. It is appendix-ready for bounded non-medical within-session description, but remains excluded from main findings and cross-session physiological conclusions because coverage is selective.
- Recording/feature findings are separated from app engagement, device engagement, retention, wear, satisfaction, and motivation.

## Finding removed from the main strategy

The original two-group 23/11 segmentation is no longer supportable as an operational grouping. Removing correlated activity inputs changes assignments sharply (`ARI=0.084`). The reduced `k=2` solution has a higher silhouette (`0.447`) but isolates only three session identifiers, fails the minimum-size rule, and can become unstable when one session is omitted. Continuous personal-baseline rules are more defensible than fixed cluster assignment.

## New analyses added

- Source-period and cross-feature identifier overlap.
- Exact and near-duplicate activity, sleep, and weight checks across session identifiers.
- Equal-date, complete-day, adequately observed-session, leave-one-session-out, and five-session omission sensitivities.
- Eligible paired weekday/weekend sleep comparison.
- MET completeness, normalization, relationships, redundancy, exceptions, and clustering contribution.
- Heart-rate readiness and coverage-selection audit, deterministic cross-period deduplication, post-build QA, and a 469-row daily-metrics extract.
- Weight cadence and body-fat usability audit.
- Distance coverage and lineage reconfirmation.
- Feature inclusion/exclusion matrix and figure regeneration inventory.

## Remaining source limitations

- Authoritative session-to-user mapping.
- Prespecified heart-rate coverage eligibility, movement/time-of-day adjustment, and non-medical review before interpreting the prepared appendix metrics.
- Production event telemetry and wear status for engagement or trigger logic.
- Historical 2016 export boundaries and unverified timezone.

## Share status

**Ready to share with required caveats.** The canonical figures, portable report structure, rendered browser interactions, responsive layouts, fallback content, and print output pass final validation. The revised analysis is ready for internal presentation and hypothesis generation, but it is not suitable for population estimates, person-level prevalence, causal wellness claims, medical guidance, or activation of production targeting rules.
