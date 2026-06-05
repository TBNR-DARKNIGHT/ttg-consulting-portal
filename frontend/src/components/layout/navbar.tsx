import { useEffect, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const { isLoaded, isSignedIn, signOut } = usePortalAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={[
        'sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-md',
        scrolled ? 'border-b border-brand-grey' : 'border-b border-transparent',
      ].join(' ')}
    >
      <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6 h-20">
        <Link to="/" className="flex items-center gap-3 group py-5 px-4 -ml-4">
          <div className="w-9 h-9 rounded-full bg-brand-indigo flex items-center justify-center text-white text-sm font-semibold tracking-tight">
            bg
          </div>
          <div className="leading-tight">
            <span className="block font-serif font-semibold text-brand-dark group-hover:opacity-80 transition-opacity">
              beyond grades
            </span>
            <span className="block text-[11px] text-brand-dark/70 italic group-hover:opacity-80 transition-opacity">
              Part of the Think Teach Group
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-8 flex-1 px-8">
          <Link
            to="/portal"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            Portal
          </Link>
          <Link
            to="/group-programme"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            Group Programme
          </Link>
          <Link
            to="/consult"
            activeProps={{ className: 'text-brand-indigo' }}
            inactiveProps={{ className: 'text-brand-dark/70 hover:text-brand-dark' }}
            className="text-sm transition-colors"
          >
            Executive Consulting
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
                Portal
              </Link>
              <Link
                to="/group-programme"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                Group Programme
              </Link>
              <Link
                to="/consult"
                onClick={() => setOpen(false)}
                className="text-brand-dark/70 hover:text-brand-dark transition-colors py-3 px-3 rounded-lg hover:bg-brand-grey/40"
              >
                Executive Consulting
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
