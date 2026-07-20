# Shashank — DPR Submission & Approval Workflow — Work Spec

**Module:** DPR Submission & Approval Workflow  
**Branch:** `feature/dpr-workflow`  
**Files you own:**
- `backend/app/models/dpr.py`
- `backend/app/schemas/dpr.py`
- `backend/app/services/dpr.py`
- `backend/app/api/dpr.py`

---

## ✅ Phase 1: Backend — COMPLETE

The full DPR state machine is implemented:

### Files Modified

| File | Changes |
|------|---------|
| `backend/app/models/dpr.py` | Added `old_status`/`new_status` to DPRAuditLog, default DRAFT status, removed unique constraint on project_id |
| `backend/app/schemas/dpr.py` | Added `DPRStatus` enum, `VALID_TRANSITIONS` map, `DPRCreate`, `DPRReviewRequest`, `ReviewDecision` enum, enriched `DPRAuditLogRead` |
| `backend/app/services/dpr.py` | Full state machine: `create_dpr`, `submit_dpr`, `smfcl_review`, `ministry_review`, `smfcl_requeue_after_ministry_rejection`, `release_funds`, `delete_dpr`, `list_dprs`, `get_dpr`, `get_dpr_audit_trail` |
| `backend/app/api/dpr.py` | 10 endpoints with RBAC: POST, GET list, GET single, GET audit-trail, PUT submit, PUT smfcl-review, PUT ministry-review, PUT smfcl-requeue, PUT release-funds, DELETE |

### Endpoints

```
POST   /dpr                        → MANAGE_DPR      → Creates DPR in DRAFT
GET    /dpr                        → VIEW_DPR        → List (filter by ?project_id)
GET    /dpr/{id}                   → VIEW_DPR        → Single DPR
GET    /dpr/{id}/audit-trail       → VIEW_DPR        → Audit history
PUT    /dpr/{id}/submit            → MANAGE_DPR      → DRAFT → SMFCL_REVIEW
PUT    /dpr/{id}/smfcl-review      → REVIEW_DPR      → Approve/Reject by SMFCL
PUT    /dpr/{id}/ministry-review   → REVIEW_DPR      → Approve/Reject by Ministry
PUT    /dpr/{id}/smfcl-requeue     → REVIEW_DPR      → REJECTED_BY_MINISTRY → SMFCL_REVIEW
PUT    /dpr/{id}/release-funds     → REVIEW_DPR      → APPROVED → FUNDS_RELEASED
DELETE /dpr/{id}                   → MANAGE_DPR      → Soft-delete (DRAFT only)
```

### Features Implemented
- ✅ Strict state machine — illegal transitions blocked with clear errors
- ✅ Version incrementing on resubmission after SMFCL rejection
- ✅ Audit trail row for every transition (actor, old/new status, comment, timestamp)
- ✅ Notifications fire on reject/approve/funds-released
- ✅ Soft-delete only in DRAFT state

---

## ⬜ Phase 2: Integration (Days 5–8)

### Task 1: DPR ↔ Project Lifecycle Integration

When a DPR reaches `APPROVED`, update the linked project's `lifecycle_stage`:

```python
# In services/dpr.py — inside ministry_review() after approval:
if decision == "approve":
    project = session.get(Project, dpr.project_id)
    if project:
        project.lifecycle_stage = "sanctioned"
        project.updated_at = datetime.utcnow()
        session.add(project)
```

When a DPR reaches `FUNDS_RELEASED`, update lifecycle again:

```python
# In services/dpr.py — inside release_funds():
project = session.get(Project, dpr.project_id)
if project:
    project.lifecycle_stage = "funded"
    project.updated_at = datetime.utcnow()
    session.add(project)
```

### Task 2: Auto-create Task on DPR Approval

When DPR is approved, auto-create a "Funds Disbursement" task:

```python
# In services/dpr.py — inside ministry_review() after approval:
from app.services.tasks import create_task_for_dpr

create_task_for_dpr(
    session,
    project_id=dpr.project_id,
    title=f"Funds Disbursement — DPR #{dpr.id}",
    description=f"Process fund release for approved DPR #{dpr.id}. Ministry approval received.",
)
```

**Dependency:** Wait for Jayanth to implement `create_task_for_dpr()` in `services/tasks.py`.

### Task 3: Test Both Reject Paths

Verify these flows work end-to-end:

**Reject Path 1 — SMFCL Rejection:**
```
Create DPR (DRAFT) → Submit (SMFCL_REVIEW) → SMFCL Rejects (REJECTED_BY_SMFCL)
→ Port Authority Resubmits (SMFCL_REVIEW, version=2) → SMFCL Approves (FORWARDED_TO_MINISTRY)
```
Verify: version incremented to 2, audit trail shows reject + resubmit entries.

**Reject Path 2 — Ministry Rejection:**
```
DPR in FORWARDED_TO_MINISTRY → Ministry Rejects (REJECTED_BY_MINISTRY)
→ SMFCL Requeues (SMFCL_REVIEW) → SMFCL Approves again (FORWARDED_TO_MINISTRY)
→ Ministry Approves (APPROVED)
```
Verify: audit trail shows ministry reject + requeue + re-approval.

---

## ⬜ Phase 3: Frontend Wiring (Days 9–12)

### Task 4: Wire DPR Page to Backend API

Connect `frontend/src/pages/DprsPage.tsx` to real API endpoints:

- DPR list → `GET /dpr`
- Create DPR → `POST /dpr` 
- Submit DPR → `PUT /dpr/{id}/submit`
- SMFCL Review → `PUT /dpr/{id}/smfcl-review` with decision + comment
- Ministry Review → `PUT /dpr/{id}/ministry-review` with decision + comment
- Release Funds → `PUT /dpr/{id}/release-funds`
- Delete DPR → `DELETE /dpr/{id}`

### Task 5: DPR Audit Trail View

Add a timeline/history view for each DPR showing:
- All status transitions
- Who did what and when
- Comments/observations at each step
- Use `GET /dpr/{id}/audit-trail` endpoint

### Task 6: Role-Based UI

Show/hide action buttons based on user role:
- **Port Authority:** sees Create, Submit, Resubmit buttons
- **SMFCL:** sees Review (approve/reject), Requeue, Release Funds buttons
- **Ministry:** sees Review (approve/reject) button
- **Admin:** sees everything
- Hide buttons for actions that are invalid for current DPR status

---

## ⬜ Phase 4: Polish (Days 13–15)

### Task 7: Demo Script Rehearsal

Run through the full demo script (from project plan Section 15):
1. Admin creates project
2. Port Authority creates + submits DPR
3. SMFCL rejects → Port Authority resubmits
4. SMFCL approves → forwards to Ministry
5. Ministry approves → project stage updates + task auto-created
6. SMFCL releases funds → project stage updates
7. Show audit trail
8. Show dashboard
9. Show notifications

Time it. Note any UX issues. Fix them.

### Task 8: Edge Case Bulletproofing

- Verify all illegal transitions return clear error messages
- Verify soft-delete blocked for non-DRAFT DPRs
- Verify RBAC blocks unauthorized users
- Verify version incrementing works after multiple rejections
