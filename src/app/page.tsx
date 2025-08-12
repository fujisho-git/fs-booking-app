'use client'

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import { AddProjectForm } from '@/components/AddProjectForm';

// lucide-reactから使いたいアイコンをインポート
import { Briefcase, Folder, Image as ImageIcon } from 'lucide-react';

// 型定義のiconUrlをiconに変更
type Project = {
  id: string;
  projectName: string;
  projectSlug: string;
  icon: string; // iconUrlからiconに変更
};

// アイコン名に応じてアイコンコンポーネントを返すヘルパー関数
const IconComponent = ({ iconName }: { iconName: string }) => {
  switch (iconName) {
    case 'briefcase':
      return <Briefcase className="h-7 w-7 text-white" />;
    case 'folder':
      return <Folder className="h-7 w-7 text-white" />;
    // 他にも使いたいアイコンがあればここに追加
    // case 'school':
    //   return <School className="h-7 w-7 text-white" />;
    default:
      // 不明なアイコン名の場合はデフォルトのアイコンを表示
      return <ImageIcon className="h-7 w-7 text-white" />;
  }
};


export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getProjects() {
      setIsLoading(true);
      const projectsCollection = collection(db, 'projects');
      const q = query(projectsCollection, orderBy("createdAt", "desc"));
      const projectSnapshot = await getDocs(q);
      const projectList = projectSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      setProjects(projectList);
      setIsLoading(false);
    }
    getProjects();
  }, []);

  const handleAddProjectSuccess = (newProject: DocumentData) => {
    const projectToAdd: Project = {
      id: newProject.id,
      projectName: newProject.projectName,
      projectSlug: newProject.projectSlug,
      icon: newProject.icon || 'folder', // 新規作成時のデフォルトアイコン
    };
    setProjects(prevProjects => [projectToAdd, ...prevProjects]);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            管理ダッシュボード
          </h1>
          <AddProjectForm onSuccess={handleAddProjectSuccess} />
        </div>

        {isLoading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md">
            <ul role="list" className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link href={`/admin/projects/${project.id}`} className="block hover:bg-gray-50">
                    <div className="flex items-center px-4 py-4 sm:px-6">
                      
                      {/* === ここが画像からアイコンへの変更部分です === */}
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <IconComponent iconName={project.icon} />
                      </div>
                      
                      <div className="min-w-0 flex-1 px-4">
                        <p className="text-lg font-medium text-blue-700 truncate">{project.projectName}</p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          /projects/{project.projectSlug}
                        </p>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
               {projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  まだプロジェクトがありません。「新規プロジェクト作成」から始めましょう。
                </div>
              )}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}