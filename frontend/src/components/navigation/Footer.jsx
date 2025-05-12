import React from "react"
import { Leaf } from "lucide-react"
import { Link } from "react-router" // or react-router depending on your setup
import Logo from "../brand/logo"

export function Footer() {
    return (
        <footer className="w-full py-6 md:py-12 border-t">
            <div className="container mx-auto px-4 md:px-6">
                {/* Footer Grid */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 items-center">
                    {/* Logo and Description */}
                    <div className="space-y-4">
                        <Logo/>
                        <p className="text-sm text-muted-foreground">
                            Graph-based productivity software that visualizes your workflow.
                        </p>
                    </div>

                    {/* Links and Copyright */}
                    <div className="text-center md:text-right text-sm text-muted-foreground space-y-2">
                        <div className="space-x-4">
                            <Link to="/privacy" className="hover:underline">
                                Privacy
                            </Link>
                            <Link to="/tos" className="hover:underline">
                                Terms of Service
                            </Link>
                            <Link to="/about" className="hover:underline">
                                About
                            </Link>
                            <Link to="/contact" className="hover:underline">
                                Contact
                            </Link>
                        </div>
                        <div>
                            © {new Date().getFullYear()} Treetrack. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
