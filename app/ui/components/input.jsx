import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const isIntegerInput = type === 'number';
  const isDecimalInput = type === 'decimal';
  const actualType = (isIntegerInput || isDecimalInput) ? 'number' : type;

  const handleKeyDown = (e) => {
    if (isIntegerInput && (e.key === '.' || e.key === ',')) {
      e.preventDefault();
    }
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleChange = (e) => {
    let modifiedEvent = e;
    
    if (isIntegerInput) {
      const intValue = parseInt(e.target.value) || '';
      // Create a new event-like object to avoid mutating the original
      modifiedEvent = {
        ...e,
        target: {
          ...e.target,
          value: intValue.toString()
        }
      };
    }
    
    if (props.onChange) props.onChange(modifiedEvent);
  };

  // Set appropriate step based on type
  const getStep = () => {
    if (isIntegerInput) return '1';
    if (isDecimalInput) return '0.01';
    return props.step;
  };

  return (
    <input
      type={actualType}
      className={cn(
        "focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:ring-0 rounded-md h-9 w-full px-3 border-3 border-black font-bold text-black placeholder-gray-500 focus:ring-1 focus:bg-green-50 file:border-0 file:bg-transparent file:text-md file:font-medium file:text-neutral-950 ",
        className,
      )}
      ref={ref}
      onKeyDown={isIntegerInput ? handleKeyDown : props.onKeyDown}
      onChange={(isIntegerInput || isDecimalInput) ? handleChange : props.onChange}
      step={getStep()}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
