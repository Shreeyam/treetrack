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
import { stripeClient } from "@better-auth/stripe/client"
 
export const client = createAuthClient({
    // ... your existing config
    plugins: [
        stripeClient({
            subscription: true //if you want to enable subscription management
        })
    ]
})

const AuthForm = ({ onLogin, isRegister, setIsRegister }) => {
    /* -------- state & helpers (unchanged) -------- */
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => { /* … same as before … */ };
    const handleRegister = async () => { /* … same as before … */ };

    /* ------------------------- UI ------------------------- */
    return (
        <div className="flex min-h-screen bg-white">
            {/* LEFT – form */}
            <section className="flex w-full flex-col items-center justify-center px-6 py-10 md:w-1/2">
                <div className="w-full max-w-md space-y-8 transition-all duration-300">
                    <Logo className="h-10 w-auto animate-fade-in" />

                    <header className="animate-slide-up">
                        <h1 className="text-3xl font-extrabold tracking-tight text-brand-700">
                            Welcome to <span className="text-gradient-brand">Treetrack</span>
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                            {isRegister
                                ? "Create your account to start mapping tasks and unlock powerful project management."
                                : "Log in to your account and continue building remarkable projects."}
                        </p>
                    </header>

                    {/* SOCIAL */}
                    <div className="space-y-3 animate-fade-in">
                        <Button
                            variant="outline"
                            className="flex w-full items-center justify-center gap-3 border-neutral-200 bg-white py-6 shadow-sm transition-all hover:bg-neutral-50 hover:shadow-md"
                        >
                            <span>Continue with Google</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex w-full items-center justify-center gap-3 border-neutral-200 bg-white py-6 shadow-sm transition-all hover:bg-neutral-50 hover:shadow-md"
                        >
                            <span>Continue with Facebook</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Separator className="flex-1 bg-neutral-200" />
                        <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                            or
                        </span>
                        <Separator className="flex-1 bg-neutral-200" />
                    </div>

                    {/* CARD */}
                    <Card className="border-neutral-200 bg-white shadow-lg transition-all hover:shadow-xl">
                        <CardHeader>
                            <h2 className="text-xl font-bold text-brand-700">
                                {isRegister ? "Create Account" : "Sign In"}
                            </h2>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {isRegister ? (
                                <>
                                    {/* NAME FIELDS */}
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <div className="w-full">
                                            <Label htmlFor="firstName" className="font-medium">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-full">
                                            <Label htmlFor="lastName" className="font-medium">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* EMAIL / PASSWORD */}
                                    <div>
                                        <Label htmlFor="registerEmail" className="font-medium">Email</Label>

                                        <Input
                                            id="registerEmail"
                                            type="email"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
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

                                    <Button variant="outline" className="w-full">
                                        Try without an account
                                    </Button>

                                    <p className="text-center text-sm text-neutral-600">
                                        Already joined?&nbsp;
                                        <Button
                                            variant="link"
                                            onClick={() => setIsRegister(false)}
                                            className=""
                                        >
                                            Log in here
                                        </Button>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <Label htmlFor="loginEmail" className="font-medium">Email</Label>
                                        <div className="mt-1.5 flex items-center rounded-md border border-neutral-200 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">

                                            <Input
                                                id="loginEmail"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="border-0 bg-transparent focus-visible:ring-0"
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="loginPassword" className="font-medium">Password</Label>
                                        <div className="mt-1.5 flex items-center rounded-md border border-neutral-200 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">

                                            <Input
                                                id="loginPassword"
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                                className="border-0 bg-transparent focus-visible:ring-0"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleLogin}
                                        className="w-full bg-gradient-brand py-6 text-white shadow transition-all hover:scale-[1.02] hover:shadow-lg hover:brightness-110"
                                    >
                                        {loading ? <Loading size={24} /> : "Sign In"}
                                    </Button>

                                    <div className="flex justify-between text-sm">
                                        <Button
                                            variant="link"
                                            onClick={() => alert("Password reset coming soon!")}
                                            className="h-auto p-0 text-neutral-600 transition-all hover:text-brand-700"
                                        >
                                            Forgot password?
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => setIsRegister(true)}
                                            className="h-auto p-0 font-medium text-gradient-brand transition-all hover:brightness-110"
                                        >
                                            Create account
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-xs text-center text-neutral-500">
                        By continuing you agree to our{" "}
                        <Link to="/terms" className="text-neutral-600 underline hover:text-brand-600">
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

            {/* RIGHT – hero (hidden on mobile) */}
            <section className="hidden w-1/2 overflow-hidden md:block">
                <div className="relative h-full w-full bg-linear-to-br/oklch from-[#208aae] to-[#4F772D]">
                    <div className="absolute inset-0 bg-[url('/mesh-pattern.png')] opacity-20"></div>
                    <div className="flex h-full flex-col items-center justify-center px-12 text-white">
                        <div className="max-w-md space-y-6">
                            <h2 className="text-4xl font-bold tracking-tight">
                                Spoingo doingo floingo moingo!
                            </h2>
                            <p className="text-lg text-white/90">
                                Big chungus comin thru with the big brain moves. Treetrack is the
                                ultimate tool for managing your projects and tasks. With our intuitive
                                interface and powerful features, you can easily track your progress, visualize your workflow, and collaborate with your team.
                            </p>
                            <div className="flex space-x-2">
                                <div className="h-2 w-2 rounded-full bg-white/70 animate-pulse"></div>
                                <div className="h-2 w-2 rounded-full bg-white/70 animate-pulse delay-300"></div>
                                <div className="h-2 w-2 rounded-full bg-white/70 animate-pulse delay-700"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AuthForm;

/* ------------ Tailwind additions ------------
  Add these utilities (e.g. in globals.css or tailwind.config):


---------------------------------------------- */
