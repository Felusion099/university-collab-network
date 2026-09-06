import { GraduationCap } from "lucide-react";
import { DirectoryList } from "@/pages/_shared/DirectoryList";

export default function StudentsListPage(): JSX.Element {
  return (
    <DirectoryList
      role="student"
      title="Students"
      description="Find students by department, skill, or what they're looking for."
      icon={GraduationCap}
    />
  );
}
