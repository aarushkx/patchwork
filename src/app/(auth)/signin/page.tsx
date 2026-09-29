"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const SignInPage = () => {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [emailLoading, setEmailLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setEmailLoading(true);

        const res = await signIn.email({ email, password });

        if (res.error) {
            setError(res.error.message || "Something went wrong");
            setEmailLoading(false);
        } else {
            router.push("/repos");
        }
    };

    const handleGitHubSignIn = async () => {
        setError("");
        setGithubLoading(true);

        const res = await signIn.social({
            provider: "github",
            callbackURL: "/repos",
        });

        if (res.error) {
            setError(res.error.message || "Failed to sign in with GitHub");
            setGithubLoading(false);
        }
    };

    const loading = emailLoading || githubLoading;

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl">Sign in</CardTitle>
                    <CardDescription>
                        Sign in to your Patchwork account
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGitHubSignIn}
                        disabled={loading}
                    >
                        {githubLoading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <FaGithub className="mr-2 size-4" />
                                Continue with GitHub
                            </>
                        )}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>

                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {emailLoading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-foreground hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignInPage;
