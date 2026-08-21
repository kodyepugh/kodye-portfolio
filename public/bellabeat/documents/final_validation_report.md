# Final validation report

## 1. Final decision

**Ready to share with required caveats.**

Automated release gates: 25/25 passed.

## 2. Files changed

- `README.md`
- `reports/analysis/README.md`
- `reports/analysis/analysis_decision_memo.md`
- `reports/analysis/analysis_manifest.yaml`
- `reports/analysis/browser_qa.md`
- `reports/analysis/canonical_output_manifest.csv`
- `reports/analysis/final_validation_report.md`
- `reports/analysis/heart_rate_cleaning_qa.md`
- `reports/analysis/methodology_appendix.md`
- `reports/analysis/report_artifact.json`
- `reports/analysis/revision_validation.json`
- `reports/analysis/visual_qa_supplied_figures.md`
- `reports/analysis/wellness_behavior_analysis.html`
- `reports/analysis/wellness_behavior_analysis.md`
- `reports/inventory/repository_inventory.csv`
- `reports/source_inventory.md`
- `scripts/apply_portable_print_polish.py`
- `scripts/build_repository_inventory.py`
- `scripts/export_canonical_queries.py`
- `scripts/validate_revision_outputs.py`

## 3. Documentation corrections

- Selected sedentary minutes are consistently defined as timestamp-aligned sedentary time after subtracting timestamp-overlapping recorded sleep; raw and sleep-end-date assignment measures remain sensitivities.
- The approved `fitbit_clean.heart_rate_seconds` build is separated from the read-only revision/QA batch and from the unchanged protected source dataset.
- The heart-rate daily producer resolves to `sql/analysis/21_heart_rate_daily_metrics.sql`.
- Legacy-figure remediation is complete; only ten PNGs are approved for standalone reuse, while the HTML's embedded interactive summaries retain separate source governance.

## 4. Browser and print QA results

PASS. The canonical HTML reached ready state over localhost HTTP; four interactive charts, one interactive table, source-detail controls, desktop/mobile overflow, contained table scrolling, light/dark appearance support, semantic fallback, and print-to-PDF were checked. Full evidence is in `reports/analysis/browser_qa.md`.

## 5. Manifest and hash reconciliation

PASS. 36 canonical manifest entries exist, producer paths resolve, and 264 inventory rows reconcile for all non-self, non-regenerated validation outputs. The inventory is rebuilt once more after this report and verified with `scripts/build_repository_inventory.py --verify`.

## 6. Analytical checks preserved

Daily/hourly grains, key uniqueness, join fan-out, source reconciliation, identifier semantics, headline estimators, heart-rate cleaning, weight row units, segmentation retirement, notebook execution, and all ten canonical PNG hashes remain unchanged and passing.

## 7. Remaining caveats

- No authoritative session-to-user mapping exists; 35 session identifiers are not 35 verified independent people.
- The 2016 export is small, historical, and not representative of current Bellabeat customers or wearable users.
- Timezone is unverified; sleep, weight, and heart-rate coverage are selective.
- Recording presence is not confirmed wear or engagement, and all reported associations are observational and non-causal.

## 8. BigQuery mutation statement

The identifier, feature-coverage, analytical-revision, and final QA queries were read-only against the protected source dataset. The only approved BigQuery mutation in the finalization work was the deterministic creation or replacement of `fit-pathway-496419-r7.fitbit_clean.heart_rate_seconds`. No protected `fitbit_data` source table was modified.

## 9. Final canonical artifact count

The canonical output manifest lists 36 artifacts, including one primary portable HTML report, ten standalone-approved PNGs, four embedded interactive chart summaries, and one embedded interactive decision table.

## 10. Any nonblocking warnings

The packaged builder reported structural-only verification because it did not find its own compatible Chromium executable; this is nonblocking because the canonical HTTP report subsequently passed rendered in-app browser QA. The retained analytical caveats above are required disclosure, not release blockers.
