import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Mail, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/users/current"],
  });

  // Get user friends
  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["/api/users/friends", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const isLoading = loadingUser || loadingFriends;

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

  return (
    <main className="flex-grow overflow-y-auto p-4">
      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-24 w-24 mb-4">
          {currentUser?.profileImage ? (
            <AvatarImage src={currentUser.profileImage} alt={currentUser.fullName} />
          ) : (
            <AvatarFallback className="text-2xl">
              {currentUser?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <h2 className="text-2xl font-bold">{currentUser?.fullName}</h2>
        <p className="text-gray-500 mb-4">{currentUser?.username}</p>
        <Button className="w-full max-w-xs">Edit Profile</Button>
      </div>

      <Tabs defaultValue="about">
        <TabsList className="w-full">
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          <TabsTrigger value="availability" className="flex-1">Availability</TabsTrigger>
          <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{currentUser?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">Profession</p>
                  <p className="text-gray-600">{currentUser?.profession || "Not specified"}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium">Bio</p>
                <p className="text-gray-600 mt-1">{currentUser?.bio || "No bio provided."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>My Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You can set your availability in the Availability tab. This helps your friends know when you're free to hang out.
              </p>
              <Button className="w-full">Go to Availability</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="friends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Friends</CardTitle>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Friends
              </Button>
            </CardHeader>
            <CardContent>
              {friends && friends.length > 0 ? (
                <div className="space-y-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        {friend.profileImage ? (
                          <AvatarImage src={friend.profileImage} alt={friend.fullName} />
                        ) : (
                          <AvatarFallback>
                            {friend.fullName.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.fullName}</p>
                        <p className="text-gray-500 text-sm">{friend.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No friends added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
