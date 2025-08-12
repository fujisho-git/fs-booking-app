// src/app/admin/projects/[projectId]/page.tsx
import ProjectAdminView from "@/components/ProjectAdminView";

export default function ProjectAdminPage({ params }: { params: { projectId: string } }) {
  
  // サーバーコンポーネントで安全に `projectId` を取り出し、
  // クライアントコンポーネントにプロパティとして渡す
  return <ProjectAdminView projectId={params.projectId} />;

}