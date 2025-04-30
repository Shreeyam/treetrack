import { ArrowRight, Sparkles, Rocket, Brain, Smartphone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Roadmap() {
    const roadmapItems = [
        {
            time: "April 2025",
            label: "UX Overhaul",
        },
        {
            time: "May 2025",
            label: "Real-time Collaboration",
        },
        {
            time: "June 2025",
            label: "Public Beta Release",
        },
        {
            time: "August 2025",
            label: "Critical Path Features",
        },
    ];

    return (
        <section className="w-full py-8 bg-muted/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                        Our Product Roadmap
                    </h2>
                </div>

                <div className="relative mt-4">
                    {/* Timeline line */}
                    <div className="absolute top-1 left-4 right-4 h-1 bg-gray-200  rounded-full"></div>

                    {/* Timeline items */}
                    <div className="flex justify-between relative">
                        {roadmapItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-56 flex flex-col items-center text-center"
                            >
                                <span className="h-3 w-3 bg-primary rounded-full" />
                                <h3 className="mt-2 font-semibold">{item.time}</h3>
                                <p className="mt-1 text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Discord join button */}
                <div className="flex justify-center mt-4">
                    <Button variant='outline'>
                        <a
                            href="https://discord.gg/mRTRqjhAXX"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Suggest ideas on Discord
                        </a>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}