import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHomePage,
});

function DashboardHomePage() {
  const { user } = usePortalAuth();
  const first = user?.firstName?.trim() || (user?.email ? user.email.split('@')[0] : null);
  const wave = String.fromCodePoint(0x1f44b);

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-indigo">
            Your learning dashboard
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Welcome{first ? ` Back, ${first}` : ''} {wave}
          </h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            Start by choosing one of the courses below. Both courses are open to explore, and an
            account is only needed for saved progress and account tools.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2" aria-labelledby="choose-course-heading">
          <h2 id="choose-course-heading" className="sr-only">
            Choose a course
          </h2>

          <Card className="flex h-full flex-col border-border shadow-sm">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-sage/20 text-brand-dark">
                <BookOpen className="size-5" aria-hidden />
              </div>
              <CardDescription>Open Course</CardDescription>
              <CardTitle className="font-serif text-xl">Online Seminar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm leading-6 text-muted-foreground">
                Build a strong foundation with practical videos and resources you can begin using
                right away.
              </p>
              <Button asChild className="mt-6 w-fit">
                <Link to="/dashboard/course/$courseId" params={{ courseId: 'course-1' }}>
                  Start Course
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative flex h-full flex-col overflow-hidden border-brand-indigo/30 bg-brand-indigo/[0.03] shadow-sm">
            <div
              className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-brand-indigo/10"
              aria-hidden
            />
            <CardHeader className="relative">
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-indigo/10 text-brand-indigo">
                <Sparkles className="size-5" aria-hidden />
              </div>
              <CardDescription>Open Course</CardDescription>
              <CardTitle className="font-serif text-xl">Ace Your DSA Interview</CardTitle>
            </CardHeader>
            <CardContent className="relative flex flex-1 flex-col">
              <p className="flex-1 text-sm leading-6 text-muted-foreground">
                Work through four focused modules covering research, school-fit answers, your story
                bank, and how to close an interview with confidence.
              </p>
              <Button asChild className="mt-6 w-fit">
                <Link to="/dashboard/course/$courseId" params={{ courseId: 'course-2' }}>
                  Start Course
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
