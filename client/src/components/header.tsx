import { Bell, Search, User, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { SimpleThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-background border-b border-border px-2 py-3 sticky top-0 z-10">
      <div className="flex justify-between items-center max-w-full overflow-hidden">
        <div className="flex items-center flex-shrink-0">
          <Logo className="h-7 w-auto" />
        </div>
        
        <form onSubmit={handleSearch} className="hidden sm:flex relative mx-2 flex-grow max-w-[160px] md:max-w-[250px]">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 h-8 bg-muted w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <SimpleThemeToggle />
          
          <Button variant="ghost" size="sm" className="px-2" asChild>
            <Link href="/notifications">
              <Bell className="h-4 w-4 text-foreground" />
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" className="px-2" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4 text-foreground" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full px-1">
                <Avatar className="h-7 w-7">
                  {user?.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.fullName || ""} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
