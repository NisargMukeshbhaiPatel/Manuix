import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:ring-0 rounded-md min-h-[60px] w-full px-3 py-2 border-3 border-black font-bold text-black placeholder-gray-500 focus:ring-1 focus:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea"

export { Textarea }
