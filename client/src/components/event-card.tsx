import { Check, X, MapPin, Calendar, Clock, User as UserIcon, BookUser, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Event, EventParticipant, User } from "@shared/schema";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: Event;
  participants: Array<{ user: User; status: string }>;
  currentUserId: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isAvailable?: boolean;
}

export function EventCard({
  event,
  participants,
  currentUserId,
  onSwipeLeft,
  onSwipeRight,
  isAvailable = false,
}: EventCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
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
  
  const handleDecline = async () => {
    await handleResponse("declined");
    if (onSwipeLeft) onSwipeLeft();
  };

  const handleAccept = async () => {
    await handleResponse("going");
    if (onSwipeRight) onSwipeRight();
  };

  const currentUserAttending = participants.some(p => 
    p.user.id === currentUserId && p.status === "going"
  );

  const handleResponse = async (status: string) => {
    try {
      setIsLoading(true);
      
      // Check if already responded to show different toast
      const alreadyResponded = participants.some(p => p.user.id === currentUserId);
      
      // Add user to participants list immediately for UI feedback
      if (status === "going" && !currentUserAttending) {
        // Add the current user to the participants list
        participants.push({
          user: {
            id: currentUserId,
            fullName: "You",
            profileImage: null,
          } as User,
          status: "going"
        });
      }
      
      await apiRequest("POST", "/api/event-participants", {
        eventId: event.id,
        userId: currentUserId,
        status,
      });
      
      toast({
        title: status === "going" ? "You're going!" : "Event declined",
        description: status === "going" 
          ? `You've joined ${event.title}` 
          : `You've declined ${event.title}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/user"] });
      
      // Log the response to console for debugging
      console.log(`Response saved: ${status} for event ${event.id}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SwipeableCard
      className="relative mx-auto bg-card rounded-xl shadow-xl overflow-hidden border border-border max-w-sm"
      onSwipeLeft={handleDecline}
      onSwipeRight={handleAccept}
    >
      <div className="h-52 w-full bg-muted overflow-hidden relative">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/70">{event.title.charAt(0)}</span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        
        {/* Title area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <motion.h2 
            className="text-2xl font-bold mb-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {event.title}
          </motion.h2>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{formattedTime}</span>
          </div>
        </div>
        
        {isAvailable && (
          <Badge className="mb-3 bg-green-600 hover:bg-green-700">
            You're free on this day
          </Badge>
        )}
        
        {event.location && (
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">{event.location}</span>
          </div>
        )}
        
        <div className="mb-4">
          <p className="text-card-foreground">{event.description}</p>
        </div>
        
        {/* Friends Going */}
        <div className="flex items-center mb-5">
          <AvatarGroup 
            users={goingParticipants.map(p => ({
              id: p.user.id,
              name: p.user.fullName,
              image: p.user.profileImage || undefined,
            }))}
          />
          <p className="ml-2 text-sm text-muted-foreground">
            {goingParticipants.length} {goingParticipants.length === 1 ? 'friend' : 'friends'} going
          </p>
        </div>
        
        {/* Host Information */}
        <div className="border-t border-b border-border py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Host Avatar and Name */}
              <div className="flex items-center">
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  {participants.find(p => p.user.id === event.hostId)?.user.profileImage ? (
                    <AvatarImage 
                      src={participants.find(p => p.user.id === event.hostId)?.user.profileImage || ''} 
                      alt="Host" 
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                      {participants.find(p => p.user.id === event.hostId)?.user.fullName.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium flex items-center">
                    <span className="text-xs text-primary font-semibold mr-1">Hosted by</span> 
                    {participants.find(p => p.user.id === event.hostId)?.user.fullName || 'Unknown'}
                  </p>
                  {participants.find(p => p.user.id === event.hostId)?.user.profession && (
                    <p className="text-xs text-muted-foreground">
                      {participants.find(p => p.user.id === event.hostId)?.user.profession}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* View Profile Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/users/${event.hostId}`} onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 text-xs rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                    >
                      <UserIcon className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See host's full profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs flex items-center gap-1 px-2 py-1 border-primary/20 text-primary">
              <AlignJustify className="h-3 w-3" />
              {event.type}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-red-500/50 hover:bg-red-500/10"
              onClick={handleDecline}
              disabled={isLoading}
            >
              <X className="h-6 w-6 text-red-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-green-500/50 hover:bg-green-500/10"
              onClick={handleAccept}
              disabled={isLoading}
            >
              <Check className="h-6 w-6 text-green-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </SwipeableCard>
  );
}
