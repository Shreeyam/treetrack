import { AppShell } from "@/components/navigation/AppShell";
import TermsOfService from "@/components/misc/ToS";

import "@/globals.css";

export default function TermsOfServicePage() {
    return (
        <AppShell>
            <TermsOfService />
        </AppShell>
    );
}