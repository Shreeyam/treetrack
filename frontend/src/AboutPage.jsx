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
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactTyped } from 'react-typed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import '@/globals.css'

export default function TreetrackLanding() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 md:px-6 py-12">
                <section id="about-us" className="">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Meet the Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Team Member 1 */}
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="w-48 h-48 mb-4">
                                <AvatarImage src="https://shreey.am/me.jpg" alt="Team Member 1 Avatar" />
                                <AvatarFallback>SK</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-semibold mb-2">Shreeyam Kacker</h3>
                            <p className="text-muted-foreground">
                                Shreeyam holds a doctorate in Aeronautics and Astronautics from MIT. He has previously been engaged in building satellites, tracking assembly with post-its on a whiteboard. He built Treetrack to have the productivity tool he always wanted.
                            </p>
                        </div>

                        {/* Team Member 2 */}
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="w-48 h-48 mb-4">
                                <AvatarImage src="/labtec901.png" alt="Team Member 2 Avatar" />
                                <AvatarFallback>Labtec</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-semibold mb-2">Labtec</h3>
                            <p className="text-muted-foreground">
                                Labtec holds a Bachelor’s in Industrial Engineering from Purdue University and is a graduate student at Johns Hopkins University, studying Data Science with a concentration in Machine Learning and Artificial Intelligence. He has previous experience in the Aerospace industry managing, developing, and analyzing large production systems.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}