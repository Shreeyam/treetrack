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
    ExternalLink,
    Sparkle
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactTyped } from 'react-typed';

import { Footer } from '@/components/navigation/Footer';
import { Navbar } from '@/components/navigation/Navbar';

import '@/globals.css'
import bgVideoMp4 from '@/assets/background_optimized.mp4';

export default function TreetrackLanding() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <Navbar />
            {/* Hero Section */}
            <section className="relative overflow-hidden w-full py-12 md:py-24 lg:py-32">
                {/* Background video fills the section */}
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

                {/* Hero content sits above the video */}
                <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center md:justify-between">
                    {/* Left Column – Text & Buttons */}
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
                        <p className="max-w-[700px] text-muted-foreground md:text-xl">
                            Graph-based productivity that adapts to your thinking process. Visualize connections between tasks, ideas, and projects.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center md:justify-start">
                            <Link to="/app">
                                <Button size="lg" className="gap-2">
                                    Try for free <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            {/* <Button variant="outline" size="lg" className="gap-2">
                                See how it works <PlayCircle className="h-4 w-4" />
                            </Button> */}
                        </div>
                    </div>
                </div>
            </section>


            {/* Feature Highlight */}
            <section id="features" className="w-full py-12 md:py-24 bg-muted/50">
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
                            <Clock className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Time Management</h3>
                            <p className="text-muted-foreground">
                                Track dock dates, identify critical paths, and manage your time effectively with our built-in calendar and timeline features.
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

            {/* CTA Section */}
            <section className="w-full py-12 md:py-24 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to transform your workflow?</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/app">
                                <Button size="lg" variant="secondary" className="gap-2">
                                    Try for free <ArrowRight className="h-4 w-4" />
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

            {/* Footer */}
            <Footer />
        </div>
    );
}