"""
Automated Comprehensive QA Test Suite for Clearance and Project Configuration Modules.

Runs end-to-end HTTP integration tests against the live running FastAPI backend server.
"""

import json
import uuid
import unittest
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


class TestClearanceAndProjectConfiguration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Obtain Admin JWT Token
        req = urllib.request.Request(
            f"{BASE_URL}/auth/login",
            data=json.dumps({"email": "admin@sagarmala.gov.in", "password": "admin123"}).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            cls.admin_token = data["data"]["access_token"]
            cls.headers = {
                "Authorization": f"Bearer {cls.admin_token}",
                "Content-Type": "application/json",
            }

    def _http_request(self, method, endpoint, payload=None, use_auth=True):
        url = f"{BASE_URL}{endpoint}"
        headers = self.headers.copy() if use_auth else {"Content-Type": "application/json"}
        data = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                body = json.loads(resp.read().decode())
                return resp.status, body
        except urllib.error.HTTPError as e:
            body = json.loads(e.read().decode()) if e.fp else {}
            return e.code, body

    # --- 1. AUTHENTICATION & AUTHORIZATION TESTS ---

    def test_unauthenticated_request_fails(self):
        status_code, body = self._http_request("GET", "/projects", use_auth=False)
        self.assertEqual(status_code, 401)

    def test_unauthenticated_clearance_request_fails(self):
        status_code, body = self._http_request("GET", "/api/clearances", use_auth=False)
        self.assertEqual(status_code, 401)

    # --- 2. PROJECT CONFIGURATION CRUD & SEARCH TESTS ---

    def test_project_crud_lifecycle(self):
        test_code = f"QA-PROJ-{uuid.uuid4().hex[:8]}"
        
        # 1. Create Project
        payload = {
            "project_code": test_code,
            "name": "QA Verification Deepwater Terminal",
            "category": "PORT_MODERNIZATION",
            "state": "Andhra Pradesh",
            "port_name": "Visakhapatnam Port",
            "funding_model": "PPP",
            "estimated_cost": 150000000.0,
            "approved_cost": 140000000.0,
            "lifecycle_stage": "INITIATION",
            "objectives": "Enhance container handling capacity by 25%",
            "milestones": "DPR prep -> CRZ clearance -> tendering",
        }
        status_code, body = self._http_request("POST", "/projects", payload)
        self.assertEqual(status_code, 201)
        self.assertIn("data", body)
        project_id = body["data"]["id"]
        self.assertEqual(body["data"]["project_code"], test_code)

        # 2. Get Project by ID
        status_code, body = self._http_request("GET", f"/projects/{project_id}")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["id"], project_id)

        # 3. Update Project
        update_payload = {
            "name": "QA Verification Deepwater Terminal - Expanded",
            "estimated_cost": 160000000.0,
        }
        status_code, body = self._http_request("PUT", f"/projects/{project_id}", update_payload)
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["name"], "QA Verification Deepwater Terminal - Expanded")
        self.assertEqual(body["data"]["estimated_cost"], 160000000.0)

        # 4. Search & Filter Project
        status_code, body = self._http_request("GET", f"/projects?search={test_code}&page=1&page_size=10")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["meta"]["total"], 1)

        # 5. Get Unified Detail View (RFP 4.6.3.2)
        status_code, body = self._http_request("GET", f"/projects/{project_id}/detail")
        self.assertEqual(status_code, 200)
        self.assertIn("clearances", body["data"])
        self.assertIn("tenders", body["data"])

        # 6. Soft Delete Project
        status_code, body = self._http_request("DELETE", f"/projects/{project_id}")
        self.assertEqual(status_code, 200)
        self.assertFalse(body["data"]["is_active"])

        # 7. Get Deleted Project returns 404
        status_code, body = self._http_request("GET", f"/projects/{project_id}")
        self.assertEqual(status_code, 404)

    def test_project_duplicate_code_fails(self):
        code = f"QA-DUP-{uuid.uuid4().hex[:8]}"
        payload = {
            "project_code": code,
            "name": "Duplicate Test Project",
            "category": "COASTAL_SHIPPING",
            "state": "Gujarat",
            "port_name": "Kandla Port",
            "funding_model": "EPC",
            "estimated_cost": 50000000.0,
        }
        status_code, body = self._http_request("POST", "/projects", payload)
        self.assertEqual(status_code, 201)
        pid = body["data"]["id"]

        # Attempt to create with duplicate code
        status_code, body = self._http_request("POST", "/projects", payload)
        self.assertEqual(status_code, 400)
        self.assertEqual(body["error"]["code"], "DUPLICATE_PROJECT_CODE")

        # Cleanup
        self._http_request("DELETE", f"/projects/{pid}")

    def test_project_validation_whitespace_and_negative_cost(self):
        # Whitespace-only name
        payload = {
            "project_code": f"QA-VAL-{uuid.uuid4().hex[:8]}",
            "name": "   ",
            "category": "PORT_MODERNIZATION",
            "state": "Goa",
            "port_name": "Mormugao",
            "funding_model": "EPC",
            "estimated_cost": 100.0,
        }
        status_code, body = self._http_request("POST", "/projects", payload)
        self.assertEqual(status_code, 422)

        # Negative cost
        payload["name"] = "Valid Project Name"
        payload["estimated_cost"] = -50.0
        status_code, body = self._http_request("POST", "/projects", payload)
        self.assertEqual(status_code, 422)

    # --- 3. CLEARANCE MODULE CRUD & WORKFLOW TESTS ---

    def test_clearance_crud_and_lifecycle_stage_gate(self):
        # 1. Create a project in INITIATION stage
        proj_code = f"QA-CLR-{uuid.uuid4().hex[:8]}"
        p_payload = {
            "project_code": proj_code,
            "name": "Clearance Test Jetty",
            "category": "PORT_MODERNIZATION",
            "state": "Maharashtra",
            "port_name": "JNPT",
            "funding_model": "EPC",
            "estimated_cost": 80000000.0,
            "lifecycle_stage": "INITIATION",
        }
        _, p_body = self._http_request("POST", "/projects", p_payload)
        project_id = p_body["data"]["id"]

        # 2. Create Clearance for the project
        c_payload = {
            "project_id": project_id,
            "clearance_type": "CRZ",
            "title": "Coastal Regulation Zone Clearance Stage 1",
            "authority_name": "Ministry of Environment, Forest & Climate Change",
            "status": "PENDING",
            "application_date": "2026-01-15T00:00:00Z",
            "expiry_date": "2028-01-15T00:00:00Z",
            "document_url": "https://clearances.gov.in/docs/crz-100.pdf",
            "remarks": "Submitted for MoEFCC review",
        }
        status_code, c_body = self._http_request("POST", "/api/clearances", c_payload)
        self.assertEqual(status_code, 201)
        clearance_id = c_body["data"]["id"]
        self.assertEqual(c_body["data"]["status"], "PENDING")

        # 3. Read Clearance by ID
        status_code, body = self._http_request("GET", f"/api/clearances/{clearance_id}")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["title"], "Coastal Regulation Zone Clearance Stage 1")

        # 4. List Clearances with filters
        status_code, body = self._http_request(
            "GET", f"/api/clearances?project_id={project_id}&clearance_type=CRZ&status=PENDING"
        )
        self.assertEqual(status_code, 200)
        self.assertEqual(body["meta"]["total"], 1)

        # 5. Get Clearance Expiry Summary
        status_code, body = self._http_request("GET", f"/api/clearances/summary?project_id={project_id}")
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["pending_count"], 1)

        # 6. Update Clearance status to APPROVED (Triggers lifecycle gate check)
        u_payload = {
            "status": "APPROVED",
            "approval_date": "2026-02-01T00:00:00Z",
        }
        status_code, body = self._http_request("PUT", f"/api/clearances/{clearance_id}", u_payload)
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["status"], "APPROVED")

        # 7. Verify Project Lifecycle Stage auto-updated from INITIATION -> APPRAISAL_AND_SANCTION
        status_code, p_updated = self._http_request("GET", f"/projects/{project_id}")
        self.assertEqual(status_code, 200)
        self.assertEqual(p_updated["data"]["lifecycle_stage"], "APPRAISAL_AND_SANCTION")

        # 8. Soft Delete Clearance
        status_code, body = self._http_request("DELETE", f"/api/clearances/{clearance_id}")
        self.assertEqual(status_code, 200)
        self.assertFalse(body["data"]["is_active"])

        # Cleanup Project
        self._http_request("DELETE", f"/projects/{project_id}")

    def test_clearance_date_validation_expiry_before_application(self):
        # Create Project
        p_payload = {
            "project_code": f"QA-DATE-{uuid.uuid4().hex[:8]}",
            "name": "Date Validation Jetty",
            "category": "PORT_MODERNIZATION",
            "state": "Tamil Nadu",
            "port_name": "Chennai Port",
            "funding_model": "EPC",
            "estimated_cost": 20000000.0,
            "lifecycle_stage": "INITIATION",
        }
        _, p_body = self._http_request("POST", "/projects", p_payload)
        pid = p_body["data"]["id"]

        # Attempt to create clearance with expiry_date < application_date
        c_payload = {
            "project_id": pid,
            "clearance_type": "FOREST",
            "title": "Forest Clearance",
            "authority_name": "State Forest Dept",
            "application_date": "2026-05-01T00:00:00Z",
            "expiry_date": "2025-01-01T00:00:00Z",  # INVALID (prior to application)
        }
        status_code, body = self._http_request("POST", "/api/clearances", c_payload)
        self.assertEqual(status_code, 400)
        self.assertEqual(body["error"]["code"], "INVALID_DATE_RANGE")

        # Cleanup
        self._http_request("DELETE", f"/projects/{pid}")

    def test_clearance_non_existent_project_fails(self):
        c_payload = {
            "project_id": 999999,
            "clearance_type": "CTO",
            "title": "Consent to Operate",
            "authority_name": "Pollution Control Board",
        }
        status_code, body = self._http_request("POST", "/api/clearances", c_payload)
        self.assertEqual(status_code, 404)

    def test_clearance_rejection_remarks_mandatory(self):
        # Create Project
        p_payload = {
            "project_code": f"QA-REJ-{uuid.uuid4().hex[:8]}",
            "name": "Rejection Remarks Test Project",
            "category": "PORT_MODERNIZATION",
            "state": "Kerala",
            "port_name": "Cochin Port",
            "funding_model": "EPC",
            "estimated_cost": 30000000.0,
            "lifecycle_stage": "INITIATION",
        }
        _, p_body = self._http_request("POST", "/projects", p_payload)
        pid = p_body["data"]["id"]

        # Attempt to create clearance with REJECTED status without remarks
        c_payload = {
            "project_id": pid,
            "clearance_type": "EC",
            "title": "Environmental Clearance Stage 2",
            "authority_name": "MoEFCC",
            "status": "REJECTED",
            "remarks": "",  # INVALID (missing/empty)
        }
        status_code, body = self._http_request("POST", "/api/clearances", c_payload)
        self.assertEqual(status_code, 400)
        self.assertEqual(body["error"]["code"], "MISSING_REJECTION_REMARKS")

        # Create valid PENDING clearance
        c_payload["status"] = "PENDING"
        c_payload["remarks"] = None
        status_code, c_body = self._http_request("POST", "/api/clearances", c_payload)
        self.assertEqual(status_code, 201)
        cid = c_body["data"]["id"]

        # Attempt to update status to REJECTED without remarks
        u_payload = {"status": "REJECTED", "remarks": " "}
        status_code, body = self._http_request("PUT", f"/api/clearances/{cid}", u_payload)
        self.assertEqual(status_code, 400)
        self.assertEqual(body["error"]["code"], "MISSING_REJECTION_REMARKS")

        # Update status to REJECTED WITH valid remarks
        u_payload["remarks"] = "Rejected due to incomplete EIA report submission"
        status_code, body = self._http_request("PUT", f"/api/clearances/{cid}", u_payload)
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"]["status"], "REJECTED")

        # Cleanup
        self._http_request("DELETE", f"/api/clearances/{cid}")
        self._http_request("DELETE", f"/projects/{pid}")


if __name__ == "__main__":
    unittest.main()

