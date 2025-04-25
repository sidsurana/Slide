import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white" | "gradient";
}

export function Logo({ className, size = "md", variant = "default" }: LogoProps) {
  // Size classes
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  // Color classes
  const colorClasses = {
    default: "text-primary",
    white: "text-white",
    gradient: "text-transparent"
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn("flex items-center space-x-1.5", sizeClasses[size])}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("h-full w-auto", variant === "gradient" ? "text-primary" : colorClasses[variant])}
        >
          {/* Modern Chain Link Logo */}
          <g>
            {/* First chain link */}
            <path
              d="M10,20 L10,12 C10,8.2 13,5.5 16.5,5.5 L17.5,5.5 C21,5.5 24,8.2 24,12 L24,14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={variant === "gradient" ? "stroke-[url(#grad1)]" : ""}
            />
            
            {/* Second chain link */}
            <path
              d="M22,12 L22,20 C22,23.8 19,26.5 15.5,26.5 L14.5,26.5 C11,26.5 8,23.8 8,20 L8,18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={variant === "gradient" ? "stroke-[url(#grad2)]" : ""}
            />
            
            {/* Subtle decorative elements for more professional look */}
            <circle 
              cx="16" 
              cy="16" 
              r="12" 
              strokeWidth="0.5" 
              stroke="currentColor" 
              opacity="0.1" 
              fill="none"
            />
            
            <path
              d="M16,16 L16,16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
              className={variant === "gradient" ? "stroke-[url(#grad3)]" : ""}
            />
          </g>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4500" /> {/* Red-orange */}
              <stop offset="100%" stopColor="#FF8C00" /> {/* Orange */}
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8C00" /> {/* Orange */}
              <stop offset="100%" stopColor="#FF5722" /> {/* Deep orange */}
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5722" />
              <stop offset="100%" stopColor="#FF4500" />
            </linearGradient>
          </defs>
        </svg>
        
        <span className={cn(
          "font-extrabold tracking-tight", 
          variant === "gradient" 
            ? "bg-clip-text text-transparent bg-gradient-to-r from-[#FF4500] via-[#FF8C00] to-[#FF5722]" 
            : colorClasses[variant]
        )}>
          Link
        </span>
      </div>
    </div>
  );
}