import { useEffect, useState } from "react";
import { getHealth } from "@/api/health";

/**
 * Scaffold verification page — proves the frontend can reach the backend.
 * Replace with the real Dashboard (Section 10 of the plan: Day 5 mock data,
 * wired to real endpoints incrementally).
 */
export function HomePage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    getHealth()
      .then((res) => {
        setStatus("ok");
        setDetail(res.status);
      })
      .catch((err) => {
        setStatus("error");
        setDetail(err instanceof Error ? err.message : "Unknown error");
      });
  }, []);

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-xl font-semibold text-gray-900">
        Project scaffold running
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        This page confirms the frontend can reach the FastAPI backend before
        any real module gets built.
      </p>
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm">
        <span className="font-medium">Backend health check: </span>
        {status === "loading" && <span className="text-gray-500">checking…</span>}
        {status === "ok" && (
          <span className="text-green-600">connected ({detail})</span>
        )}
        {status === "error" && (
          <span className="text-red-600">
            failed — is uvicorn running on port 8000? ({detail})
          </span>
        )}
      </div>
    </div>
  );
}
