import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MessageCircle, Users, ArrowRight, Search, UserPlus, Check, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { websocketClient } from "@/lib/websocket-service";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EventCard } from "@/components/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableCard } from "@/components/ui/swipeable-card";

export default function GroupsPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-groups");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Event creation states
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventType, setEventType] = useState("social");
  const [eventLocation, setEventLocation] = useState("");
  
  // Availability states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  // Fetch user's groups
  const { data: myGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['/api/groups/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/groups/user', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading groups:', error);
        return [];
      }
    }
  });

  // Fetch chat messages when a group is selected
  const { data: currentMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/messages', selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return [];
      
      try {
        const response = await fetch(`/api/chat/messages/${selectedGroup}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const messages = await response.json();
        return messages.map((msg: any) => ({
          id: msg.id,
          userId: msg.userId,
          text: msg.message,
          timestamp: new Date(msg.sentAt).toLocaleTimeString(),
          userName: msg.userName || 'Unknown'
        }));
      } catch (error) {
        console.error('Error loading messages:', error);
        return [];
      }
    },
    enabled: !!selectedGroup
  });

  // State for managing friend invitations
  const [isInviteFriendOpen, setIsInviteFriendOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  
  // State for group event voting
  const [isGroupEventOpen, setIsGroupEventOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isSwipingEnabled, setIsSwipingEnabled] = useState(false);
  
  // Chat message container ref for scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get user's friends
  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["/api/users/friends"],
    enabled: !!user?.id,
  });
  
  // Get user's groups
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ["/api/groups/user"],
    enabled: !!user?.id,
  });
  
  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string }) => {
      console.log("Creating group with data:", groupData);
      
      if (!user?.id) {
        throw new Error("You must be logged in to create a group");
      }
      
      try {
        const res = await apiRequest("POST", "/api/groups", groupData);
        const data = await res.json();
        console.log("Group created successfully:", data);
        return data;
      } catch (error) {
        console.error("Error creating group:", error);
        throw error;
      }
    },
    onSuccess: (newGroup) => {
      // Invalidate groups query
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
      
      toast({
        title: "Group created!",
        description: `${newGroupName} has been created successfully.`,
      });
      
      // Reset form and close dialog
      setNewGroupName("");
      setNewGroupDescription("");
      setIsCreateDialogOpen(false);
      
      // Select the newly created group
      setSelectedGroup(newGroup);
    },
    onError: (error: Error) => {
      console.error("Failed to create group:", error);
      toast({
        title: "Failed to create group",
        description: error.message || "There was a problem creating the group. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Invite friend mutation
  const inviteFriendMutation = useMutation({
    mutationFn: async (friendData: { email: string; name: string }) => {
      const res = await apiRequest("POST", "/api/friends/invite", friendData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${friendEmail}`,
      });
      
      // Reset form and close dialog
      setFriendEmail("");
      setFriendName("");
      setIsInviteFriendOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: {
      title: string;
      description: string;
      date: Date;
      type: string;
      location?: string;
      groupId: number;
    }) => {
      try {
        const res = await apiRequest("POST", "/api/events", eventData);
        const data = await res.json();
        console.log("Event created successfully:", data);
        return data;
      } catch (error) {
        console.error("Error creating event:", error);
        throw error;
      }
    },
    onSuccess: (newEvent) => {
      toast({
        title: "Event created!",
        description: `${eventTitle} has been created successfully.`,
      });
      
      // Reset form and close dialog
      setEventTitle("");
      setEventDescription("");
      setEventDate(new Date());
      setEventType("social");
      setEventLocation("");
      setIsCreateEventOpen(false);
      
      // Update groups and events
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message || "There was a problem creating the event. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { 
      groupId: number; 
      message: string;
      messageType?: string;
    }) => {
      // First attempt to use WebSockets for real-time delivery
      if (websocketClient && user) {
        websocketClient.sendChatMessage(
          messageData.groupId,
          messageData.message,
          messageData.messageType
        );
      }
      
      // Fallback to REST API
      const res = await apiRequest("POST", "/api/chat/messages", messageData);
      return await res.json();
    },
    onSuccess: () => {
      // Clear the message input
      setNewMessage("");
      
      // Scroll to bottom of chat
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData: {
      date: Date;
      timeslots: string[];
    }) => {
      const res = await apiRequest("POST", "/api/availability", availabilityData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability saved",
        description: "Your availability has been updated successfully.",
      });
      
      // Refresh user availability data
      queryClient.invalidateQueries({ queryKey: ["/api/availability/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save availability",
        description: error.message || "There was a problem saving your availability. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Connect to WebSocket when logged in
  useEffect(() => {
    if (user) {
      websocketClient.connect(user);
      
      // Set up message handler
      websocketClient.on('new_message', handleNewMessage);
      
      // Clean up on unmount
      return () => {
        websocketClient.off('new_message', handleNewMessage);
        websocketClient.disconnect();
      };
    }
  }, [user]);
  
  // Handle new messages from WebSocket
  const handleNewMessage = (data: any) => {
    // Auto-scroll on new message
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
    
    // Update current chat or notification count
    if (data.groupId === selectedGroup) {
      // Message is for current chat, would be handled by query invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedGroup] });
    } else {
      // Message is for another group, update unread count
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
    }
  };
  
  // Create group function
  const createGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription
    });
  };
  
  // Create event function
  const createEvent = () => {
    if (!eventTitle.trim()) {
      toast({
        title: "Event title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedGroup) {
      toast({
        title: "No group selected",
        description: "Please select a group to create an event for",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate({
      title: eventTitle,
      description: eventDescription,
      date: eventDate || new Date(),
      type: eventType,
      location: eventLocation,
      groupId: selectedGroup
    });
  };
  
  // Save user availability function
  const saveAvailability = () => {
    if (!selectedDate) {
      toast({
        title: "Date is required",
        variant: "destructive",
      });
      return;
    }
    
    if (availableTimeSlots.length === 0) {
      toast({
        title: "Please select at least one time slot",
        variant: "destructive",
      });
      return;
    }
    
    saveAvailabilityMutation.mutate({
      date: selectedDate,
      timeslots: availableTimeSlots
    });
  };

  const filteredGroups = myGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectGroup = (groupId: number) => {
    setSelectedGroup(groupId);
  };

  // Send message using mutation
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    sendMessageMutation.mutate({
      groupId: selectedGroup,
      message: newMessage
    });
  };
  
  // Invite friend function
  const inviteFriend = () => {
    if (!friendEmail.trim()) {
      toast({
        title: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    inviteFriendMutation.mutate({
      email: friendEmail,
      name: friendName
    });
  };

  // We're now using the currentMessages from the API query instead of static data

  const currentGroupName = selectedGroup
    ? myGroups.find(group => group.id === selectedGroup)?.name || ""
    : "";

  return (
    <div className="pb-16 container max-w-4xl mx-auto px-4">
      <Tabs defaultValue="my-groups" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between my-4">
          <TabsList>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-pink-500 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group to plan events with friends
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Weekend Squad" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="What's this group about?" 
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createGroup}>
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="my-groups" className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isInviteFriendOpen} onOpenChange={setIsInviteFriendOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Friend</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a friend to join Link
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      placeholder="friend@example.com" 
                      type="email"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Friend's Name (Optional)</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteFriendOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={inviteFriend}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No groups found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery ? "Try a different search term" : "Create your first group to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredGroups.map((group) => (
                <motion.div 
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="overflow-hidden cursor-pointer" onClick={() => handleSelectGroup(group.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            {group.image ? (
                              <AvatarImage src={group.image} alt={group.name} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {group.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center">
                              <Users className="h-3 w-3 mr-1" /> {group.members} members
                            </CardDescription>
                          </div>
                        </div>
                        {group.unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto bg-primary">{group.unreadCount}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-sm text-muted-foreground truncate">{group.lastMessage}</p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between items-center">
                      <Button variant="ghost" size="sm" className="text-xs px-2">
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGroupEventOpen(true);
                          setSelectedGroup(group.id);
                        }}
                      >
                        Plan Event
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="availability">
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Your Availability</h3>
              <div className="mb-4">
                <Label htmlFor="date-select">Select Date</Label>
                <input 
                  id="date-select"
                  type="date" 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Time Slots</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Morning (8am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-8pm)', 'Night (8pm-12am)'].map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`timeslot-${index}`}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={availableTimeSlots.includes(slot)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAvailableTimeSlots([...availableTimeSlots, slot]);
                          } else {
                            setAvailableTimeSlots(
                              availableTimeSlots.filter(item => item !== slot)
                            );
                          }
                        }}
                      />
                      <label htmlFor={`timeslot-${index}`} className="text-sm font-medium">
                        {slot}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full mt-4"
                onClick={saveAvailability}
              >
                Save Availability
              </Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Group Availability</h3>
              {selectedGroup ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Group: {currentGroupName}</Label>
                    <Select 
                      value={selectedGroup.toString()} 
                      onValueChange={(value) => setSelectedGroup(Number(value))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {myGroups.map(group => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-background/50 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Best Day</span>
                      <span className="text-sm">Saturday, April 27</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Best Time</span>
                      <span className="text-sm">Evening (4pm-8pm)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Member Availability</h4>
                    <div className="space-y-2">
                      {myGroups.find(g => g.id === selectedGroup)?.members > 0 ? (
                        [1, 2, 3].map((_, i) => (
                          <div key={i} className="flex justify-between items-center p-2 border rounded-md">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback>U{i+1}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">User {i+1}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Available: Evening, Night
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members have set their availability yet
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No group selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a group to view member availability
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="chat">
          {selectedGroup ? (
            <div className="flex flex-col h-[75vh]">
              <div className="border-b pb-2 mb-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => setSelectedGroup(null)}
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <h3 className="font-semibold">{currentGroupName}</h3>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-4 space-y-4" ref={messagesContainerRef}>
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-muted-foreground">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  currentMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex",
                        msg.userId === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div 
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          msg.userId === user?.id 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        {msg.userId !== user?.id && (
                          <p className="text-xs font-medium mb-1">{msg.userName}</p>
                        )}
                        <p>{msg.text}</p>
                        <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="border-t pt-4 mt-auto">
                <div className="flex items-center">
                  <Input
                    className="flex-1 mr-2"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendMessage();
                      }
                    }}
                  />
                  <Button onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No chat selected</h3>
              <p className="text-muted-foreground mt-2">
                Select a group to start chatting
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Group Event Planning Dialog */}
      <Dialog open={isGroupEventOpen} onOpenChange={setIsGroupEventOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plan Group Event</DialogTitle>
            <DialogDescription>
              Swipe through event options to find what works for everyone
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isSwipingEnabled ? (
              <div className="h-[60vh]">
                {/* Sample event cards for swiping */}
                <div className="relative h-full flex items-center justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSwipingEnabled(false)}
                    className="absolute top-2 right-2 z-50"
                  >
                    Close
                  </Button>
                  
                  <SwipeableCard
                    className="absolute w-full max-w-sm mx-auto bg-card rounded-xl shadow-xl overflow-hidden border border-border"
                    onSwipeLeft={() => {
                      toast({
                        title: "Event declined",
                        description: "You've voted no on this event",
                      });
                    }}
                    onSwipeRight={() => {
                      toast({
                        title: "Event accepted",
                        description: "You've voted yes on this event",
                      });
                    }}
                  >
                    <div className="h-40 w-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary/70">D</span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">Dinner at Osteria</h3>
                      <p className="text-muted-foreground text-sm mb-2">April 26, 2025 at 7:00 PM</p>
                      <p className="mb-4">Let's meet for Italian food at the new restaurant downtown!</p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Swipe to vote</span>
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="border-red-500/50 text-red-500">No</Badge>
                          <Badge variant="outline" className="border-green-500/50 text-green-500">Yes</Badge>
                        </div>
                      </div>
                    </div>
                  </SwipeableCard>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center">What would you like to do?</p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => {
                      setIsGroupEventOpen(false);
                      setIsCreateEventOpen(true);
                    }}
                  >
                    Create New Event
                  </Button>
                  <Button onClick={() => setIsSwipingEnabled(true)}>
                    Vote on Events
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {!isSwipingEnabled && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGroupEventOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Plan a new event for your group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input 
                id="event-title" 
                placeholder="Movie Night" 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea 
                id="event-description" 
                placeholder="Let's watch the new Marvel movie together!" 
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <input 
                  id="event-date" 
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={eventDate ? eventDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEventDate(new Date(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Type</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input 
                id="event-location" 
                placeholder="Central Park" 
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createEvent}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}