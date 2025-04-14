import { useState } from 'react';
import { Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SparklyUpgradeButton() {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <Button
            variant="black"
            className={`relative overflow-hidden rounded-md px-4 py-2 font-medium transition-all duration-300  ${isHovering ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105' : 'bg-black text-white'
                }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => window.alert("Feature coming soon!")}
        >
            <div className="flex items-center gap-2">
                <Gem className={`transition-all duration-300 ${isHovering ? 'text-yellow-300 rotate-12' : 'text-purple-500'}`} />
                <span>Upgrade</span>
            </div>

            {isHovering && (
                <>
                    {/* Sparkle effects */}
                    <div className="absolute top-0 left-1/4 h-1 w-1 rounded-full bg-white animate-ping" />
                    <div className="absolute top-1/3 left-3/4 h-1 w-1 rounded-full bg-yellow-200 animate-ping delay-100" />
                    <div className="absolute top-2/3 left-1/2 h-1 w-1 rounded-full bg-purple-200 animate-ping delay-200" />
                    <div className="absolute bottom-0 right-1/4 h-1 w-1 rounded-full bg-blue-200 animate-ping delay-300" />

                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer" />
                </>
            )}
        </Button>
    );
}