import { FlaskConical } from "lucide-react";
import { DirectoryList } from "@/pages/_shared/DirectoryList";

export default function ResearchersListPage(): JSX.Element {
  return (
    <DirectoryList
      role="researcher"
      title="Researchers"
      description="Find researchers by topic, department, and current availability."
      icon={FlaskConical}
    />
  );
}
