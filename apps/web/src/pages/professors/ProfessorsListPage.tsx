import { Presentation } from "lucide-react";
import { DirectoryList } from "@/pages/_shared/DirectoryList";

export default function ProfessorsListPage(): JSX.Element {
  return (
    <DirectoryList
      role="professor"
      title="Professors"
      description="Browse faculty by department and areas of expertise."
      icon={Presentation}
    />
  );
}
