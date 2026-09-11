# Northern Lights District Command Center v12.10

## New: Commissioner Structure Dashboard

Adds a dedicated **Commissioner Corps** dashboard with:
- District Commissioner leadership and responsibilities
- Four geographic regions with ADC status
- Unit Commissioner assignments
- Clearly highlighted recruiting/open roles
- Roundtable leadership
- Venture Crew support
- Commissioner Corps summary and mission
- Commissioner recruiting contact
- Clickable assigned-unit pills that open the unit's 360° profile when that unit exists in the loaded active-unit roster

All v12.8.1 functionality remains: clickable KPI filters, sortable tables, metric exception filters, unit drill-down, dark command-center design, and sanitized Viewer publishing.

# Northern Lights District Command Center v12.8

District-specific version of the Glacier's Edge Council Command Center v12.5.

## Scope
- Locked to **Northern Lights 07**
- Unit drill-down from Overview and every detail table
- Dark operations-dashboard presentation
- Priority Indicators and R/Y/G health
- Five Unit Metrics exception filters: click a metric to show only units not meeting it
- Clickable KPI cards across Unit Metrics, Membership, Training, SYT, and Charter Renewal
- KPI clicks filter the detail table to only affected units; click the same card again or use Show all units to clear
- People-related Training/SYT cards identify the units containing those registrations without exposing names in the public Viewer
- Unique registered-adult headline count
- Membership, Training, SYT, Charter Renewal and Unit Metrics dashboards
- Needs Attention filter

## Data loading
The Admin dashboard accepts either Northern Lights-only exports or full Glacier's Edge Council exports. Full-council exports are automatically filtered to Northern Lights 07.

Load these five reports:
1. Unit Metrics
2. Trained Leaders
3. Safeguarding Youth
4. Charter Renewal
5. Membership Status

Unit Metrics + Charter Renewal define the authoritative active-unit roster.

## Publishing
Use Admin locally, generate `data.js`, replace `viewer/data.js`, and publish only the Viewer folder. Never publish raw roster CSVs or the Admin folder.


## v12.8 sortable tables
All dashboard table headers are clickable and keyboard-accessible. Click once for ascending order and again for descending. Numeric fields sort numerically; dates sort chronologically; unit names use natural-number sorting; health sorts Red → Yellow → Green.


## v12.8.1 Fix
- Restores and hardens clickable KPI cards across Unit Metrics, Membership, Trained Leaders, SYT, and Charter Renewal.
- KPI interactions now use delegated event handling so they survive dashboard re-renders and sorting.
- Retains v12.8 sortable table headers and all v12.7 filters/drill-down behavior.


## Updated Date
Admin and Viewer now display an **Updated** date in the header. Published Viewer data uses the generatedAt timestamp, so the date reflects when the sanitized dataset was generated.


## Adult Count Clarity
Adult figures are explicitly separated into **Unique Registered Adults** (deduplicated people by Member ID) and **Adult Registrations** (unit-registration records that can include the same person more than once). Membership now shows both values and includes an on-screen definition note. Charter adult totals are labeled as registrations.


## Membership Overview Accuracy Fix
The Overview membership card no longer displays a combined registration-record total as membership. It now shows Current Youth and Unique Registered Adults separately. Renewal/expiration values are explicitly labeled as registration records. A combined unique-person total is intentionally omitted because the Membership export does not contain youth Member IDs needed to deduplicate youth across units.
