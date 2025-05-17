import { AppShell } from "@/components/navigation/AppShell";
import AccountInfo from "@/components/auth/AccountInfo";

import "@/globals.css";

export default function AccountPage() {
    return (
        <AppShell >
            <AccountInfo />
        </AppShell>
    );
}