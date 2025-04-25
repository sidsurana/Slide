import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "underline" | "pills" | "cards";
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline"
}: TabNavigationProps) {
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const getTabStyles = (tabId: string) => {
    const isActive = tabId === activeTab;
    
    // Determine color based on tab ID and active state
    const textColor = isActive
      ? tabId === "networking" 
        ? "text-accent" 
        : "text-primary"
      : "text-muted-foreground";
    
    // Base styles for all variants
    const baseStyles = cn(
      "transition-all duration-200 ease-in-out font-medium flex items-center justify-center",
      variant === "underline" ? "py-4" : "py-3 px-4",
      isActive ? textColor : textColor
    );
    
    // Add variant-specific styles
    if (variant === "pills") {
      return cn(
        baseStyles,
        "rounded-full",
        isActive 
          ? tabId === "networking"
            ? "bg-accent/10"
            : "bg-primary/10"
          : "hover:bg-muted"
      );
    }
    
    if (variant === "cards") {
      return cn(
        baseStyles,
        "rounded-lg",
        isActive 
          ? tabId === "networking"
            ? "bg-accent text-white shadow-md"
            : "bg-primary text-white shadow-md"
          : "bg-muted hover:bg-muted/80"
      );
    }
    
    // Default underline variant
    return baseStyles;
  };

  const getIndicatorStyle = () => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const translateX = activeIndex * 100;
    const color = activeTab === "networking" ? "bg-accent" : "bg-primary";
    
    return {
      transform: `translateX(${translateX}%)`,
      width: `${100 / tabs.length}%`,
      className: color
    };
  };

  const indicatorStyle = getIndicatorStyle();

  return (
    <div className="bg-background border-b border-border">
      <div className="relative px-2 py-1">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={cn(
                "flex-1",
                getTabStyles(tab.id)
              )}
              onClick={() => handleTabClick(tab.id)}
              whileTap={{ scale: 0.97 }}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </motion.button>
          ))}
        </div>
        
        {variant === "underline" && (
          <motion.div 
            className={cn(
              "tab-indicator absolute bottom-0 left-0 h-1 rounded-t-full",
              indicatorStyle.className
            )}
            initial={false}
            animate={{ 
              x: `${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%`,
              width: `${100 / tabs.length}%`
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />
        )}
      </div>
    </div>
  );
}
