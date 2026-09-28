import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Welcome to Patchwork
                    </h1>

                    <p className="text-muted-foreground">
                        Catch issues before they reach production
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link href="/signin">
                        <Button variant="outline">Sign In</Button>
                    </Link>

                    <Link href="/signup">
                        <Button>Get started</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
