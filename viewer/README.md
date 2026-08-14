# Glacier's Edge Council — Northern Lights District Dashboard v7

This version is built for the updated Northern Lights report set and has five left-panel dashboards:

1. Overview
2. Unit Metrics
3. Trained Leaders
4. Safeguarding Youth Training
5. Charter Renewal

## Global Unit Selector

A persistent Unit Selector appears at the top of every dashboard.

- Select **All Units** for the district-wide view.
- Select a Pack, Troop, Crew, or Ship to filter every dashboard to that unit where matching data exists.
- The indicator next to the dropdown always shows the active unit.

Unit matching normalizes values such as `Troop 0035` and `Troop 35` to the same internal unit key.

## Training Filter

The Trained Leaders dashboard includes both:

- a dropdown option for **Untrained direct-contact leaders only**
- a shortcut button: **Show Untrained Direct Contact Only**

This filters to records where:
- `Direct_Contact_Leader = YES`
- `Trained != YES`

## Updated Data Sources

The site recognizes the current formats for:

- Unit Metrics Snapshot
- Trained Leaders Status
- Safeguarding Youth Training Aging Report
- Unit Renewal Status Report

## Privacy

The browser does not display street addresses, email addresses, or phone numbers from the SYT roster. CSV files are processed locally and are not uploaded by the dashboard.

## GitHub Pages

Upload `index.html`, `style.css`, and `script.js` to the repository. Do not upload roster CSV exports to a public repository.


## v7.1 Active Unit Authority

Unit Metrics and Charter Renewal are now the authoritative sources for active unit numbers.

- Training-only units do not create dashboard units.
- SYT-only units do not create dashboard units.
- Overview `Units in View` comes only from Unit Metrics / Charter Renewal.
- If historical or inactive units are present in Training or SYT, their unit-assigned records are ignored for active-unit dashboard calculations.
- The source indicator reports how many inactive training/SYT unit keys were ignored.


## v7.2 Unit Health KPI Display

The Unit Metrics health KPIs now display both the unit count and percentage of units in the current view.

Example:
- Green: `5 (11%)`
- Yellow: `23 (49%)`
- Red: `19 (40%)`

Percentages automatically recalculate when the global Unit Selector changes the current view.
