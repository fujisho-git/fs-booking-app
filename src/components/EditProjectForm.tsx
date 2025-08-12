'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
    
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

// managedResourcesのスキーマ
const resourceSchema = z.object({
  id: z.string(),
  label: z.string().min(1, { message: '必須です' }),
  unit: z.string().min(1, { message: '必須です' }),
  isPrimary: z.boolean(),
});

// フォーム全体のスキーマ
const formSchema = z.object({
  projectName: z.string().min(2, { message: 'プロジェクト名は2文字以上で入力してください。' }),
  projectSlug: z.string().min(2, { message: 'プロジェクトIDは小文字の英数字とハイフンのみで入力してください。' }).regex(/^[a-z0-9-]+$/),
  icon: z.string().min(1, { message: 'アイコンIDを入力してください。' }),
  managedResources: z.array(resourceSchema),
});

type Project = {
  id: string;
  projectName: string;
  projectSlug: string;
  icon: string;
  managedResources: z.infer<typeof resourceSchema>[];
}

type EditProjectFormProps = {
  project: Project;
  onProjectUpdate: (updatedData: Partial<Project>) => void;
}

export function EditProjectForm({ project, onProjectUpdate }: EditProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: project.projectName,
      projectSlug: project.projectSlug,
      icon: project.icon,
      managedResources: project.managedResources,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "managedResources",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', project.id);
      const updateData = {
        projectName: values.projectName,
        projectSlug: values.projectSlug,
        icon: values.icon,
        managedResources: values.managedResources,
      };
      await updateDoc(projectRef, updateData);

      onProjectUpdate(updateData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("プロジェクトの更新に失敗しました:", error);
      alert("プロジェクトの更新に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const addCustomResource = () => {
    append({
      id: `resource_${Date.now()}`,
      label: '',
      unit: '人',
      isPrimary: false,
    });
  };

  const primaryResourceIndex = fields.findIndex(field => field.isPrimary);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">プロジェクト設定</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6 sm:p-8">
        <SheetHeader>
          <SheetTitle>プロジェクト設定の編集</SheetTitle>
          <SheetDescription>プロジェクトの基本情報とリソースを管理します。</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            
            {/* プロジェクト名、ID、アイコンのFormField */}
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト名</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクトID</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* メインリソースの編集エリア */}
            <h4 className="text-lg font-semibold">メインリソース</h4>
            {primaryResourceIndex !== -1 && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`managedResources.${primaryResourceIndex}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>項目名</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`managedResources.${primaryResourceIndex}.unit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>単位</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <Separator />

            {/* カスタムリソースの編集エリア */}
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">カスタムリソース</h4>
              <Button type="button" variant="outline" size="sm" onClick={addCustomResource}>
                追加
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                !field.isPrimary && (
                  <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <div className="grid grid-cols-2 gap-4 flex-grow">
                      <FormField
                        control={form.control}
                        name={`managedResources.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>項目名</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`managedResources.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>単位</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>

            <SheetFooter className="pt-6">
               <SheetClose asChild>
                <Button type="button" variant="secondary">キャンセル</Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存する'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}