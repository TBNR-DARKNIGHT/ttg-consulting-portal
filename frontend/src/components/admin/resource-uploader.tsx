import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Link as LinkIcon, UploadCloud, Video } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { usePortalAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { COURSES, COURSE_2_MODULES } from '@/lib/courses';
import {
  completeAdminVideoUpload,
  createAdminLinkUpload,
  createAdminVideoUpload,
  getAdminResourceUploadOptions,
  putFileWithProgress,
  uploadAdminDocument,
  type AdminResourceMetadata,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NEW_VALUE = '__new__';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatSlugLabel(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function courseIdFromName(value: string) {
  const text = value.trim();
  const match = /^Course\s+([1-9][0-9]*)\s*:/i.exec(text);
  return match ? `course-${match[1]}` : slugify(text);
}

function moduleFromTitle(value: string) {
  const text = value.trim();
  if (!text) return null;
  const match = /^Module\s+([1-9][0-9]*)\s*:/i.exec(text);
  return {
    id: match ? `module-${match[1]}` : `module-${slugify(text)}`,
    title: text,
  };
}

export function AdminResourcesPage() {
  const { getToken } = usePortalAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'pdf' | 'video'>('pdf');
  const [dragging, setDragging] = useState(false);
  const [courseId, setCourseId] = useState('course-1');
  const [newCourse, setNewCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [newModule, setNewModule] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const options = useQuery({
    queryKey: ['admin-resource-upload-options'],
    queryFn: () => getAdminResourceUploadOptions(getToken),
  });

  const courses = options.data?.courses ?? COURSES.map((course) => course.id);
  const effectiveCourse = courseId === NEW_VALUE ? courseIdFromName(newCourse) : courseId;
  const modules =
    options.data?.modulesByCourse[effectiveCourse] ??
    (effectiveCourse === 'course-2' ? [...COURSE_2_MODULES] : []);
  const effectiveTopic = topic.trim();
  const parsedModule = moduleId === NEW_VALUE ? moduleFromTitle(newModule) : null;
  const isVideo = Boolean(file?.type.startsWith('video/'));

  const chooseFile = (next: File | null) => {
    if (file && next) return;
    if (next && next.type !== 'application/pdf' && !next.type.startsWith('video/')) {
      toast.error('Choose a PDF or video file');
      return;
    }
    setFile(next);
    if (next && !title) {
      setTitle(next.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    }
    setProgress(0);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (file || busy) return;
    chooseFile(event.dataTransfer.files[0] ?? null);
  };

  const selectCourse = (next: string) => {
    setCourseId(next);
    setModuleId('');
    setNewModule('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (source === 'file' && !file) return toast.error('Choose a PDF or video first');
    if (source === 'link' && !linkUrl.trim()) return toast.error('Enter a public file link');
    if (!effectiveCourse) return toast.error('Enter a course name');
    if (!effectiveTopic) return toast.error('Enter a topic name');
    if (!title.trim()) return toast.error('Enter a resource title');
    if (courseId === NEW_VALUE && !newCourse.trim()) return toast.error('Enter a course name');
    if (moduleId === NEW_VALUE && !newModule.trim()) return toast.error('Enter a module name');
    const metadata: AdminResourceMetadata = {
      title: title.trim(),
      description: description.trim(),
      courseId: effectiveCourse,
      topic: effectiveTopic,
      ...(moduleId && moduleId !== NEW_VALUE ? { moduleId } : {}),
      ...(parsedModule ? { moduleId: parsedModule.id, moduleTitle: parsedModule.title } : {}),
    };
    setBusy(true);
    setProgress(0);
    try {
      if (source === 'link') {
        const result = await createAdminLinkUpload(
          linkUrl.trim(),
          linkType,
          metadata,
          getToken,
        );
        toast.success(
          result.status === 'ready'
            ? 'Linked resource is ready'
            : 'Link accepted; the resource is processing',
        );
        setLinkUrl('');
      } else if (isVideo && file) {
        const created = await createAdminVideoUpload(file, metadata, getToken);
        if (!created.uploadUrl || !created.uploadId) throw new Error('Mux upload details were missing');
        await putFileWithProgress(created.uploadUrl, file, setProgress);
        let result = await completeAdminVideoUpload(created.resourceId, created.uploadId, getToken);
        for (
          let attempt = 0;
          attempt < 20 && !['ready', 'processing'].includes(result.status);
          attempt += 1
        ) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
          result = await completeAdminVideoUpload(created.resourceId, created.uploadId, getToken);
        }
        toast.success(
          result.status === 'ready'
            ? 'Video is ready'
            : 'Video uploaded; Mux is preparing playback',
        );
      } else if (file) {
        await uploadAdminDocument(file, metadata, getToken, setProgress);
        toast.success('PDF uploaded and added to resources');
      }
      chooseFile(null);
      setTitle('');
      setTopic('');
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      void options.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[69rem] space-y-8 px-6 py-8 md:px-10 md:py-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Upload Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add PDFs to Supabase Storage or videos to Mux.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Resource</CardTitle>
          <CardDescription>PDFs may be up to 50 MB. Videos upload directly to Mux.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-3">
              <Label>Source</Label>
              <Tabs
                value={source}
                onValueChange={(value) => setSource(value as 'file' | 'link')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <UploadCloud className="size-4" /> Upload file
                  </TabsTrigger>
                  <TabsTrigger value="link">
                    <LinkIcon className="size-4" /> File link
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {source === 'file' ? (
                <>
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="application/pdf,video/*"
                disabled={busy || Boolean(file)}
                onChange={onFileChange}
              />
              <div
                className={cn(
                  'flex min-h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                  dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20',
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (!file && !busy) setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                aria-disabled={busy || Boolean(file)}
              >
                <UploadCloud className="mb-3 size-7 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {file ? 'One file selected' : 'Drop a PDF or video here'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {file ? 'Upload it before selecting another file' : 'or choose one from your computer'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={busy || Boolean(file)}
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </Button>
              </div>
              {file && (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  {isVideo ? <Video className="size-4" /> : <FileText className="size-4" />}
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              )}
                </>
              ) : (
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="resource-link">Public file link</Label>
                    <Input
                      id="resource-link"
                      type="url"
                      required
                      placeholder="https://drive.google.com/file/d/…/view"
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Google Drive files must be shared with anyone who has the link.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linked-resource-type">File type</Label>
                    <select
                      id="linked-resource-type"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={linkType}
                      onChange={(event) => setLinkType(event.target.value as 'pdf' | 'video')}
                    >
                      <option value="pdf">PDF document</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input id="resource-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-topic">Topic</Label>
              <Input
                id="resource-topic"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-course">Course</Label>
              <select
                id="resource-course"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={courseId}
                onChange={(e) => selectCourse(e.target.value)}
              >
                {courses.map((id) => {
                  const known = COURSES.find((course) => course.id === id);
                  return (
                    <option key={id} value={id}>
                      {known ? `${known.shortLabel}: ${known.title}` : formatSlugLabel(id)}
                    </option>
                  );
                })}
                <option value={NEW_VALUE}>+ Create new course</option>
              </select>
              {courseId === NEW_VALUE && (
                <Input
                  aria-label="New course name"
                  placeholder="New course name"
                  required
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                />
              )}
              {courseId === NEW_VALUE && (
                <p className="text-xs text-muted-foreground">
                  Use the suggested format &quot;Course X: Course Title&quot;. New courses default
                  to paid access.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-module">Module</Label>
              <select
                id="resource-module"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
                value={moduleId}
                disabled={effectiveCourse !== 'course-2'}
                onChange={(e) => setModuleId(e.target.value)}
              >
                <option value="">No module</option>
                {modules.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
                <option value={NEW_VALUE}>+ Create New Module</option>
              </select>
              {moduleId === NEW_VALUE && (
                <Input
                  aria-label="New module"
                  placeholder="Module 5: Module Title"
                  required
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                />
              )}
              {moduleId === NEW_VALUE && (
                <p className="text-xs text-muted-foreground">
                  Use the suggested format &quot;Module X: Module Title&quot;.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {(busy || progress > 0) && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
              </div>
            )}
            <Button
              className="w-full sm:w-auto"
              disabled={
                busy ||
                !title.trim() ||
                (source === 'file' ? !file : !linkUrl.trim())
              }
            >
              <UploadCloud className="mr-2 size-4" />
              {busy ? 'Adding resource…' : source === 'file' ? 'Upload resource' : 'Add from link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
