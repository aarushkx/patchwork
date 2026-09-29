"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProps {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

const UserMenu = ({ user }: { user: UserProps }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/signin");
    };

    const fallback =
        user.name?.charAt(0).toUpperCase() ||
        user.email?.charAt(0).toUpperCase() ||
        "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        className="size-9 rounded-full p-0"
                    />
                }
            >
                <Avatar className="size-8">
                    <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name}
                    />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                {/* User info */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Account */}
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/profile")}
                >
                    <User />
                    Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/settings")}
                >
                    <Settings />
                    Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sign out */}
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                >
                    <LogOut />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;
