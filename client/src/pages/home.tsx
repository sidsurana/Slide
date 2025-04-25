import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import TabNavigation from "@/components/tab-navigation";
import { EventCard } from "@/components/event-card";
import { NetworkingCard } from "@/components/networking-card";
import { SearchBar } from "@/components/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCw, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState("social");
  const [searchTerm, setSearchTerm] = useState("");

  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get events by type
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["/api/events", { type: activeTab }],
  });

  // Get all participants for displayed events
  const eventIds = events?.map(event => event.id) || [];
  const { data: allParticipants, isLoading: loadingParticipants } = useQuery({
    queryKey: ["/api/event-participants", eventIds],
    enabled: eventIds.length > 0,
  });

  // Get all users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Get user availability
  const { data: userAvailability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["/api/availability/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Loading state
  const isLoading = loadingUser || loadingEvents || loadingParticipants || loadingUsers || loadingAvailability;

  // Function to check if the user is available for an event
  const isUserAvailableForEvent = (eventDate: string) => {
    if (!userAvailability) return false;
    
    const eventDateOnly = new Date(eventDate).toISOString().split('T')[0];
    
    return userAvailability.some(availability => {
      const availabilityDate = new Date(availability.date).toISOString().split('T')[0];
      return availabilityDate === eventDateOnly;
    });
  };

  // State to track processed events
  const [processedEvents, setProcessedEvents] = useState<number[]>([]);

  // Function to handle card swipe left (decline)
  const handleSwipeLeft = (eventId: number) => {
    console.log(`Swiped left on event ${eventId}`);
    // Add to processed events to mark it as seen
    setProcessedEvents(prev => [...prev, eventId]);
  };

  // Function to handle card swipe right (accept)
  const handleSwipeRight = (eventId: number) => {
    console.log(`Swiped right on event ${eventId}`);
    // Add to processed events to mark it as seen
    setProcessedEvents(prev => [...prev, eventId]);
  };

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
  
  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    if (!searchTerm) return events;
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return events.filter(event => {
      return (
        event.title?.toLowerCase().includes(lowerCaseSearch) ||
        event.description?.toLowerCase().includes(lowerCaseSearch) ||
        event.location?.toLowerCase().includes(lowerCaseSearch) ||
        (Array.isArray(event.tags) && 
          event.tags.some((tag: string) => 
            tag.toLowerCase().includes(lowerCaseSearch)
          )
        )
      );
    });
  }, [events, searchTerm]);

  return (
    <main className="flex-grow overflow-y-auto">
      <TabNavigation 
        tabs={[
          { id: "social", label: "Social", icon: <Users className="h-4 w-4" /> },
          { id: "networking", label: "Networking", icon: <Briefcase className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
      />

      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-72 w-full max-w-sm rounded-xl" />
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "social" ? (
            <motion.div 
              key="social"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="relative h-[calc(100vh-180px)] p-4"
            >
              <div className="mb-3">
                <SearchBar 
                  onSearch={setSearchTerm}
                  placeholder="Search social events..."
                  className="w-full max-w-sm mx-auto"
                />
              </div>
              
              {filteredEvents.length > 0 ? (
                <div className="relative mx-auto h-full flex justify-center">
                  {filteredEvents.map((event, index) => (
                    <div 
                      key={event.id}
                      className="absolute top-8 left-0 right-0 mx-auto"
                      style={{ 
                        zIndex: events.length - index,
                        opacity: index === 0 ? 1 : index === 1 ? 0.7 : 0.5,
                        transform: `scale(${1 - index * 0.05}) translateY(${index * 8}px)`,
                        display: index < 3 ? 'block' : 'none',
                        pointerEvents: index === 0 ? 'auto' : 'none'
                      }}
                    >
                      {index === 0 ? (
                        <EventCard
                          event={event}
                          participants={getParticipantsWithUsers(event.id)}
                          currentUserId={currentUser?.id}
                          onSwipeLeft={() => handleSwipeLeft(event.id)}
                          onSwipeRight={() => handleSwipeRight(event.id)}
                          isAvailable={isUserAvailableForEvent(event.date)}
                        />
                      ) : (
                        <div className="h-72 w-full max-w-sm mx-auto bg-card/80 rounded-xl shadow-md overflow-hidden border border-border">
                          <div className="h-40 w-full bg-muted"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <RotateCw className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium text-foreground">No Events Found</h3>
                  <p className="text-muted-foreground mt-1">
                    There are no social events to show right now.
                  </p>
                  <Button className="mt-4" onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="networking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent/70">
                  Networking Events
                </h2>
                <p className="text-muted-foreground mt-1">
                  Find professional events that match your interests
                </p>
                <div className="mt-3">
                  <SearchBar 
                    onSearch={setSearchTerm}
                    placeholder="Search events by title, description, or tags..."
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <NetworkingCard
                        event={event}
                        currentUserId={currentUser?.id}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <RotateCw className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-foreground">No Networking Events</h3>
                    <p className="text-muted-foreground mt-1">
                      There are no networking events to show right now.
                    </p>
                    <Button className="mt-4" onClick={() => window.location.reload()}>
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}
