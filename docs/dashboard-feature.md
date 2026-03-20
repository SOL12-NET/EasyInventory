# Dashboard Feature

## Goal

Add a `Dashboard` page to the Appsmith app that gives a director-oriented overview of inventory, without introducing access control yet.

The feature must support:
- global overview across all items
- location-specific overview using an optional location filter
- total item count
- counts per status
- count of items missing a front photo

## Intended UX

Entry point:
- Main page menu item labeled with `{{jsActions.i18n("Dashboard")}}`
- clicking it navigates to `Dashboard`

Dashboard page content:
- a back action to return to `Main`
- a location filter input
- blank location filter means "all locations"
- exact location value means "only items at this location"
- cards or stat blocks for:
  - total items
  - one count per status
  - missing front photo count
- a note when the dashboard is computed from a bounded fetch instead of the full table

## Existing App Hooks

Already present on `dev`:
- menu item in `pages/Main/widgets/cntSearchBar/MenuButton1.json`
- i18n keys in `pages/init/jsobjects/i18n/i18n.js`

Not yet present on `dev`:
- `pages/Dashboard/...`
- dashboard query
- dashboard JS object
- dashboard widgets/layout

## Data Source Contract

The dashboard should use the same direct-Baserow pattern as the rest of the app:
- datasource: `BaserowAPI`
- auth: `Authorization: JWT {{appsmith.store.JWT.access}}`
- table id source: `appsmith.store.TID.items`
- `user_field_names=true`

Baseline query shape:

```text
GET /api/database/rows/table/{{appsmith.store.TID.items}}/
```

Recommended query parameters:
- `user_field_names=true`
- bounded `size`

The dashboard logic should compute aggregates client-side from the returned item rows.

## Canonical Metrics

Total items:
- count of filtered item rows

Counts per status:
- group filtered rows by `item.status?.value` when status is a select/link object
- tolerate missing status by counting it separately or ignoring it explicitly

Missing front photo:
- count filtered rows where the canonical front-photo field is empty

Location filter:
- filter on the row `location` value after fetch
- blank filter means no filtering

## Current Branch Risks

These are the known issues on `dev` before implementation:

1. Front-photo field is not settled on this branch.
   - `jsActions.setPhotoFront()` and `setPhotoObsolete()` still patch `items.photos`
   - production logic had been moved back to `items.photo_card`
   - the dashboard cannot define "missing front" safely until `dev` chooses one canonical field

2. Photo obsolete semantics are stale on this branch.
   - `qGetPhotos` still filters `filter__is_obsolete__boolean`
   - writes in `jsActions` use `Active`
   - this does not directly block the dashboard if it only reads items, but it shows the branch is behind the current schema contract

3. The menu already links to `Dashboard`, but the page does not exist.
   - navigation is already wired
   - implementation must create the page before the branch is usable

4. Aggregate correctness depends on fetch size.
   - if the dashboard uses a bounded single-page fetch, counts are only correct within that bound
   - if exact totals are required, the implementation must page through the whole table or use a backend aggregate path later

## Recommended Implementation Shape

1. Create `pages/Dashboard/Dashboard.json`
2. Add `pages/Dashboard/queries/qDashboardItems/metadata.json`
3. Add `pages/Dashboard/jsobjects/jsDashboard/jsDashboard.js`
4. Keep computation client-side for v1
5. Show a truncation warning if fetch size is capped
6. Resolve the front-photo field mismatch before finalizing "missing front"

## Definition Of Done

The feature is complete when:
- the `Dashboard` page exists
- the Main menu opens it successfully
- totals render for all items
- location filter changes the aggregates
- status counts render correctly
- missing-front count is based on the agreed canonical front-photo field
- no new auth mechanism is introduced beyond the existing Baserow JWT flow
