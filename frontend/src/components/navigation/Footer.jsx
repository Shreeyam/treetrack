import React from "react"
import { Leaf } from "lucide-react"

export function Footer() {
    return <footer className="w-full py-6 md:py-12 border-t">
        <div className="container mx-auto px-4 md:px-6">
            {/* Simplified Footer Grid */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 items-center">
                {/* Logo and Description */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Leaf className="h-6 w-6 text-primary" /> {/* Changed Icon to Leaf */}
                        <span className="text-lg font-bold">Treetrack</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Graph-based productivity software that visualizes your workflow.
                    </p>
                </div>

                {/* Copyright - Moved to be alongside the logo on larger screens */}
                <div className="text-center md:text-right text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Treetrack. All rights reserved.
                </div>
            </div>
            {/* Removed the detailed link columns and the separate copyright div */}
        </div>
    </footer>
}
