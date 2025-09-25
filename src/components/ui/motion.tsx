'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export function FadeIn({ children, delay = 0, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerListProps = {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
} & MotionProps;

export function StaggerList({
  children,
  className,
  delayChildren = 0.08,
  staggerChildren = 0.04,
  ...props
}: StaggerListProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function staggerItem(delay = 0) {
  return {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        delay,
      },
    },
  };
}
