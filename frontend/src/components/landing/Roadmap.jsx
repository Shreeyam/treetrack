import { ArrowRight } from 'lucide-react';
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

                <div className="relative">
                    {/* Vertical line on mobile */}
                    <div className="absolute left-5 top-0 bottom-0 w-1 bg-gray-200 rounded-full md:hidden" />
                    {/* Horizontal line on desktop */}
                    <div className="hidden md:block absolute top-1 left-4 right-4 h-1 bg-gray-200 rounded-full" />

                    {/* Timeline items */}
                    <div className="space-y-8 md:flex md:justify-between md:space-y-0">
                        {roadmapItems.map((item, index) => (
                            <div
                                key={index}
                                className="relative flex items-start w-full pl-10 md:flex-col md:items-center md:w-56 md:pl-0"
                            >
                                <span className="absolute left-4 top-0 md:static md:left-auto md:top-auto md:mb-2 h-3 w-3 bg-primary rounded-full" />
                                <div className="md:text-center">
                                    <h3 className="mt-0 font-semibold">{item.time}</h3>
                                    <p className="mt-1 text-muted-foreground">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Discord join button */}
                <div className="flex justify-center mt-4">
                    <Button variant="outline">
                        <a
                            href="https://discord.gg/mRTRqjhAXX"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                        >
                            Suggest ideas on Discord
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
