import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityCalendarProps {
  currentUserId: number;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  initialAvailability?: string[];
  readOnly?: boolean;
}

export function AvailabilityCalendar({
  currentUserId,
  selectedDate = new Date(),
  onDateChange,
  initialAvailability = [],
  readOnly = false,
}: AvailabilityCalendarProps) {
  const [date, setDate] = useState(selectedDate);
  const [selectedTimeslots, setSelectedTimeslots] = useState<string[]>(initialAvailability);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const prevMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    setDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    setDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };
  
  const handleDayClick = (day: number) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), day);
    setDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };
  
  const toggleTimeSlot = (slot: string) => {
    if (readOnly) return; // Don't allow changes in readOnly mode
    
    if (selectedTimeslots.includes(slot)) {
      setSelectedTimeslots(selectedTimeslots.filter(s => s !== slot));
    } else {
      setSelectedTimeslots([...selectedTimeslots, slot]);
    }
  };
  
  const saveAvailability = async () => {
    try {
      setIsSaving(true);
      
      // Format the date properly for the API
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);
      
      console.log("Sending availability:", {
        userId: currentUserId,
        date: formattedDate.toISOString(),
        timeslots: JSON.stringify(selectedTimeslots), // Convert to string for the json field
      });
      
      await apiRequest("POST", "/api/availability", {
        userId: currentUserId,
        date: formattedDate.toISOString(),
        timeslots: JSON.stringify(selectedTimeslots), // Convert to string for the json field
      });
      
      toast({
        title: "Availability Saved",
        description: `Your availability for ${date.toLocaleDateString()} has been saved.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/availability/user", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/availability/date", date.toISOString().split('T')[0]] });
    } catch (error) {
      console.error("Failed to save availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate calendar days
  const days = [];
  // Add previous month days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: new Date(date.getFullYear(), date.getMonth(), 0).getDate() - firstDayOfMonth + i + 1, isPrevMonth: true });
  }
  
  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isPrevMonth: false, isSelected: i === date.getDate() });
  }
  
  // Add next month days to fill the grid (6 rows of 7 days)
  const totalDaysShown = 42; // 6 rows * 7 days
  const remainingDays = totalDaysShown - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isNextMonth: true });
  }

  const monthName = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  
  return (
    <Card className="bg-white shadow rounded-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <h3 className="font-medium">{monthName} {year}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div
              key={i}
              className={`text-center py-2 ${
                day.isPrevMonth || day.isNextMonth
                  ? "text-gray-400"
                  : day.isSelected
                  ? "bg-secondary text-white rounded font-medium"
                  : "hover:bg-gray-100 rounded cursor-pointer"
              }`}
              onClick={() => !day.isPrevMonth && !day.isNextMonth && handleDayClick(day.day)}
            >
              {day.day}
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">
            {date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("early_morning_1")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("early_morning_1")}
            >
              <div className="text-xs text-muted-foreground">EARLY MORNING</div>
              <div className="font-medium">6am - 9am</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("morning")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("morning")}
            >
              <div className="text-xs text-muted-foreground">MORNING</div>
              <div className="font-medium">9am - 12pm</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("early_afternoon")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("early_afternoon")}
            >
              <div className="text-xs text-muted-foreground">EARLY AFTERNOON</div>
              <div className="font-medium">12pm - 3pm</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("late_afternoon")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("late_afternoon")}
            >
              <div className="text-xs text-muted-foreground">LATE AFTERNOON</div>
              <div className="font-medium">3pm - 6pm</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("evening")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("evening")}
            >
              <div className="text-xs text-muted-foreground">EVENING</div>
              <div className="font-medium">6pm - 9pm</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("night")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("night")}
            >
              <div className="text-xs text-muted-foreground">NIGHT</div>
              <div className="font-medium">9pm - 12am</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("late_night")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("late_night")}
            >
              <div className="text-xs text-muted-foreground">LATE NIGHT</div>
              <div className="font-medium">12am - 3am</div>
            </div>
            <div
              className={`p-2 rounded text-center cursor-pointer border ${
                selectedTimeslots.includes("early_morning_2")
                  ? "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  : "border-gray-300"
              }`}
              onClick={() => toggleTimeSlot("early_morning_2")}
            >
              <div className="text-xs text-muted-foreground">EARLY MORNING</div>
              <div className="font-medium">3am - 6am</div>
            </div>
          </div>
        </div>
        
        {!readOnly && (
          <Button
            className="w-full mt-6 py-2 bg-secondary text-white rounded-lg font-medium"
            onClick={saveAvailability}
            disabled={isSaving || selectedTimeslots.length === 0}
          >
            {isSaving ? "Saving..." : "Save Availability"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
