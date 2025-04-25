import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const [eventType, setEventType] = useState("social");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [friendGroup, setFriendGroup] = useState("all");
  const [category, setCategory] = useState("Tech");
  const [maxAttendees, setMaxAttendees] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!title || !description || !date || !time) {
        toast({
          title: "Missing Fields",
          description: "Please fill out all required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Combine date and time
      const eventDateTime = new Date(`${date}T${time}`);
      
      // Get current user ID (in a real app, this would come from auth)
      const currentUser = await queryClient.fetchQuery({
        queryKey: ["/api/users/current"],
      });
      
      const eventData = {
        title,
        description,
        date: eventDateTime.toISOString(),
        location,
        hostId: currentUser.id,
        type: eventType,
        ...(eventType === "social" 
          ? { friendGroupId: friendGroup }
          : { category, maxAttendees: parseInt(maxAttendees) }
        ),
      };
      
      await apiRequest("POST", "/api/events", eventData);
      
      toast({
        title: "Event Created",
        description: `Your ${eventType} event has been created successfully.`,
      });
      
      // Invalidate events queries
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create the event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEventType("social");
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setFriendGroup("all");
    setCategory("Tech");
    setMaxAttendees("20");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Event</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Event Type</Label>
            <RadioGroup 
              value={eventType} 
              onValueChange={setEventType}
              className="flex space-x-4"
            >
              <div className="flex items-center">
                <RadioGroupItem value="social" id="social" />
                <Label htmlFor="social" className="ml-2">Social</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="networking" id="networking" />
                <Label htmlFor="networking" className="ml-2">Networking</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </Label>
            <Input
              id="event-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner at Osteria"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label htmlFor="event-time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter event location"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event..."
              rows={3}
              className="w-full"
            />
          </div>
          
          {eventType === "social" ? (
            <div>
              <Label htmlFor="friend-group" className="block text-sm font-medium text-gray-700 mb-1">
                Who to invite
              </Label>
              <Select value={friendGroup} onValueChange={setFriendGroup}>
                <SelectTrigger id="friend-group">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Friends</SelectItem>
                  <SelectItem value="close">Close Friends</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="coworkers">Coworkers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry/Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="max-attendees" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Attendees
                </Label>
                <Input
                  id="max-attendees"
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  min="1"
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
