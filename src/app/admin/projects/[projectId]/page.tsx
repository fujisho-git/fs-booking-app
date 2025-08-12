import ProjectAdminView from "@/components/ProjectAdminView";

// Next.jsが期待する正しい型定義
type PageProps = {
  params: { projectId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function ProjectAdminPage({ params }: PageProps) {
  
  return <ProjectAdminView projectId={params.projectId} />;

}