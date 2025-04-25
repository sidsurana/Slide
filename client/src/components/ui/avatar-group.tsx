import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AvatarGroupProps {
  users: {
    id: number;
    name?: string;
    image?: string;
  }[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  linkToProfiles?: boolean;
}

export function AvatarGroup({ users, max = 3, size = "md", className, linkToProfiles = true }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleUsers.map((user) => (
        <TooltipProvider key={user.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkToProfiles ? (
                <Link href={`/users/${user.id}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      "border-2 border-white cursor-pointer transition-transform hover:scale-110 hover:z-10"
                    )}
                  >
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name || `User ${user.id}`} />
                    ) : (
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : `U${user.id}`}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
              ) : (
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    "border-2 border-white"
                  )}
                >
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name || `User ${user.id}`} />
                  ) : (
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0).toUpperCase() : `U${user.id}`}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name || `User ${user.id}`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={cn(
            sizeClasses[size],
            "flex items-center justify-center rounded-full bg-muted border-2 border-white text-xs font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
