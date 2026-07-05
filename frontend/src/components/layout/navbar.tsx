import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
import { SiteBrandMark } from '@/components/layout/site-brand-mark';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn, signOut } = usePortalAuth();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-brand-dark/15 bg-brand-cream/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="group flex shrink-0 flex-col items-start justify-center gap-0 py-2">
          <SiteBrandMark framed={false} sizeClass="h-10 w-auto sm:h-11" />
          <span className="-mt-0.5 text-[9px] font-normal uppercase leading-none tracking-[0.08em] text-brand-dark/55 sm:text-[10px]">
            Part of Think Teach Group
          </span>
          <span className="sr-only">Beyond Grades</span>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-7 flex-1 px-7">
          <Link
            to="/portal"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            DSA Portal
          </Link>
          <Link
            to="/group-programme"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            DSA Interview Intensive
          </Link>
          <Link
            to="/consult"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            DSA Consultation
          </Link>
          <Link
            to="/young-explorers"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            DSA Young Explorers
          </Link>
          <Link
            to="/about"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            About us
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {!isLoaded ? (
            <div className="relative h-9 w-40 rounded-md bg-brand-grey/40">
              <span className="sr-only">Loading account</span>
            </div>
          ) : isSignedIn ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
              >
                <Link to="/auth/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/portal">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Site navigation links
            </SheetDescription>
            <div className="flex flex-col gap-2 pt-8 px-2">
              <Link
                to="/portal"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                DSA Portal
              </Link>
              <Link
                to="/group-programme"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                DSA Interview Intensive
              </Link>
              <Link
                to="/consult"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                DSA Consultation
              </Link>
              <Link
                to="/young-explorers"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                DSA Young Explorers
              </Link>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                About us
              </Link>
              {!isLoaded ? (
                <div className="relative mt-4 h-10 rounded-md bg-brand-grey/40">
                  <span className="sr-only">Loading account</span>
                </div>
              ) : isSignedIn ? (
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-brand-dark/70"
                    onClick={() => {
                      setOpen(false);
                      void signOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  <Button asChild variant="outline">
                    <Link to="/auth/login" onClick={() => setOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/portal" onClick={() => setOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
