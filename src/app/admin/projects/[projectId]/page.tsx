import ProjectAdminView from "@/components/ProjectAdminView";

// このページはサーバーコンポーネントなのでasyncにする
export default async function ProjectAdminPage({ params }: { params: { projectId: string } }) {
  
  // paramsからprojectIdを安全に取り出す
  const { projectId } = params;

  // 取り出したprojectIdをクライアントコンポーネントに渡す
  return <ProjectAdminView projectId={projectId} />;

}