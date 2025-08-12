// src/components/CourseForm.tsx
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp, DocumentData } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEffect } from 'react';

// 講座の型定義
export type Course = {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// バリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(2, { message: '講座名は2文字以上で入力してください。' }),
  description: z.string().optional(),
  icon: z.string().min(1, { message: 'アイコンIDを入力してください。' }),
});

type CourseFormProps = {
  projectId: string;
  course?: Course; // 編集対象の講座データ（新規作成時はundefined）
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (course: DocumentData) => void;
}

export function CourseForm({ projectId, course, isOpen, onOpenChange, onSuccess }: CourseFormProps) {
  const isEditMode = !!course;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: course?.title || '',
      description: course?.description || '',
      icon: course?.icon || 'book-open',
    },
  });

  // isEditModeまたはisOpenが変わった時にフォームの値をリセット
  // これにより、新規→編集→新規と切り替えてもフォームの値が正しくなる
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    form.reset({
      title: course?.title || '',
      description: course?.description || '',
      icon: course?.icon || 'book-open',
    });
  }, [isEditMode, isOpen, course, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode) {
        // 更新処理
        const courseRef = doc(db, 'projects', projectId, 'courses', course.id);
        await updateDoc(courseRef, { ...values, updatedAt: serverTimestamp() });
        onSuccess({ id: course.id, ...values });
      } else {
        // 新規作成処理
        const coursesCollection = collection(db, 'projects', projectId, 'courses');
        const docRef = await addDoc(coursesCollection, {
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        onSuccess({ id: docRef.id, ...values });
      }
      onOpenChange(false); // フォームを閉じる
    } catch (error) {
      console.error("講座の保存に失敗しました:", error);
      alert("エラーが発生しました。");
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6 sm:p-8">
        <SheetHeader>
          <SheetTitle>{isEditMode ? '講座の編集' : '新規講座の作成'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? '講座の情報を変更します。' : '新しい講座を作成します。'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>講座名</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アイコンID</FormLabel>
                  <FormControl><Input placeholder="例: book-open, laptop" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-6">
               <SheetClose asChild>
                <Button type="button" variant="secondary">キャンセル</Button>
              </SheetClose>
              <Button type="submit">
                {isEditMode ? '保存する' : '作成する'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}