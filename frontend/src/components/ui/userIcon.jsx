import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function UserIcon({ user, className, ...props }) {
    return (
        <Avatar
            className={cn("w-6 h-6", className)}
            {...props}
        >
            {user?.image ? (
                <AvatarImage src={user.image} alt={user.name || "User Avatar"} />
            ) : (
                <AvatarFallback>
                    {user?.name?.charAt(0) || "?"}
                </AvatarFallback>
            )}
        </Avatar>
    )
}