// src/components/ProjectAdminView.tsx
'use client'

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, deleteDoc, DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import CourseRow from '@/components/CourseRow';
import { EditProjectForm } from '@/components/EditProjectForm';
import { CourseForm, Course } from '@/components/CourseForm';
import { Button } from '@/components/ui/button';

// 型定義
type ManagedResource = { id: string; label: string; unit: string; isPrimary: boolean; };
type Project = { id: string; projectName: string; projectSlug: string; icon: string; managedResources: ManagedResource[]; };

// このコンポーネントが受け取るプロパティの型
type ProjectAdminViewProps = {
  projectId: string;
}

export default function ProjectAdminView({ projectId }: ProjectAdminViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);

  useEffect(() => {
    async function getProjectDetails() {
      // プロジェクト情報を取得
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
      } else {
        setIsLoading(false);
        return;
      }

      // 講座一覧を取得
      const coursesCollection = collection(db, 'projects', projectId, 'courses');
      const q = query(coursesCollection, orderBy("title"));
      const coursesSnapshot = await getDocs(q);
      const courseList = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];
      setCourses(courseList);
      setIsLoading(false);
    }
    getProjectDetails();
  }, [projectId]);

  const handleProjectUpdate = (updatedData: Partial<Project>) => {
    if (project) {
      setProject({ ...project, ...updatedData });
    }
  };

  const handleOpenForm = (course?: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = (newOrUpdatedCourse: DocumentData) => {
    if (editingCourse) {
      setCourses(courses.map(c => c.id === newOrUpdatedCourse.id ? newOrUpdatedCourse as Course : c));
    } else {
      setCourses([...courses, newOrUpdatedCourse as Course]);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'courses', courseId));
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error("講座の削除に失敗しました:", error);
      alert("エラーが発生しました。");
    }
  };


  if (isLoading) return <div className="p-8">読み込み中...</div>;
  if (!project) return <div>プロジェクトが見つかりません。</div>;

  return (
    <>
      <CourseForm
        projectId={project.id}
        course={editingCourse}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link href="/" className="text-blue-600 hover:underline">&larr; 管理ダッシュボードに戻る</Link>
              <h1 className="text-4xl font-bold text-gray-800 mt-2">{project.projectName}</h1>
              <p className="text-lg text-gray-500">プロジェクト管理</p>
            </div>
            <EditProjectForm project={project} onProjectUpdate={handleProjectUpdate} />
          </div>

          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenForm()} className="bg-green-600 hover:bg-green-700">
              + 新規講座を追加
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">講座名</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">説明</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <CourseRow 
                    key={course.id} 
                    course={{ ...course, projectId: project.id }} 
                    onEdit={() => handleOpenForm(course)}
                    onDelete={() => handleDeleteCourse(course.id)}
                  />
                ))}
              </tbody>
            </table>
            {courses.length === 0 && (
              <div className="text-center py-12 text-gray-500">まだ講座が登録されていません。</div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}