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
export default function TreetrackLanding() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Navigation */}
            <Navbar />
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center md:justify-between">

                    {/* Left Column - Text and Buttons */}
                    <div className="w-full md:w-2/3 flex flex-col items-center text-center md:items-start md:text-left space-y-4">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                            Organize your thoughts, <br className="hidden sm:inline" />
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

                    {/* Right Column - Video Demo */}
                    <div className="w-full md:w-1/3 mt-8 md:mt-0 flex justify-center">
                        {/* Adjust the video attributes as needed: "muted" for autoplay to work in most browsers */}
                        <video
                            className="w-full max-w-lg"
                            src="path_to_your_video.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </section>


            {/* Feature Highlight */}
            <section id="features" className="w-full py-12 md:py-24 bg-muted/50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 items-start">
                        <div className="flex flex-col gap-2">
                            <Network className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">Knowledge Graph</h3>
                            <p className="text-muted-foreground">
                                Visualize dependencies between your tasks, notes, and projects with our intuitive graph interface.
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
                            <Sparkle className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">AI Enabled</h3>
                            <p className="text-muted-foreground">
                                Use generative AI to make edits, provide overviews, and [...]
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
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}