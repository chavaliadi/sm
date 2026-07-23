import type { ProjectRead } from "@/types";

interface ProjectSelectProps {
  projects: ProjectRead[];
  value: number | string | undefined;
  onChange: (projectId: number) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function ProjectSelect({
  projects,
  value,
  onChange,
  required = false,
  disabled = false,
  id = "project_id",
  name = "project_id",
  className = "",
}: ProjectSelectProps) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-gray-100 ${className}`}
    >
      <option value="" disabled>
        -- Select Project --
      </option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.project_code} – {project.name}
        </option>
      ))}
    </select>
  );
}
