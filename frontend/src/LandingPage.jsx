import React from "react";
import {
    ArrowRight,
    Network,
    Clock,
    Sparkle,
    Bot,
    Users, // Added Users icon
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ReactTyped } from "react-typed";

import { AppShell } from "@/components/navigation/AppShell";

import "@/globals.css";
import bgVideoMp4 from "@/assets/background_optimized.mp4";
import Roadmap from "@/components/landing/Roadmap";
import FAQ from "@/components/landing/FAQ";
import Pricing from "@/components/landing/Pricing";

export default function LandingPage() {
    return (
        <AppShell>
            {/* Hero Section */}
            <section className="relative overflow-hidden w-full py-8 md:py-16 lg:py-24">
                <video
                    className="absolute inset-0 w-full h-full object-cover -z-10"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src={bgVideoMp4} type="video/mp4" />
                    Your browser doesn’t support HTML5 video.
                </video>

                <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center md:justify-between">
                    <div className="w-full md:w-2/3 flex flex-col items-center text-center md:items-start md:text-left space-y-4">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                            Organize your thoughts,
                            <br />
                            <span className="text-primary">
                                <ReactTyped
                                    strings={[
                                        'connect your ideas',
                                        'identify critical paths',
                                        'streamline your workflow',
                                    ]}
                                    typeSpeed={40}
                                    backSpeed={30}
                                    backDelay={1500}
                                    loop
                                    smartBackspace
                                />
                            </span>
                        </h1>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Treetrack turns every project into a living dependency graph, so you always
                            know what’s next and what’s in the way.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center md:justify-start">
                            <Link to="/app">
                                <Button size="lg" className="gap-2">
                                    Start free <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Feature Section */}
            <section className="w-full py-6 md:py-12 lg:py-16 bg-background"> {/* Reduced py */}
                <div className="container mx-auto px-4 md:px-6 grid gap-8 lg:grid-cols-2 items-center">
                    {/* Text comes first on mobile, last on desktop */}
                    <div className="flex flex-col justify-center space-y-3 order-first lg:order-last">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Your AI co‑planner
                            <br />
                            <span className="text-primary">handles the busywork</span>
                        </h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg">
                            Ask in natural language, get a perfectly sequenced plan. Reschedule, regroup
                            and refine with a single prompt—exclusive to Pro plans.
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-lg aspect-video flex order-last items-center justify-center lg:order-first">
                        <img src="/treetrack_ai.png" alt="AI Feature" className="object-contain w-full h-full" />
                    </div>
                </div>
            </section>

            {/* Combined Graph Visualization and Real-time Collaboration Section */}
            <section className="w-full py-6 md:py-12 lg:py-16 bg-white"> {/* Reduced py */}
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-2 items-start"> {/* Reduced gap */}

                        {/* Column 1: Graph Visualization Feature */}
                        <div className="flex flex-col space-y-3"> {/* Reduced space-y */}
                            <div className="flex flex-col justify-center space-y-3">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                                    Big‑picture clarity
                                    <br />
                                    <span className="text-primary">with next‑step focus</span>
                                </h2>
                                <p className="max-w-[600px] text-muted-foreground md:text-lg">
                                    Zoom out to roadmap, zoom in to today. Collapse future work to eliminate
                                    noise and get instant clarity on what's actionable right now.
                                </p>
                            </div>
                            <div className="relative overflow-hidden rounded-lg aspect-video">
                                <img src="/treetrack_highlight_1.png" className="object-contain w-full h-full" />
                                <img
                                    src="/treetrack_highlight_2.png"
                                    className="object-contain w-full h-full absolute top-0 left-0 animate-fade"
                                />
                            </div>
                        </div>

                        {/* Column 2: Real-time Collaboration Feature */}
                        <div className="flex flex-col space-y-3"> {/* Reduced space-y */}
                            <div className="flex flex-col justify-center space-y-3">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                                    Sync up, speed up
                                    <br />
                                    <span className="text-primary">with real‑time teamwork</span>
                                </h2>
                                <p className="max-w-[600px] text-muted-foreground md:text-lg">
                                    Collaborate seamlessly with your team in real-time. See updates as they happen and keep everyone on the same page, effortlessly.
                                </p>
                            </div>
                            <div className="relative overflow-hidden rounded-lg aspect-video flex items-center justify-center">
                                <Users className="h-16 w-16 text-muted-foreground" /> {/* Changed icon */}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section id="features" className="w-full py-8 md:py-16 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 items-start">
                        <div className="flex flex-col gap-2">
                            <Network className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Graph-Based Visualization</h3>
                            <p className="text-muted-foreground">
                                Visualize dependencies between your tasks, notes, and projects with our intuitive graph interface.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Users className="h-10 w-10 text-primary" /> {/* Changed icon */}
                            <h3 className="text-xl font-bold">Real-Time Collaboration</h3> {/* Changed text */}
                            <p className="text-muted-foreground">
                                Work together with your team simultaneously. Share updates, track progress, and ensure everyone is aligned, all in one place. {/* Changed text */}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Sparkle className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">AI Enabled</h3>
                            <p className="text-muted-foreground">
                                Use generative AI to make edits, provide overviews, and give suggestions on your tasks and projects. Powered by Google Gemini models.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Roadmap />
            <FAQ />
            <Pricing/>

            {/* CTA Section */}
            <section className="w-full py-8 md:py-16 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to transform your workflow?</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/app">
                                <Button size="lg" variant="secondary" className="gap-2">
                                    Get started free <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="mailto:sales@treetrack.xyz">
                                <Button variant="outline" size="lg" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">
                                    Contact Sales
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </AppShell>
    );
}
