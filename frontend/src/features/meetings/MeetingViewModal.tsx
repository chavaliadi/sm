import { useEffect } from "react";
import type { MeetingRead, ProjectRead } from "@/types";

interface MeetingViewModalProps {
  meeting: MeetingRead;
  project?: ProjectRead;
  onClose: () => void;
}

export function MeetingViewModal({
  meeting,
  project,
  onClose,
}: MeetingViewModalProps) {
  // ESC key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formattedDate = meeting.date
    ? new Date(meeting.date).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "Date not specified";

  // Helper to render notes text with visual emphasis on known section headings without NLP parsing
  const renderNotesContent = (notesText: string | null) => {
    if (!notesText || !notesText.trim()) {
      return (
        <p className="italic text-gray-400">
          No meeting notes or minutes were recorded for this session.
        </p>
      );
    }

    const lines = notesText.split("\n");
    const headingRegex =
      /^(agenda|discussion|decisions|decision|action items|action item|next meeting|attendees|additional notes|location|meeting details|summary):?/i;

    return (
      <div className="space-y-2 text-xs leading-relaxed text-gray-800 whitespace-pre-wrap font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (headingRegex.test(trimmed)) {
            return (
              <div
                key={idx}
                className="pt-2 font-semibold text-gray-900 border-b border-gray-100 text-xs tracking-wide uppercase text-sky-800"
              >
                {line}
              </div>
            );
          }
          return <div key={idx}>{line}</div>;
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl transition-all my-8">
        {/* Close X Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md hover:bg-gray-100"
          aria-label="Close dialog"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-sky-800">
              Meeting #{meeting.id}
            </span>
            {project && (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-gray-700">
                {project.project_code}
              </span>
            )}
          </div>
          <h2
            id="meeting-modal-title"
            className="mt-2 text-xl font-bold text-gray-900"
          >
            {meeting.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>📅 {formattedDate}</span>
            {project && (
              <span>
                🏗️ <strong className="text-gray-700">{project.name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body - Complete Minutes of Meeting */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Minutes of Meeting / Notes
          </h3>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            {renderNotesContent(meeting.notes)}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
