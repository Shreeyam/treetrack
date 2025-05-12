import React from "react"
import { Navbar } from "@/components/navigation/Navbar"
import { Footer } from "@/components/navigation/Footer";

export function AppShell({ children }) {
    return (<div className="flex flex-col min-h-screen">
        <Navbar />
        {children}
        <Footer />
    </div>)
};