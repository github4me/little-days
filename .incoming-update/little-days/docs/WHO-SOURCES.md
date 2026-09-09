# WHO growth reference provenance

The app bundles WHO Child Growth Standards, monthly ages 0–24 inclusive, for boys and girls. Source workbooks were retrieved on 2026-09-06 directly from WHO's CDN links on these official index pages:

- Weight-for-age: https://www.who.int/tools/child-growth-standards/standards/weight-for-age
- Length/height-for-age: https://www.who.int/tools/child-growth-standards/standards/length-height-for-age
- Head circumference-for-age: https://www.who.int/tools/child-growth-standards/standards/head-circumference-for-age

## Reproducible source files

`assets/who/sources.json` records exact versioned download URLs. Original Excel workbooks are included next to it, with SHA-256 checksums in `SHA256SUMS`. The app imports only `percentiles-0-24.json`; it does not download standards or upload measurements at runtime.

The JSON copies the published `Month`, `P3`, `P15`, `P50`, `P85`, and `P97` cells for months 0 through 24 directly, without invented values or LMS re-estimation. Published rounding is retained (one decimal). The longer original weight and head circumference tables are deliberately restricted to 0–24 months for a consistent infant display.

To regenerate, open the first sheet with Python openpyxl using data_only=True, map its first-row column names, select Month in [0,24], rename Month to months and Pxx to pxx. Six keys correspond to workbook basenames: weight-male, weight-female, length-male, length-female, head-male, head-female.

## Units and display

Weight is kilograms. Length and head circumference are centimetres. Length is recumbent length, not standing height. The data is sex-specific; when sex is unspecified, referenceSeries returns no reference curve while personal records remain available. Never average male/female curves.

Month coordinates are the source table's month values. Any straight line between adjacent monthly points is only a visual connection, not a daily WHO standard or a calculated clinical percentile. No reference extrapolation beyond 24 months. Personal measurements may be shown beyond that age without an out-of-range reference line. Do not compute diagnostic status, feeding targets, or a precise percentile from proximity to these rounded monthly curves. Prematurity correction is not implemented; clinicians should interpret measurements requiring corrected age.

Reference curves show population distributions, not a goal every baby must follow. The app is a family record tool and does not diagnose growth problems.

## Validation

Tests cover six complete monthly series, ordered ages and percentiles, nonpositive/out-of-range request handling, unknown sex, returned-data mutation isolation, and published WHO birth-table anchors. Independent PDF companions confirm boys' birth weight P3/P15/P50/P85/P97 = 2.5/2.9/3.3/3.9/4.3 kg and girls' birth head circumference = 31.7/32.7/33.9/35.1/36.1 cm.

WHO retains rights to its source materials. This app does not use the WHO logo or claim endorsement. Review WHO reuse terms before wider commercial distribution.
