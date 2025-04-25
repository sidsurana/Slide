import { Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Route } from "wouter";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Availability from "@/pages/availability";
import MyEvents from "@/pages/my-events";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import AuthPage from "@/pages/auth-page";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import GroupsPage from "@/pages/groups";
import BottomNavigation from "@/components/bottom-navigation";
import Header from "@/components/header";
import { useState, useEffect } from "react";

function Router() {
  const [mounted, setMounted] = useState(false);

  // Ensure theme is properly applied after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen flex flex-col relative shadow-lg">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        <ProtectedRoute path="/">
          <>
            <Header />
            <Home />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/availability">
          <>
            <Header />
            <Availability />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/my-events">
          <>
            <Header />
            <MyEvents />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/profile">
          <>
            <Header />
            <Profile />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/users/:id">
          <>
            <Header />
            <UserProfile />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/settings">
          <>
            <Header />
            <SettingsPage />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/notifications">
          <>
            <Header />
            <NotificationsPage />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <ProtectedRoute path="/groups">
          <>
            <Header />
            <GroupsPage />
            <BottomNavigation />
          </>
        </ProtectedRoute>
        
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="link-theme-preference">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
