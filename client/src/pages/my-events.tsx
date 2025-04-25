import { useQuery } from "@tanstack/react-query";
import { EventListItem } from "@/components/event-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

export default function MyEvents() {
  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/users/current"],
  });

  // Get user events
  const { data: userEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ["/api/events/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Get all participants for user events
  const eventIds = userEvents?.map(event => event.id) || [];
  const { data: allParticipants, isLoading: loadingParticipants } = useQuery({
    queryKey: ["/api/event-participants", eventIds],
    enabled: eventIds.length > 0,
  });

  // Get all users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  const isLoading = loadingUser || loadingEvents || loadingParticipants || loadingUsers;

  // Function to enhance event with participants
  const getParticipantsWithUsers = (eventId: number) => {
    if (!allParticipants || !users) return [];
    
    const eventParticipants = allParticipants.filter(p => p.eventId === eventId);
    
    return eventParticipants.map(participant => ({
      user: users.find(user => user.id === participant.userId) || {
        id: participant.userId,
        fullName: 'Unknown User',
        profileImage: '',
      },
      status: participant.status,
    }));
  };

  // Determine user status for an event
  const getUserEventStatus = (event) => {
    if (event.hostId === currentUser?.id) return "hosting";
    
    const userParticipation = allParticipants?.find(
      p => p.eventId === event.id && p.userId === currentUser?.id
    );
    
    return userParticipation?.status === "going" ? "going" : "pending";
  };

  // Organize events by status
  const organizeEventsByStatus = () => {
    if (!userEvents) return { hosting: [], going: [], pending: [] };
    
    return userEvents.reduce(
      (acc, event) => {
        const status = getUserEventStatus(event);
        acc[status].push(event);
        return acc;
      },
      { hosting: [], going: [], pending: [] }
    );
  };

  const { hosting, going, pending } = organizeEventsByStatus();

  return (
    <main className="flex-grow overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Events</h2>
        <p className="text-gray-600 mt-1">Events you're attending or created</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {hosting.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Hosting</h3>
              <div className="space-y-4">
                {hosting.map(event => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    participants={getParticipantsWithUsers(event.id)}
                    status="hosting"
                  />
                ))}
              </div>
            </div>
          )}
          
          {going.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Going</h3>
              <div className="space-y-4">
                {going.map(event => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    participants={getParticipantsWithUsers(event.id)}
                    status="going"
                  />
                ))}
              </div>
            </div>
          )}
          
          {pending.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Pending</h3>
              <div className="space-y-4">
                {pending.map(event => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    participants={getParticipantsWithUsers(event.id)}
                    status="pending"
                  />
                ))}
              </div>
            </div>
          )}
          
          {hosting.length === 0 && going.length === 0 && pending.length === 0 && (
            <div className="py-10 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No Events</h3>
              <p className="text-gray-500 mt-1">
                You haven't joined or created any events yet.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
