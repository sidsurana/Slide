import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search...", 
  className = "", 
  initialValue = "" 
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  
  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-10 pr-14 h-10 rounded-full bg-muted/50 border border-border"
        />
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        {searchTerm && (
          <Button
            type="button"
            onClick={() => {
              setSearchTerm("");
              onSearch("");
            }}
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 right-0 p-1 h-full text-muted-foreground hover:text-foreground rounded-full"
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}