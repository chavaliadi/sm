import type { StakeholderRead } from "../../types";

interface StakeholderTableViewProps {
  stakeholders: StakeholderRead[];
  isLoading: boolean;
  onEdit?: (stakeholder: StakeholderRead) => void;
  onDelete?: (id: number) => void;
}

export function StakeholderTableView({
  stakeholders,
  isLoading,
  onEdit,
  onDelete,
}: StakeholderTableViewProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        Loading stakeholders...
      </div>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No stakeholders found.
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
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Organization
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Role
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Project ID
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">
              Contact Info
            </th>
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right font-medium text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {stakeholders.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900">#{s.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
              <td className="px-4 py-3 text-gray-600">{s.organization}</td>
              <td className="px-4 py-3 text-gray-600">{s.role}</td>
              <td className="px-4 py-3 text-gray-600">#{s.project_id}</td>
              <td className="px-4 py-3 text-gray-500">
                {s.contact_info ?? "—"}
              </td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right space-x-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
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
