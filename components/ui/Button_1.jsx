"use client"

import { forwardRef } from "react"

const Button = forwardRef(
  (
    { children, variant = "primary", size = "md", disabled = false, loading = false, className = "", ...props },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95"

    const variants = {
      primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-soft",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500",
      outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
      ghost: "text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
    }

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    }

    const disabledClasses = disabled || loading ? "opacity-50 cursor-not-allowed transform-none hover:scale-100" : ""

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"

export default Button
