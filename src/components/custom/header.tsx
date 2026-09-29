"use client";

import { Folder, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/custom/user-menu";

interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

interface HeaderProps {
    user: User;
}

const navItems = [
    {
        href: "/repos",
        label: "Repositories",
        icon: Folder,
    },
    {
        href: "/reviews",
        label: "Reviews",
        icon: GitPullRequest,
    },
];

const Header = ({ user }: HeaderProps) => {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link
                        href="/repos"
                        className="text-lg font-semibold tracking-tight"
                    >
                        Patchwork
                    </Link>

                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                pathname.startsWith(`${item.href}/`);

                            const ItemIcon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                    )}
                                >
                                    <ItemIcon className="size-4" />

                                    <span className="hidden sm:inline">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <UserMenu user={user} />
            </div>
        </header>
    );
};

export default Header;
