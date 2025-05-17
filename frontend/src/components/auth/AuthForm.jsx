/* src/components/auth/AuthForm.jsx  – white version with new palette */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import Logo from "@/components/brand/logo";
import { Link } from "react-router";
import { authClient } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

// Google logo component
const GoogleLogo = ({ className = "h-4 w-4" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className={className}
    >
        <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
            fill="#4CAF50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
    </svg>
);

const AuthForm = ({ onLogin, isRegister, setIsRegister }) => {
    /* -------- state & helpers (unchanged) -------- */
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();


    const handleLogin = async () => {
        const { data, error } = await authClient.signIn.email({
            email: loginEmail,
            password: loginPassword,
        }, {
            onRequest: (ctx) => {
                setLoading(true);
            },
            onSuccess: (ctx) => {
                // Crappy hack to wait for session to be set before redirecting
                setTimeout(() => {
                    setLoading(false);
                    navigate("/app");
                }, 100);
            },
            onError: (ctx) => {
                setLoading(false);
                alert(ctx.error.message);
            },
        });
    };
    const handleRegister = async () => {
        const { data, error } = await authClient.signUp.email({
            email: registerEmail,
            password: registerPassword,
            name: firstName,
            lastName: lastName,
            callbackURL: "/app?ref=register"
        }, {
            onRequest: (ctx) => {
                setLoading(true);
            },
            onSuccess: (ctx) => {
                setLoading(false);
                navigate("/app?ref=register");
            },
            onError: (ctx) => {
                setLoading(false);
                alert(ctx.error.message);
            },
        });
    };

    /* ------------------------- UI ------------------------- */
    return (
        <div className="min-h-screen bg-white p-4 flex items-center justify-center">
            <Card className="w-full max-w-md overflow-hidden shadow-lg py-0">
                <div className="flex flex-col md:flex-row">
                    {/* LEFT – form */}
                    <section className="w-full p-6">
                        <div className="space-y-4">
                            <Logo className="h-10 w-auto" />

                            <header>
                                <h1 className="text-3xl font-extrabold tracking-tight text-brand-700">
                                    Welcome to Treetrack
                                </h1>
                                <p className="mt-2 text-sm text-neutral-600">
                                    {isRegister
                                        ? "Create your account to start mapping tasks."
                                        : "Log in to your account to track your tasks."}
                                </p>
                            </header>

                            <div>
                                <div className="space-y-2">
                                    {isRegister ? (
                                        <>
                                            {/* NAME FIELDS */}
                                            <div className="flex flex-col gap-4 sm:flex-row">
                                                <div className="grid w-full items-center gap-1.5">
                                                    <Label htmlFor="firstName" className="font-medium">First Name</Label>
                                                    <Input
                                                        id="firstName"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid w-full items-center gap-1.5">
                                                    <Label htmlFor="lastName" className="font-medium">Last Name (optional)</Label>
                                                    <Input
                                                        id="lastName"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* EMAIL / PASSWORD */}
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="registerEmail" className="font-medium">Email</Label>
                                                <Input
                                                    id="registerEmail"
                                                    type="email"
                                                    value={registerEmail}
                                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="registerPassword" className="font-medium">Password</Label>
                                                <Input
                                                    id="registerPassword"
                                                    type="password"
                                                    value={registerPassword}
                                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                                                    placeholder="••••••••"
                                                />
                                            </div>

                                            <Button
                                                onClick={handleRegister}
                                                className="w-full"
                                            >
                                                {loading ? <Loading /> : "Create account"}
                                            </Button>

                                            <div className="flex items-center gap-3">
                                                <Separator className="flex-1" />
                                                <span className="text-xs font-medium text-neutral-400">
                                                    or
                                                </span>
                                                <Separator className="flex-1" />
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="flex w-full items-center justify-center gap-3"
                                            >
                                                <GoogleLogo className="h-9 w-9" />
                                                <span>Continue with Google</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Try without an account <ArrowRight className="h-4 w-4" />
                                            </Button>

                                            <p className="text-center text-sm text-neutral-600">
                                                Already joined?&nbsp;
                                                <Button
                                                    variant="link"
                                                    onClick={() => setIsRegister(false)}
                                                >
                                                    <Link to="/login">Log in here</Link>
                                                </Button>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid w-full items-center gap-1.5">

                                                <Label htmlFor="loginEmail" className="font-medium">Email or username</Label>
                                                <Input
                                                    id="loginEmail"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">

                                                <Label htmlFor="loginPassword" className="font-medium">Password</Label>
                                                <Input
                                                    id="loginPassword"
                                                    type="password"
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                                    placeholder="••••••••"
                                                />
                                            </div>

                                            <Button
                                                onClick={handleLogin}
                                                className="w-full"
                                            >
                                                {loading ? <Loading size={24} /> : "Sign In"}
                                            </Button>

                                            <div className="flex items-center gap-3">
                                                <Separator className="flex-1" />
                                                <span className="text-xs font-medium text-neutral-400">
                                                    or
                                                </span>
                                                <Separator className="flex-1" />
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="flex w-full items-center justify-center gap-3"
                                            >
                                                <GoogleLogo />
                                                <span>Continue with Google</span>
                                            </Button>

                                            <div className="flex justify-between text-sm">
                                                <Button
                                                    variant="link"
                                                    onClick={() => alert("Password reset coming soon!")}
                                                    className="h-auto p-0 text-center text-sm"
                                                >
                                                    Forgot password?
                                                </Button>

                                                <Button
                                                    variant="link"
                                                    onClick={() => setIsRegister(true)}
                                                    className="h-auto p-0 text-center text-sm"
                                                >
                                                    <Link to="/register">Create an account</Link>
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-center text-neutral-500">
                                By continuing you agree to our{" "}
                                <Link to="/tos" className="text-neutral-600 underline hover:text-brand-600">
                                    Terms&nbsp;of&nbsp;Service
                                </Link>{" "}
                                and{" "}
                                <Link to="/privacy" className="text-neutral-600 underline hover:text-brand-600">
                                    Privacy&nbsp;Policy
                                </Link>
                                .
                            </p>
                        </div>
                    </section>
                </div>
            </Card>
        </div>
    );
};

export default AuthForm;
