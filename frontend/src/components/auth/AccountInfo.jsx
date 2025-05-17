import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Check, ExternalLink, SubscriptIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UserIcon from '@/components/ui/userIcon';
import Loading from "../ui/loading";
import { Separator } from "@/components/ui/separator";

const AccountInfo = () => {
    const { data: userData, isPending } = authClient.useSession();
    const [error, setError] = useState(null);
    const [subscriptions, setSubscriptions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("AccountInfo useEffect triggered");
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            // Fetch user session
            const { data: sessionData, isPending } = await authClient.getSession();
            const { data: subscriptionData } = await authClient.subscription.list();
            console.log(subscriptionData);
            setSubscriptions(subscriptionData);

        };
        fetchData();
    }, [userData]);

    if (userData) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Page title */}
                <h1 className="text-2xl font-bold">Account Settings</h1>

                <Separator />

                {/* Personal Information */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                            {userData.user.image ? (
                                <AvatarImage
                                    src={userData.user.image}
                                    alt={`${userData.user.name} avatar`}
                                />
                            ) : (
                                <AvatarFallback>
                                    {userData.user.name.charAt(0)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-lg font-medium">
                                {userData.user.name} {userData.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {userData.user.email}
                            </p>
                        </div>
                    </div>
                </section>

                <Separator />

                {/* Subscriptions */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Subscriptions</h2>
                    <div className="flex flex-col space-y-2">
                        {subscriptions && subscriptions.map((subscription) => (
                            <Card key={subscription.id}>
                                <CardHeader>
                                    <CardTitle>{subscription.plan.name}</CardTitle>
                                    <CardDescription>
                                        {subscription.status}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">
                                        {subscription.plan}
                                    </p>
                                        {/* {subscription.periodStart} */}
                                        {/* {subscription.periodEnd} */}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full">
                                        Manage Subscription via Stripe <ExternalLink/>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                <Separator />

                {/* Delete Account */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Delete Account</h2>
                    <p className="text-sm text-red-600">
                        This action is irreversible. Please proceed with caution.
                    </p>
                    <Button variant="destructive">
                        Delete Account
                    </Button>
                </section>
            </div>
        );

    }
};

export default AccountInfo;
