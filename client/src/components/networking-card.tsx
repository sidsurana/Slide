import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { MapPin, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface NetworkingCardProps {
  event: Event;
  currentUserId: number;
  onApply?: () => void;
}

export function NetworkingCard({ 
  event, 
  currentUserId,
  onApply 
}: NetworkingCardProps) {
  const [isApplying, setIsApplying] = useState(false);
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

  const handleApply = async () => {
    try {
      setIsApplying(true);
      
      await apiRequest("POST", "/api/event-participants", {
        eventId: event.id,
        userId: currentUserId,
        status: "pending",
      });
      
      toast({
        title: "Application Submitted",
        description: `Your request to join ${event.title} is pending approval.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-participants", event.id] });
      
      if (onApply) onApply();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your application",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-card border border-border shadow-lg rounded-xl overflow-hidden">
        <div className="h-40 w-full bg-muted overflow-hidden relative">
          {event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-accent/70">{event.title.charAt(0)}</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          
          {event.category && (
            <Badge className="absolute top-3 left-3 bg-accent text-white font-medium">
              {event.category}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-5">
          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{formattedTime}</span>
            </div>
          </div>
          
          {event.location && (
            <div className="flex items-center text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{event.location}</span>
            </div>
          )}
          
          <p className="text-card-foreground mb-4 line-clamp-2">{event.description}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-sm">
                {event.maxAttendees || 'Unlimited'} attendees
              </span>
            </div>
            <Button 
              className="px-4 py-2 bg-gradient-to-r from-accent to-accent/80 text-white rounded-lg font-medium"
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? "Applying..." : "Apply"}
              {!isApplying && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
