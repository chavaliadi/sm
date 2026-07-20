# HANDOVER.md — Team Lead Review & Handover Document

**Module**: Project Configuration & Lifecycle Management (Junior Developer 1 Slice)  
**Branch**: `feature/project-configuration`  
**Target Branch**: `develop`  
**Status**: Ready for Code Review & PR Merge  

---

## 1. Module Overview & Features Completed

The Project Configuration & Lifecycle Management module acts as the core spine of the Sagarmala 2.0 Portal MVP. It manages base port-led infrastructure project profiles, classification, financial sanctions, stakeholder mapping, and lifecycle stage tracking.

### Completed Features:
1. **Guided Project Creation (`POST /projects`)**: Modal dialog validating required fields (`project_code`, `name`, `category`, `port_name`, `state`, `funding_model`, `estimated_cost`, `approved_cost`, `lifecycle_stage`, `stakeholder_info`). Enforces `project_code` uniqueness.
2. **Project Directory Workspace (`GET /projects`)**: Paginated data table with real-time search, category dropdown filter, lifecycle stage tabs (`INITIATION`, `APPRAISAL`, `SANCTIONED`, `UNDER_EXECUTION`, `COMPLETED`), and KPI summary cards.
3. **Consolidated Details View (`GET /projects/{id}`)**: Modal dialog displaying classification metrics (agency, geography, funding instrument), financial sanction status, stakeholder contact, and creation/update timestamps.
4. **Project Configuration Update (`PUT /projects/{id}`)**: Form update for project parameters and financial sanction revisions.
5. **Soft Deactivation (`DELETE /projects/{id}`)**: Confirmation modal setting `is_active = False` per Decision Rule D2.
6. **RBAC Security**: Protected by `require_permission("VIEW_PROJECTS")` and `require_permission("MANAGE_PROJECTS")`.

---

## 2. Technical Stack & Implementation Files

### Backend (FastAPI + SQLModel)
- `backend/app/models/project.py`: `Project` SQLModel table (`__tablename__ = "projects"`).
- `backend/app/schemas/project.py`: `ProjectCreate`, `ProjectUpdate`, `ProjectRead`.
- `backend/app/services/projects.py`: Service functions (`list_projects`, `get_project_by_id`, `get_project_by_code`, `create_project`, `update_project`, `delete_project`).
- `backend/app/api/projects.py`: FastAPI router under `/projects`.

### Frontend (React + Vite + TypeScript)
- `frontend/src/types/index.ts`: TypeScript interfaces mirroring backend Pydantic schemas.
- `frontend/src/api/portal.ts`: API call functions.
- `frontend/src/features/projects/ProjectFormDialog.tsx`: Guided creation/editing dialog.
- `frontend/src/features/projects/ProjectDetailsDialog.tsx`: Consolidated profile view dialog.
- `frontend/src/pages/ProjectsPage.tsx`: Projects workspace page.

---

## 3. Permissions Used

- `VIEW_PROJECTS`: Granted to Admin, Port Authority, SMFCL, and Ministry roles for read access.
- `MANAGE_PROJECTS`: Granted to Admin and Port Authority roles for create, update, and delete access.

---

## 4. Dependencies & Coordination Points

- **DPR Workflow Integration (Junior 2)**: During Days 15–17 integration pass, DPR approval events will trigger updates to `Project.lifecycle_stage`.
- **Database Seed Data (Junior 4)**: Coordinate with Junior 4 to populate sample projects in `seed.py`.
- **Alembic Migration (Team Lead)**: In accordance with Decision Rule D8, no migration was generated on this feature branch; the `Project` model in `project.py` is ready for migration generation upon merge into `develop`.

---

## 5. Reviewer Verification Checklist for Team Lead

1. Run `python bootstrap_rbac.py` in `backend/` if not already initialized.
2. Sign in at `http://localhost:5173/login` using `admin@sagarmala.gov.in` / `admin123`.
3. Navigate to `http://localhost:5173/projects`.
4. Test creating a new project, editing an existing project, searching/filtering, and deactivating a project.
