import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <h1 className="text-2xl font-bold">Tutorbase</h1>
        </Link>
      </div>
      <nav className="hidden md:flex">
        <div className="flex items-center gap-2">
          <Link className="hover:text-blue-500 text-lg" href="/courses">
            Courses
          </Link>
          <Link className="hover:text-blue-500 text-lg" href="/login">
            Log in
          </Link>
          <Link className="hover:text-blue-500 text-lg" href="/signup">
            <Button variant="default">Sign up</Button>
          </Link>
        </div>
      </nav>

      <Sheet>
        <SheetTrigger className="md:hidden" render={<Button variant="ghost" />}>
          Menu
        </SheetTrigger>
        <SheetContent>
          <nav className="p-4">
            <div className="flex flex-col items-start gap-4 pt-8">
              <Link
                className="w-full rounded-lg px-3 py-2 text-lg hover:bg-accent hover:text-accent-foreground"
                href="/courses"
              >
                Courses
              </Link>
              <Link
                className="w-full rounded-lg px-3 py-2 text-lg hover:bg-accent hover:text-accent-foreground"
                href="/login"
              >
                Log in
              </Link>
              <Link
                className="w-full rounded-lg px-3 py-2 text-lg hover:bg-accent hover:text-accent-foreground"
                href="/signup"
              >
                Sign up
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
