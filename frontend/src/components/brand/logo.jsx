import { Leaf } from 'lucide-react'
import React from 'react';

export default function Logo() {
    return (
        <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" /> {/* Changed Icon to Leaf */}
                <span className="text-xl font-bold">Treetrack</span>
            </a>
        </div>
    );
}