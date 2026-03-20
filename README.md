# EasyInventory Appsmith App

This repository is the Git Sync source of truth for the EasyInventory Appsmith app.

Current branch intent:
- `prod_appsmith_default`: production Appsmith state for the direct-Baserow stack
- `staging`: pre-production Appsmith state
- `dev`: implementation branch for larger app changes before they are promoted

The dashboard feature is specified in:
- [`docs/dashboard-feature.md`](docs/dashboard-feature.md)

Useful context already present in the app:
- Main menu entry for `Dashboard`
- i18n keys for dashboard labels
- existing Baserow JWT/table-id bootstrap flow on `init`

Public links:
- app: <https://inventory.manymakers.net>
- edit: <https://inventory.manymakers.net/applications/69b08554eacf785d60c64db2/pages/69b08554eacf785d60c64db9/edit>
