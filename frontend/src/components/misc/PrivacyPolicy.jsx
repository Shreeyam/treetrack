/**
 * Treetrack Privacy Policy – React Component
 * ------------------------------------------------------------
 * This policy is provided for informational purposes only and
 * does **not** constitute legal advice.  Review it with counsel
 * to ensure it fully meets your regulatory and contractual
 * obligations.
 */

import React from "react";

const PrivacyPolicy = () => (
    <div className="prose mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Privacy&nbsp;Policy</h1>
        <p className="italic mb-8">Last updated: May&nbsp;11,&nbsp;2025</p>

        {/* 1. Introduction ---------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">1.&nbsp;Introduction</h2>
        <p>
            Welcome to <strong>Treetrack</strong> (“Treetrack,” “we,” “us,” or “our”),
            a productivity platform that helps you plan projects as easy-to-follow
            directed acyclic graphs (DAGs). We respect your privacy and are committed
            to protecting the personal information you share with us. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you visit treetrack.app, use any Treetrack desktop or
            mobile application, interact with our APIs, or communicate with our
            support channels (collectively, the “Services”).
        </p>

        {/* 2. Information We Collect ----------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">2.&nbsp;Information&nbsp;We&nbsp;Collect</h2>
        <h3 className="mt-4 mb-2 text-xl font-semibold">A. Information you provide directly</h3>
        <ul className="list-disc ml-6">
            <li><strong>Account data </strong>– first name, last name, email address, password (hashed), and optionally an avatar image.</li>
            <li><strong>Profile &amp; project content </strong>– project names, task metadata, comments, attachments, share-links, and other content you upload or create.</li>
            <li><strong>Payment data </strong>– when you upgrade to a paid plan we receive a tokenized payment identifier from our billing partner (Stripe, Inc.). Raw card numbers never touch Treetrack servers.</li>
            <li><strong>Support requests </strong>– any information you include in tickets, emails, or chat messages with our team.</li>
        </ul>

        <h3 className="mt-4 mb-2 text-xl font-semibold">B. Information we collect automatically</h3>
        <ul className="list-disc ml-6">
            <li><strong>Usage data </strong>– feature interactions, pages viewed, time spent, referring URLs, and in-app events (anonymized or pseudonymized where possible).</li>
            <li><strong>Log &amp; device data </strong>– IP address, browser type, operating system, timestamps, and error logs. Logs are stored on DigitalOcean servers in New&nbsp;York (USA).</li>
            <li><strong>Cookies &amp; similar tech </strong>– first-party cookies for authentication and preferences; third-party cookies from Google Analytics 4 (GA4) for aggregate analytics.</li>
        </ul>

        {/* 3. How We Use Your Information ------------------------------------ */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">3.&nbsp;How&nbsp;We&nbsp;Use&nbsp;Information</h2>
        <ul className="list-decimal ml-6">
            <li>To operate and maintain the Services, authenticate users (BetterAuth), and synchronize your data across devices.</li>
            <li>To process payments, manage subscriptions, and send billing-related emails (Stripe).</li>
            <li>To analyze usage and improve performance, reliability, and user-experience (GA4).</li>
            <li>To communicate announcements, respond to inquiries, and provide customer support.</li>
            <li>To detect, prevent, and address security incidents, fraud, or abuse.</li>
            <li>To comply with legal obligations or enforce our Terms&nbsp;of&nbsp;Service.</li>
        </ul>

        {/* 4. Legal Bases ----------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">4.&nbsp;Legal&nbsp;Bases (EU/UK GDPR)</h2>
        <p>
            Where the GDPR or UK GDPR applies, we process your personal data on the
            following legal bases: (i)&nbsp;<em>performance of a contract</em>
            (providing the Services you request); (ii)&nbsp;<em>legitimate interests</em>
            (improving and securing Treetrack); (iii)&nbsp;<em>consent</em> (for
            non-essential cookies/marketing); and (iv)&nbsp;<em>legal obligation</em>.
        </p>

        {/* 5. Sharing & Disclosure ------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">5.&nbsp;Sharing&nbsp;&amp;&nbsp;Disclosure</h2>
        <p>We do <strong>not sell</strong> your personal information.</p>
        <p>We share data only with:</p>
        <ul className="list-disc ml-6">
            <li><strong>Service providers </strong>– DigitalOcean (hosting), Stripe (payments), Google Analytics, and postal/email providers;</li>
            <li><strong>Collaboration recipients </strong>– other users you explicitly invite or anyone with whom you share a project link;</li>
            <li><strong>Legal authorities </strong>– if required to comply with subpoenas, court orders, or to protect rights, property, or safety.</li>
        </ul>

        {/* 6. Cookies --------------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">6.&nbsp;Cookies&nbsp;and&nbsp;Tracking&nbsp;Technologies</h2>
        <p>
            Treetrack uses strictly necessary cookies for login sessions and CSRF
            protection. We also deploy optional analytics cookies (GA4) to understand
            aggregate usage.
        </p>

        {/* 7. Data Retention -------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">7.&nbsp;Data&nbsp;Retention</h2>
        <p>
            We keep account and project data for as long as your account is active, or
            as needed to provide the Services. Backups are encrypted and retained for
            up to 30 days. We may retain minimal records beyond closure where required
            by law (e.g., billing).
        </p>

        {/* 8. Security -------------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">8.&nbsp;Security</h2>
        <p>
            We apply industry-standard measures: TLS 1.3 in transit; AES-256
            encryption at rest; least-privilege access controls; routine penetration
            testing; <code>Content-Security-Policy</code> headers; and database
            encryption for secrets. No internet service can guarantee absolute
            security, but we strive to protect your data.
        </p>

        {/* 9. Your Rights ----------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">9.&nbsp;Your&nbsp;Rights</h2>
        <p>
            Depending on your location, you may have rights to access, correct,
            delete, export, or object to certain processing of your personal data. To
            exercise any right, email&nbsp;
            <a href="mailto:privacy@treetrack.xyz" className="underline">
                privacy@treetrack.xyz
            </a>
            . We will respond within 30 days.
        </p>
        <p>
            California residents have additional rights under the&nbsp;CCPA/CPRA.
            Treetrack does not “sell” or “share” personal information as those terms
            are defined by California law.
        </p>

        {/* 10. Children ------------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">10.&nbsp;Children’s&nbsp;Privacy</h2>
        <p>
            Treetrack is not directed to children under&nbsp;13. We do not knowingly
            collect personal information from children. If we become aware that a
            child under&nbsp;13 has provided data, we will delete it promptly.
        </p>

        {/* 11. Policy Changes ------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">11.&nbsp;Changes&nbsp;to&nbsp;This&nbsp;Policy</h2>
        <p>
            We may update this Privacy Policy from time to time. We will post the
            revised version and update the “Last updated” date. Material changes will
            be announced via the app or email at least 30 days in advance.
        </p>

        {/* 12. Contact -------------------------------------------------------- */}
        <h2 className="text-2xl font-semibold mt-6 mb-3">12.&nbsp;Contact&nbsp;Us</h2>
        <p>
            Questions or concerns? Email&nbsp;
            <a href="mailto:privacy@treetrack.xyz" className="underline">
                privacy@treetrack.xyz
            </a>
        </p>
    </div>
);

export default PrivacyPolicy;
