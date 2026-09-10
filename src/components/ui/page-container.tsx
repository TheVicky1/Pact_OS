import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

/**
 * PACT PageContainer Primitive
 * Centralized authenticated page layout boundary establishing standard
 * max-width, horizontal padding, and vertical rhythm across all PACT screens.
 */
export function PageContainer({
  as: Component = 'div',
  className = '',
  children,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={`max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
