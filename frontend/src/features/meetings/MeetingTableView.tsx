import type { MeetingRead } from "../../types";

interface MeetingTableViewProps {
  meetings: MeetingRead[];
  isLoading: boolean;
  onEdit?: (meeting: MeetingRead) => void;
  onDelete?: (id: number) => void;
}

export function MeetingTableView({
  meetings,
  isLoading,
  onEdit,
  onDelete,
}: MeetingTableViewProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        Loading meeting records...
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No meetings found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              ID
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Title
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Date & Time
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Project ID
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Notes
            </th>
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right font-medium text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {meetings.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900">#{m.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{m.title}</td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(m.date).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-600">#{m.project_id}</td>
              <td className="px-4 py-3 text-gray-500">{m.notes ?? "—"}</td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right space-x-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
