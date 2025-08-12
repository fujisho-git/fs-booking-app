// src/components/CourseRow.tsx
'use client'

import { useState } from 'react'; // useEffectを削除
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// (型定義は変更なし)
type Course = { id: string; projectId: string; title: string; description: string; }
type Schedule = { id: string; dateTime: { toDate: () => Date; }; capacities: Record<string, number>; }
type CourseRowProps = { course: Course; onEdit: () => void; onDelete: () => void; }

export default function CourseRow({ course, onEdit, onDelete }: CourseRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSchedules = async () => {
    if (schedules.length > 0) return;
    setIsLoading(true);
    const schedulesCollection = collection(db, 'projects', course.projectId, 'courses', course.id, 'schedules');
    const q = query(schedulesCollection, orderBy("dateTime"));
    const schedulesSnapshot = await getDocs(q);
    const scheduleList = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
    setSchedules(scheduleList);
    setIsLoading(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) { fetchSchedules(); }
  };

  return (
    <>
      <tr className="group">
        <td className="px-6 py-4 cursor-pointer" onClick={handleToggle}>
          <div className="text-sm font-medium text-gray-900">{course.title}</div>
        </td>
        <td className="px-6 py-4 cursor-pointer max-w-md truncate" onClick={handleToggle}>
          <div className="text-sm text-gray-500">{course.description}</div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    講座「{course.title}」を削除します。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600">削除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      </tr>
      
      {isOpen && (
        <tr>
          <td colSpan={3} className="p-4 bg-gray-50/50">
            {isLoading && <p className="text-sm text-gray-500">日程を読み込み中...</p>}
            {!isLoading && schedules.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">開催日程</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {schedules.map(schedule => (
                    <li key={schedule.id}>
                      {schedule.dateTime.toDate().toLocaleString('ja-JP')}
                      <span className="ml-4 text-xs text-gray-600">
                        (定員: {schedule.capacities.primary === -1 ? '無制限' : `${schedule.capacities.primary}名`})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!isLoading && schedules.length === 0 && <p className="text-sm text-gray-500">この講座には日程が登録されていません。</p>}
          </td>
        </tr>
      )}
    </>
  );
}