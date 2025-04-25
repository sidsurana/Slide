import { HTMLProps, ReactNode, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface SwipeableCardProps extends HTMLProps<HTMLDivElement> {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

const SwipeableCard = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 150,
  className,
  children,
  ...props
}: SwipeableCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exitX, setExitX] = useState<number>(0);

  // Motion values for dragging and rotating the card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-30, 30]);
  
  // Transform the opacity of the "Like" and "Dislike" indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Handle drag end
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > threshold) {
      setExitX(200);
      onSwipeRight && onSwipeRight();
    } else if (info.offset.x < -threshold) {
      setExitX(-200);
      onSwipeLeft && onSwipeLeft();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "touch-manipulation relative",
        className
      )}
      style={{ 
        x, 
        y, 
        rotate,
        cursor: "grab"
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: "spring", damping: 40, stiffness: 300 }}
      whileTap={{ cursor: "grabbing" }}
      {...props}
    >
      {/* Like indicator */}
      <motion.div 
        className="absolute top-10 right-10 bg-green-500/70 text-white p-3 rounded-full z-10"
        style={{ opacity: likeOpacity }}
      >
        <Check className="h-8 w-8" />
      </motion.div>

      {/* Dislike indicator */}
      <motion.div 
        className="absolute top-10 left-10 bg-red-500/70 text-white p-3 rounded-full z-10"
        style={{ opacity: dislikeOpacity }}
      >
        <X className="h-8 w-8" />
      </motion.div>

      {children}
    </motion.div>
  );
};

export { SwipeableCard };
