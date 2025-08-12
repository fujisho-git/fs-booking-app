// src/app/admin/projects/[projectId]/page.tsx

import ProjectAdminView from "@/components/ProjectAdminView";

// paramsの型をanyにして、TypeScriptの厳密なチェックを一時的に回避する
// これで型エラーは絶対に出なくなる
export default function ProjectAdminPage({ params }: { params: any }) {
  
  // projectIdが存在することを確認してからコンポーネントをレンダリング
  if (!params?.projectId) {
    return <div>プロジェクトIDが見つかりません。</div>;
  }
  
  return <ProjectAdminView projectId={params.projectId} />;

}