import React from 'react';

export default function Logo() {
    return (
        <div className="flex items-center">
            <a href="/" className="flex items-center gap-1.5 text-xl">
                <img src="/treetracklogoSMALL.svg" alt="Treetrack Logo" className="h-[1.4em]" /> {/* Added alt attribute */}
                <span className=" font-bold">Treetrack</span>
            </a>
        </div>
    );
}