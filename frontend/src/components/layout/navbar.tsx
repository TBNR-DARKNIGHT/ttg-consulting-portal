import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { usePortalAuth } from '@/auth/auth-context';
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
      className="sticky top-0 z-50 border-b border-brand-dark/15 bg-brand-cream"
    >
      <div className="flex h-16 items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex shrink-0 flex-col gap-px">
          <span className="font-serif text-lg font-bold leading-tight tracking-[-0.02em] text-brand-indigo">
            beyond grades
          </span>
          <span className="text-[10px] font-normal uppercase leading-none tracking-[0.06em] text-brand-dark/60">
            Part of Think Teach Group
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-8 px-8 md:flex">
          <Link
            to="/portal"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-[13px] font-medium transition-colors"
          >
            DSA Portal
          </Link>
          <Link
            to="/group-programme"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-[13px] font-medium transition-colors"
          >
            DSA Interview Intensive
          </Link>
          <Link
            to="/consult"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-[13px] font-medium transition-colors"
          >
            DSA Consulting
          </Link>
          <Link
            to="/young-explorers"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-[13px] font-medium transition-colors"
          >
            Young Explorers
          </Link>
          <Link
            to="/about"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-[13px] font-medium transition-colors"
          >
            About Us
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
                size="sm"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="px-2 py-2 text-[13px] font-medium text-brand-dark/65 transition-colors hover:text-brand-indigo"
              >
                Log In
              </Link>
              <Button asChild size="sm" className="h-9 rounded-md px-5 text-[13px]">
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
                Young Explorers
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
