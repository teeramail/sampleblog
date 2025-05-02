import React from "react";
import { cn } from "~/utils/cn";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full px-4",
          {
            "max-w-screen-sm": size === "sm",
            "max-w-screen-md": size === "md",
            "max-w-screen-lg": size === "lg",
            "max-w-screen-xl": size === "xl",
            "max-w-none": size === "full",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";
