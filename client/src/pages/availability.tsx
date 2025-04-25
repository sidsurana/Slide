import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Availability() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/users/current"],
  });

  // Get user availability
  const { data: userAvailability, isLoading: loadingAvailability } = useQuery({
    queryKey: ["/api/availability/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Format date to match with availability data
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Get availability for the selected date
  const selectedDateAvailability = userAvailability?.find(a => {
    const availDate = new Date(a.date).toISOString().split('T')[0];
    return availDate === formattedDate;
  });

  const isLoading = loadingUser || loadingAvailability;

  return (
    <main className="flex-grow overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Availability</h2>
        <p className="text-gray-600 mt-1">Set when you're free to hang out</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <AvailabilityCalendar
          currentUserId={currentUser?.id}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          initialAvailability={selectedDateAvailability?.timeslots || []}
        />
      )}
    </main>
  );
}
