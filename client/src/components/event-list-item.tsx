import { Card, CardContent } from "@/components/ui/card";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { cn } from "@/lib/utils";
import { Event, User } from "@shared/schema";

interface EventListItemProps {
  event: Event;
  participants: Array<{ user: User; status: string }>;
  status: "going" | "pending" | "hosting";
}

export function EventListItem({ event, participants, status }: EventListItemProps) {
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  
  const formattedTime = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const goingParticipants = participants.filter(p => p.status === "going");

  const getBorderColor = () => {
    switch (status) {
      case "going":
        return "border-primary";
      case "pending":
        return "border-accent";
      case "hosting":
        return "border-green-500";
      default:
        return "border-primary";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "going":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded h-min">
            Going
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded h-min">
            Pending
          </span>
        );
      case "hosting":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded h-min">
            Hosting
          </span>
        );
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardContent className={cn("p-4 border-l-4", getBorderColor())}>
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-gray-600 text-sm">
              {formattedDate} · {formattedTime}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="mt-3 flex items-center">
          {goingParticipants.length > 0 ? (
            <>
              <AvatarGroup 
                users={goingParticipants.map(p => ({
                  id: p.user.id,
                  name: p.user.fullName,
                  image: p.user.profileImage,
                }))}
                size="sm"
                className="mr-2"
              />
              <p className="text-xs text-gray-600">
                {goingParticipants.length} {event.type === "social" ? "friends" : "attendees"} going
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-600">
              No {event.type === "social" ? "friends" : "attendees"} going yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
