import type { StakeholderRead, ProjectRead } from "@/types";

interface StakeholderTableViewProps {
  stakeholders: StakeholderRead[];
  projectMap?: Record<number, ProjectRead>;
  isLoading: boolean;
  onEdit?: (stakeholder: StakeholderRead) => void;
  onDelete?: (id: number) => void;
}

export function StakeholderTableView({
  stakeholders,
  projectMap = {},
  isLoading,
  onEdit,
  onDelete,
}: StakeholderTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-gray-500">
        Loading stakeholders data…
      </div>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">No Stakeholders Found</p>
        <p className="mt-1">No stakeholder records match your search or filter criteria.</p>
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
                Name & Role
              </th>
              <th scope="col" className="px-4 py-3">
                Organization
              </th>
              <th scope="col" className="px-4 py-3">
                Project
              </th>
              <th scope="col" className="px-4 py-3">
                Contact Info
              </th>
              {(onEdit || onDelete) && (
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stakeholders.map((s) => {
              const project = projectMap[s.project_id];
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-[11px] text-gray-400">{s.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      {s.organization}
                    </span>
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
                  <td className="px-4 py-3 text-gray-600">
                    {s.contact_info ? (
                      <span>{s.contact_info}</span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(s)}
                          className="mr-3 text-xs font-semibold text-sky-700 hover:text-sky-900"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(s.id)}
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
