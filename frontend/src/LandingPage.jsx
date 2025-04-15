import React from 'react';
import {
    ArrowRight,
    CheckCircle,
    Database,
    Network,
    Brain,
    Clock,
    PanelLeft,
    ChevronRight,
    PlayCircle,
    Leaf,
    ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactTyped } from 'react-typed';

import './globals.css'
export default function TreetrackLanding() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Leaf className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">Treetrack</span>
                        <div className="inline-block rounded-lg bg-primary px-3 py-1 text-xs text-white ">
                            Research Preview
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-medium hover:underline underline-offset-4">Features</a>
                        <a href="#demo" className="text-sm font-medium hover:underline underline-offset-4">Demo</a>
                        <a href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm">Log in</Button>
                        <Button size="sm"><ExternalLink /> Open App</Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                            Organize your thoughts, <br className="hidden sm:inline" />
                            <span className="text-primary"><ReactTyped
                                strings={[
                                    'connect your ideas',
                                    'capture your insights',
                                    'identify critical paths',
                                    'streamline your workflow',
                                ]}
                                typeSpeed={40}
                                backSpeed={30}
                                backDelay={1500}
                                loop
                                smartBackspace
                            /></span>
                        </h1>
                        <p className="max-w-[700px] text-muted-foreground md:text-xl">
                            Graph-based productivity that adapts to your thinking process. Visualize connections between tasks, ideas, and projects.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button size="lg" className="gap-2">
                                Start free trial <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="lg" className="gap-2">
                                See how it works <PlayCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Highlight */}
            <section id="features" className="w-full py-12 md:py-24 bg-muted/50">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 items-start">
                        <div className="flex flex-col gap-2">
                            <Brain className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Knowledge Graph</h3>
                            <p className="text-muted-foreground">
                                Visualize connections between your tasks, notes, and projects with our intuitive graph interface.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Clock className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Time Management</h3>
                            <p className="text-muted-foreground">
                                Track time spent on tasks and projects with integrated Pomodoro timers and custom time blocks.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <PanelLeft className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Flexible Workspaces</h3>
                            <p className="text-muted-foreground">
                                Customize your workspace with multiple views including Kanban boards, calendars, and graph views.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agile Critique Feature Section */}
            <section className="w-full py-12 md:py-24 bg-muted">
                <div className="container px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Stop Forcing Agile on Your Complex Workflows</h2>
                        <p className="mt-4 text-muted-foreground md:text-xl">
                            Agile was built to manufacture thousands of identical cars. Your projects aren't identical—why use a system designed for assembly lines?
                        </p>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <Card className="p-4">
                                <CardTitle className="text-lg">Interdependencies Matter</CardTitle>
                                <CardDescription className="mt-2">
                                    Agile falls short when tasks aren't isolated. Complex hardware projects thrive on visual connections and explicit relationships.
                                </CardDescription>
                            </Card>
                            <Card className="p-4">
                                <CardTitle className="text-lg">Uncertainty Isn’t a Bug—It’s a Feature</CardTitle>
                                <CardDescription className="mt-2">
                                    Embrace real-world complexity. Agile methods break when faced with genuine uncertainty—Treetrack is built for it.
                                </CardDescription>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section id="demo" className="w-full py-12 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">See Treetrack in action</h2>
                            <p className="max-w-[700px] text-muted-foreground md:text-xl">
                                Watch how Treetrack transforms your workflow and connects your ideas
                            </p>
                        </div>
                        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border bg-background shadow-xl">
                            <div className="aspect-video bg-muted flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <PlayCircle className="h-16 w-16 text-primary opacity-75" />
                                    <p className="text-sm text-muted-foreground">Video Demo Placeholder</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="w-full py-12 md:py-24 bg-muted/50">
                <div className="container px-4 md:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <blockquote className="text-xl font-medium leading-relaxed text-muted-foreground">
                            "Treetrack has transformed how I organize my projects. Being able to visualize connections between tasks has been a game-changer for my productivity."
                        </blockquote>
                        <div className="mt-4">
                            <p className="font-medium">Sarah Johnson</p>
                            <p className="text-sm text-muted-foreground">Product Manager at TechCorp</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="w-full py-12 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="mx-auto max-w-md text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple, transparent pricing</h2>
                        <p className="mt-4 text-muted-foreground">
                            Choose the plan that works best for your workflow
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        {/* Starter Plan */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>Starter</CardTitle>
                                <CardDescription>Perfect for individuals getting started.</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">Free</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {["5 projects", "Basic graph visualization", "1 GB storage", "Personal dashboard"].map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Get started</Button>
                            </CardFooter>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="flex flex-col border-primary">
                            <CardHeader>
                                {/* <div className="px-3 py-1 text-xs bg-primary text-primary-foreground w-fit rounded-full mb-2">
                                    Most Popular
                                </div> */}
                                <CardTitle>Pro</CardTitle>
                                <CardDescription>For serious productivity enthusiasts.</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">$4</span>
                                    <span className="text-muted-foreground"> /month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {[
                                        "Unlimited projects",
                                        "Advanced graph visualization",
                                        "Team collaboration",
                                        "Priority support",
                                        "Custom templates"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Get started</Button>
                            </CardFooter>
                        </Card>

                        {/* Enterprise Plan */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>Enterprise</CardTitle>
                                <CardDescription>For organizations with advanced needs.</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">$19</span>
                                    <span className="text-muted-foreground"> /user/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {[
                                        "Unlimited everything",
                                        "Advanced security",
                                        "Admin dashboard",
                                        "API access",
                                        "Dedicated support",
                                        "Custom integrations",
                                        "On-premise option"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Contact sales</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full py-12 md:py-24 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to transform your workflow?</h2>
                            <p className="max-w-[600px] md:text-xl">
                                Start your 14-day free trial today. No credit card required.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" variant="secondary" className="gap-2">
                                Start free trial <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="lg" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                                Book a demo <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-6 md:py-12 border-t">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Network className="h-6 w-6 text-primary" />
                                <span className="text-lg font-bold">Treetrack</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Graph-based productivity software that visualizes your workflow.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:underline">Features</a></li>
                                <li><a href="#" className="hover:underline">Pricing</a></li>
                                <li><a href="#" className="hover:underline">Integrations</a></li>
                                <li><a href="#" className="hover:underline">Roadmap</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:underline">About</a></li>
                                <li><a href="#" className="hover:underline">Blog</a></li>
                                <li><a href="#" className="hover:underline">Careers</a></li>
                                <li><a href="#" className="hover:underline">Contact</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:underline">Privacy</a></li>
                                <li><a href="#" className="hover:underline">Terms</a></li>
                                <li><a href="#" className="hover:underline">Security</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Treetrack. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}