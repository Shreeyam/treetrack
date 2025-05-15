import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function Pricing() {
    return (
    <section id="pricing" className="w-full py-12 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-md text-center mb-10">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple, transparent pricing</h2>
                <p className="mt-4 text-muted-foreground">
                    Choose the plan that works best for your workflow
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center max-w-4xl mx-auto">
                {/* Starter Plan */}
                <Card className="flex flex-col w-full ">
                    <CardHeader>
                        <CardTitle>Starter</CardTitle>
                        <CardDescription>Perfect for individuals getting started.</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">Free</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-2">
                            {["3 projects", "Up to 3 collaborators", "Basic graph visualization", "Personal dashboard"].map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Try for free</Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="flex flex-col border-primary w-full">
                    <CardHeader>
                        {/* <div className="px-3 py-1 text-xs bg-primary text-primary-foreground w-fit rounded-full mb-2">
                                    Most Popular
                                </div> */}
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For serious productivity enthusiasts.</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$6</span>
                            <span className="text-muted-foreground"> /month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-2">
                            {[
                                "AI features",
                                "Unlimited projects",
                                "Unlimited collaborators",
                                "Critical path analysis",
                            ].map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full">Get started</Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Enterprise</CardTitle>
                        <CardDescription>For organizations with advanced needs.</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$10</span>
                            <span className="text-muted-foreground"> /user/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-2">
                            {[
                                "Unlimited everything",
                                "Admin dashboard",
                                "Dedicated support",
                                "On-premise option"
                            ].map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Contact sales</Button>
                    </CardFooter>
                </Card> */}
            </div>
        </div>
    </section>);
};