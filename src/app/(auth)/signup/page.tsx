"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
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

const SignUpPage = () => {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [emailLoading, setEmailLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setEmailLoading(true);

        const res = await signUp.email({
            name,
            email,
            password,
        });

        if (res.error) {
            setError(res.error.message || "Something went wrong");
            setEmailLoading(false);
        } else {
            router.push("/repos");
        }
    };

    const handleGitHubSignUp = async () => {
        setError("");
        setGithubLoading(true);

        await signIn.social({
            provider: "github",
            callbackURL: "/repos",
        });

        setGithubLoading(false);
    };

    const loading = emailLoading || githubLoading;

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-xl">Sign up</CardTitle>
                    <CardDescription>
                        Create your Patchwork account to get started
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGitHubSignUp}
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

                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                autoComplete="email"
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
                                autoComplete="new-password"
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
                                    Creating account...
                                </>
                            ) : (
                                "Create account"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/signin"
                            className="font-medium text-foreground hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUpPage;
