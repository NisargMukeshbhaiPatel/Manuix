import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "rounded-md inline-flex items-center px-[11px] py-0.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px]",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-white-300 text-black",
        success: "bg-green-400 text-black",
        warning: "bg-yellow-400 text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
