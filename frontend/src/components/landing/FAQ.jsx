import React from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQ() {
    const faqs = [
        {
            "question": "What exactly is Treetrack?",
            "answer": "Treetrack is a project-management app that models every task as a node inside a tree structured. Dependencies are explicit, so you always know what must happen next and what’s blocking the critical path."
        },
        {
            "question": "How is it different from JIRA, ClickUp, or Trello?",
            "answer": "Boards and lists hide dependencies; you discover blockers too late. Treetrack’s DAG makes those links first-class: collapse future branches, auto-surface critical tasks, and get instant 'what-if' impact when due dates move—without JIRA’s overhead."
        },
        {
            "question": "What do I get on the Free plan?",
            "answer": "Three projects, unlimited viewers, and basic templates. No time limit and no credit card required."
        },
        {
            "question": "When should I upgrade to Pro?",
            "answer": "Upgrade when you need unlimited projects, bulk AI editing, and teams larger than five people. Pro is \$4 per seat / month or \$30 billed annually."
        },
        {
            "question": "Does Treetrack have an AI assistant?",
            "answer": "Yes. Type a plain-English prompt—e.g., “Plan a product-launch timeline in six weeks”—and the co-planner generates a fully sequenced DAG you can tweak. AI also refines, groups, or reschedules existing tasks."
        },
        {
            "question": "Can I import my existing tasks?",
            "answer": "Not yet! Freeform input from CSV and other services is planned in the future."
        },
        {
            "question": "How do sharing and permissions work?",
            "answer": "Every project can be private, team-only, or publicly view or edit only with revokable sharing links."
        },
    ]

    return (
        <section id="features" className="w-full py-8 md:py-16 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                        Frequently Asked Questions
                    </h2>
                </div>

                <Accordion type="single" collapsible>
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger key={index}>
                                <span className="text-xl">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

            </div>
        </section>
    )
};