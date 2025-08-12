'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, DocumentData } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';


// バリデーションスキーマにiconを追加
const formSchema = z.object({
  projectName: z.string().min(2, { message: 'プロジェクト名は2文字以上で入力してください。' }),
  projectSlug: z.string().min(2, { message: 'プロジェクトIDは2文字以上で入力してください。' }).regex(/^[a-z0-9-]+$/, { message: 'プロジェクトIDは小文字の英数字とハイフンのみ使用できます。'}),
  icon: z.string().min(2, { message: 'アイコンIDを2文字以上で入力してください。' }),
});

type AddProjectFormProps = {
  onSuccess: (newProject: DocumentData) => void;
}

export function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      projectSlug: '',
      icon: 'folder', // デフォルトのアイコンID
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const newProjectData = {
        projectName: values.projectName,
        projectSlug: values.projectSlug,
        icon: values.icon, // iconを保存
        ownerId: 'super-admin-user-id', // TODO: 認証機能実装後に実際のユーザーIDに置き換える
        managedResources: [
          { id: 'primary', label: '参加枠', isPrimary: true, unit: '名' },
        ],
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'projects'), newProjectData);
      onSuccess({ id: docRef.id, ...newProjectData });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('プロジェクトの作成に失敗しました:', error);
      alert('プロジェクトの作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          + 新規プロジェクト作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新規プロジェクト作成</DialogTitle>
          <DialogDescription>
            新しいプロジェクトの情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト名</FormLabel>
                  <FormControl><Input placeholder="例: 令和7年度 研修" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクトID (URLになります)</FormLabel>
                  <FormControl><Input placeholder="例: kenshu-2025" {...field} /></FormControl>
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
                  <FormControl><Input placeholder="例: briefcase, folder" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
               <DialogClose asChild>
                <Button type="button" variant="secondary">キャンセル</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '作成中...' : '作成する'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}