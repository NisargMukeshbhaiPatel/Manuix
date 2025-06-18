import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:ring-0 rounded-md h-9 w-full px-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:ring-1 focus:bg-green-50 file:border-0 file:bg-transparent file:text-md file:font-medium file:text-neutral-950 ",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
