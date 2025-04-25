import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Mail, Calendar, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User, UserAvailability } from "@shared/schema";

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Get specific user by ID
  const { data: user, isLoading: loadingUser, error } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !isNaN(userId),
  });

  // Get user availability
  const { data: userAvailability, isLoading: loadingAvailability } = useQuery<UserAvailability[]>({
    queryKey: ["/api/availability/user", userId],
    enabled: !isNaN(userId),
  });

  // Handle errors or invalid user ID
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Could not load user profile",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [error, navigate, toast]);

  const isLoading = loadingUser || loadingAvailability;
  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  if (isLoading) {
    return (
      <main className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-grow overflow-y-auto p-4">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-6">The user profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow overflow-y-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">User Profile</h1>
      </div>
      
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24 mb-4">
          {user?.profileImage ? (
            <AvatarImage src={user.profileImage} alt={user.fullName} />
          ) : (
            <AvatarFallback className="text-2xl">
              {user?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <h2 className="text-2xl font-bold">{user?.fullName}</h2>
        <p className="text-gray-500 mb-4">@{user?.username}</p>
        
        {!isOwnProfile && (
          <div className="flex space-x-2 w-full max-w-xs">
            <Button className="flex-1">
              Connect
            </Button>
            <Button variant="outline" className="flex-1">
              Message
            </Button>
          </div>
        )}
        
        {isOwnProfile && (
          <Button className="w-full max-w-xs" onClick={() => navigate("/profile")}>
            Edit Profile
          </Button>
        )}
      </div>

      <Tabs defaultValue="about">
        <TabsList className="w-full">
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          <TabsTrigger value="availability" className="flex-1">Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About {isOwnProfile ? "Me" : user.fullName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOwnProfile && user.profession && (
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">Profession</p>
                    <p className="text-gray-600">{user.profession}</p>
                  </div>
                </div>
              )}
              
              {isOwnProfile && (
                <>
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">Profession</p>
                      <p className="text-gray-600">{user.profession || "Not specified"}</p>
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <p className="font-medium">Bio</p>
                <p className="text-gray-600 mt-1">{user.bio || "No bio provided."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwnProfile ? (
                <>
                  <AvailabilityCalendar
                    currentUserId={user.id}
                    initialAvailability={userAvailability?.[0]?.timeslots as string[] || []}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    <p className="text-sm">View when {user.fullName.split(' ')[0]} is available to hang out</p>
                  </div>
                  
                  <AvailabilityCalendar
                    currentUserId={user.id}
                    initialAvailability={userAvailability?.[0]?.timeslots as string[] || []}
                    readOnly={true}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}