import React from 'react';

export default function Logo() {
    return (
        <div className="flex items-center">
            <a href="/" className="flex items-center gap-1.5">
                <img src="/treetracklogoSMALL.svg" alt="Treetrack Logo" className="h-7" /> {/* Added alt attribute */}
                <span className="text-xl font-bold">Treetrack</span>
            </a>
        </div>
    );
}