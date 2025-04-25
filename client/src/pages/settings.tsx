import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  LogOut, 
  Moon, 
  Sun, 
  History, 
  Calendar, 
  ChevronRight, 
  Globe, 
  ArrowLeft 
} from "lucide-react";

// List of timezones we're supporting
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" }
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [timezone, setTimezone] = useState("");
  
  // Get user's attended events
  const { data: attendedEvents = [], isLoading: loadingEvents } = useQuery<any[]>({
    queryKey: ["/api/events/user", user?.id, { status: "going" }],
    enabled: !!user?.id,
  });
  
  // Set timezone based on user's settings or browser default
  useEffect(() => {
    // Try to get timezone from user preferences or use browser default
    const userTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, [user]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const updateTimezone = async (newTimezone: string) => {
    try {
      setTimezone(newTimezone);
      
      if (user?.id) {
        // Update timezone in the database
        await apiRequest("PATCH", `/api/users/${user.id}/timezone`, { timezone: newTimezone });
        
        // Invalidate user data to reflect changes
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
      
      toast({
        title: "Timezone Updated",
        description: `Your timezone has been set to ${TIMEZONES.find(tz => tz.value === newTimezone)?.label || newTimezone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update timezone",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <SettingsIcon className="mr-2 h-6 w-6" />
          Settings
        </h1>
      </div>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{user.fullName || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Username</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{user.email || 'Not set'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button asChild variant="outline">
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Event History</CardTitle>
                <CardDescription>
                  View events you've attended in the past
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : attendedEvents && attendedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {attendedEvents.map((event: any) => (
                      <div 
                        key={event.id} 
                        className="flex justify-between items-center p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <History className="mr-2 h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/events/${event.id}`}>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">You haven't attended any events yet</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/my-events">View All Events</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Logout</CardTitle>
                <CardDescription>
                  Sign out of your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You will be logged out of your account and will need to sign in again to access your data.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {theme === 'dark' ? (
                    <Moon className="mr-2 h-5 w-5" />
                  ) : (
                    <Sun className="mr-2 h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Switch between dark and light theme
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={(checked) => {
                    setTheme(checked ? 'dark' : 'light');
                  }}
                />
              </div>
              
              <Separator />
              
              <div>
                <p className="font-medium mb-2">Color Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    className={`
                      bg-white border border-border p-4 rounded-md text-center cursor-pointer transition
                      ${theme === 'light' ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setTheme('light')}
                  >
                    <div className="h-10 bg-primary/10 rounded mb-2"></div>
                    <span className="text-sm font-medium">Light</span>
                  </div>
                  <div 
                    className={`
                      bg-stone-950 border border-stone-800 p-4 rounded-md text-center cursor-pointer transition text-white
                      ${theme === 'dark' ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="h-10 bg-primary/20 rounded mb-2"></div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                  <div 
                    className={`
                      bg-gradient-to-br from-slate-100 to-white border border-border p-4 rounded-md text-center cursor-pointer transition
                      ${theme === 'system' ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setTheme('system')}
                  >
                    <div className="h-10 bg-gradient-to-r from-primary/20 to-primary/10 rounded mb-2"></div>
                    <span className="text-sm font-medium">System</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Availability Settings */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability Preferences</CardTitle>
              <CardDescription>
                Set your time preferences for scheduling events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="font-medium mb-1 block">Timezone</label>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Select value={timezone} onValueChange={(value) => updateTimezone(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This timezone will be used for all your events and availability
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">3-Hour Time Slots</p>
                  <Button asChild variant="outline">
                    <Link href="/availability">
                      Edit Availability
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">EARLY MORNING</div>
                    <div className="font-medium">6am - 9am</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">MORNING</div>
                    <div className="font-medium">9am - 12pm</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">EARLY AFTERNOON</div>
                    <div className="font-medium">12pm - 3pm</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">LATE AFTERNOON</div>
                    <div className="font-medium">3pm - 6pm</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">EVENING</div>
                    <div className="font-medium">6pm - 9pm</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">NIGHT</div>
                    <div className="font-medium">9pm - 12am</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">LATE NIGHT</div>
                    <div className="font-medium">12am - 3am</div>
                  </div>
                  <div className="p-2 text-center rounded-md border border-border bg-background hover:bg-muted/50 transition cursor-pointer">
                    <div className="text-xs text-muted-foreground">EARLY MORNING</div>
                    <div className="font-medium">3am - 6am</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  These are the available time slots that you can select on the availability page.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Link href="/availability" className="block">
                  <Button className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Go to Availability Calendar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}