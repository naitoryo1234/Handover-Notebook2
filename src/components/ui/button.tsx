import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const variants = {
    default: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-indigo-600",
    destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:outline-red-600",
    outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 text-slate-700",
    ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
    link: "text-indigo-600 underline-offset-4 hover:underline",
}

export type ButtonVariant = keyof typeof variants

interface ButtonVariantProps {
    variant?: ButtonVariant
    className?: string
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const buttonVariants = ({ variant = "default", size = "default", className }: ButtonVariantProps = {}) => {
    const sizeClasses = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizeClasses[size],
        className
    )
}

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={buttonVariants({ variant, size, className })}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
