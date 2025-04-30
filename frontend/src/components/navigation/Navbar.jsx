import Logo from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

export function Navbar() {
    return <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
                <Logo />
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-xs text-white ">
                    Research Preview
                </div>
                <div className="ml-2 gap-4 md:flex hidden">
                    <a href="/about" className="text-sm font-medium hover:underline underline-offset-4">About</a>
                    <a href="/#roadmap" className="text-sm font-medium hover:underline underline-offset-4">Roadmap</a>
                    <a href="/#faq" className="text-sm font-medium hover:underline underline-offset-4">FAQ</a>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <a href="/login" className="text-sm font-medium hover:underline underline-offset-4" >Log in</a>
                <a href="/register" className="text-sm font-medium hover:underline underline-offset-4">Register</a>
                <Link to="/app" className="hidden md:flex">
                    <Button size="sm"><ExternalLink /> Open App</Button>
                </Link>
            </div>
        </div>
    </header>
}
