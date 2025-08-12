// src/app/projects/[projectSlug]/page.tsx

import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { unstable_noStore as noStore } from 'next/cache';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, Clock, Users, Tv } from 'lucide-react';

// 型定義
type Project = {
  id: string;
  projectName: string;
  icon: string;
  projectSlug?: string; // データに存在しない可能性も考慮
}

type Course = {
  id: string;
  title: string;
  description: string;
}

type Schedule = {
  id: string;
  dateTime: { toDate: () => Date; };
  capacities: {
    primary: number;
    [key: string]: number;
  };
}

// データ取得用の関数
async function getProjectDataBySlug(slug: string) {
  noStore(); // キャッシュを無効化
  console.log(`\n--- [Server] getProjectDataBySlug started for slug: "${slug}" ---`);

  try {
    const projectsRef = collection(db, 'projects');
    const allProjectsSnapshot = await getDocs(projectsRef);

    console.log(`[Server] Fetched ${allProjectsSnapshot.docs.length} project(s) in total.`);

    let projectDoc = null;
    for (const doc of allProjectsSnapshot.docs) {
      const docData = doc.data();
      // デバッグ用に取得した全データのprojectSlugを出力
      console.log(`[Server] Checking project: ID=${doc.id}, slug=${docData.projectSlug}`); 
      if (docData.projectSlug === slug) {
        projectDoc = doc;
        break;
      }
    }

    if (!projectDoc) {
      console.log(`[Server] FAILURE: Project with slug "${slug}" was not found.`);
      return null;
    }
    
    console.log(`[Server] SUCCESS: Found project with ID: ${projectDoc.id}`);
    const project = { id: projectDoc.id, ...projectDoc.data() } as Project;

    // 講座一覧を取得
    const coursesRef = collection(db, 'projects', project.id, 'courses');
    const coursesSnapshot = await getDocs(query(coursesRef, orderBy("title")));
    const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];

    // 各講座に紐づく日程一覧を取得
    const coursesWithSchedules = await Promise.all(
      courses.map(async (course) => {
        const schedulesRef = collection(db, 'projects', project.id, 'courses', course.id, 'schedules');
        const schedulesSnapshot = await getDocs(query(schedulesRef, orderBy("dateTime")));
        const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
        return { ...course, schedules };
      })
    );
    
    console.log(`[Server] Data fetching complete. Returning data.`);
    return { project, courses: coursesWithSchedules };

  } catch (error) {
    console.error("[Server] CRITICAL ERROR during data fetching:", error);
    return null;
  }
}

// ページコンポーネント
export default async function ProjectPublicPage({ params }: { params: { projectSlug: string } }) {
  const data = await getProjectDataBySlug(params.projectSlug);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl text-gray-600">プロジェクトが見つかりませんでした。</h1>
      </div>
    );
  }

  const { project, courses } = data;

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            {project.projectName}
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">開催講座一覧</h2>
            {courses.length > 0 ? (
              <Accordion type="single" collapsible className="w-full bg-white rounded-lg shadow-md divide-y divide-gray-200">
                {courses.map(course => (
                  <AccordionItem value={course.id} key={course.id}>
                    <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:bg-slate-50">
                      {course.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pt-2 pb-6">
                      <p className="text-gray-600 mb-6">{course.description}</p>
                      
                      {course.schedules.length > 0 ? (
                        <div className="space-y-4">
                          {course.schedules.map(schedule => (
                            <div key={schedule.id} className="border p-4 rounded-lg flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2 font-semibold">
                                  <Calendar className="w-5 h-5 text-gray-700" />
                                  <span>{schedule.dateTime.toDate().toLocaleDateString('ja-JP')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{schedule.dateTime.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 開始</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                  <Users className="w-4 h-4" />
                                  <span>
                                    定員: {schedule.capacities.primary === -1 ? '無制限' : `${schedule.capacities.primary}名`}
                                  </span>
                                </div>
                                {schedule.capacities.pc_rental && (
                                   <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <Tv className="w-4 h-4" />
                                    <span>
                                      PCレンタル: {schedule.capacities.pc_rental}台
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <button className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
                                  申し込む
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">現在、開催予定の日程はありません。</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
                <p>現在、開催予定の講座はありません。</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}