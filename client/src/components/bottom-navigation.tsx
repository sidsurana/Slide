import { CalendarDays, Plus, Users, User, Calendar, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreateEventModal } from "@/components/create-event-modal";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  const [location] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define tab animation properties
  const tabVariants = {
    inactive: { scale: 1 },
    active: { scale: 1.1 }
  };

  return (
    <>
      <nav className="bg-background border-t border-border p-1 sticky bottom-0 z-10">
        <div className="flex justify-around items-center">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "py-2 px-4 flex flex-col items-center h-auto",
                location === "/" 
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1">Explore</span>
            </Button>
          </Link>
          
          <Link href="/availability">
            <Button
              variant="ghost"
              className={cn(
                "py-2 px-4 flex flex-col items-center h-auto",
                location === "/availability" 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs mt-1">Available</span>
            </Button>
          </Link>
          
          <motion.button 
            className="py-2 px-4"
            onClick={() => setIsModalOpen(true)}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-gradient-to-tr from-primary to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.button>
          
          <Link href="/my-events">
            <Button
              variant="ghost"
              className={cn(
                "py-2 px-4 flex flex-col items-center h-auto",
                location === "/my-events" 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs mt-1">My Events</span>
            </Button>
          </Link>
          
          <Link href="/groups">
            <Button
              variant="ghost"
              className={cn(
                "py-2 px-4 flex flex-col items-center h-auto",
                location === "/groups" 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs mt-1">Groups</span>
            </Button>
          </Link>
        </div>
      </nav>
      
      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
