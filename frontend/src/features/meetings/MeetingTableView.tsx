import type { MeetingRead, ProjectRead } from "@/types";

interface MeetingTableViewProps {
  meetings: MeetingRead[];
  projectMap?: Record<number, ProjectRead>;
  isLoading: boolean;
  onView?: (meeting: MeetingRead) => void;
  onEdit?: (meeting: MeetingRead) => void;
  onDelete?: (id: number) => void;
}

export function MeetingTableView({
  meetings,
  projectMap = {},
  isLoading,
  onView,
  onEdit,
  onDelete,
}: MeetingTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-gray-500">
        Loading meeting records…
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">No Meetings Found</p>
        <p className="mt-1">No meeting logs match your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Title & ID
              </th>
              <th scope="col" className="px-4 py-3">
                Project
              </th>
              <th scope="col" className="px-4 py-3">
                Date & Time
              </th>
              <th scope="col" className="px-4 py-3">
                Minutes Preview
              </th>
              {(onView || onEdit || onDelete) && (
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {meetings.map((m) => {
              const project = projectMap[m.project_id];
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{m.title}</div>
                    <div className="text-[11px] font-mono text-gray-400">
                      ID: #{m.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {project ? (
                      <div>
                        <div className="font-mono font-semibold text-sky-800">
                          {project.project_code}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px]">
                          {project.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">Unlinked</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700 font-medium">
                    {new Date(m.date).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">
                    {m.notes ? (
                      <p className="line-clamp-2 text-xs leading-snug">
                        {m.notes}
                      </p>
                    ) : (
                      <span className="italic text-gray-400">No notes recorded</span>
                    )}
                  </td>
                  {(onView || onEdit || onDelete) && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(m)}
                          className="mr-3 text-xs font-semibold text-sky-700 hover:text-sky-900"
                        >
                          View
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(m)}
                          className="mr-3 text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(m.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
