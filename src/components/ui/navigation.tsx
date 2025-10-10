'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  actions?: React.ReactNode;
  gradient?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  backHref,
  actions,
  gradient = true
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn(
      "sticky top-0 z-40 border-b border-gray-100",
      gradient ? "bg-gradient-to-r from-white via-gray-50/50 to-white" : "bg-white",
      "backdrop-blur-xl"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 space-y-2">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-1 text-sm"
            >
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Home className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  {item.href ? (
                    <Link href={item.href}>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        {item.icon}
                        <span className={cn(
                          item.icon && "ml-1",
                          index === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "text-gray-600"
                        )}>
                          {item.label}
                        </span>
                      </Button>
                    </Link>
                  ) : (
                    <span className="px-2 text-gray-900 font-medium">
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </motion.nav>
          )}

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {backHref && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => backHref === 'back' ? router.back() : router.push(backHref)}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className={cn(
                  "text-2xl font-bold",
                  gradient && "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
                )}>
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </motion.div>
            </div>
            {actions && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2"
              >
                {actions}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Navigation Component
interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative py-3 px-1 flex items-center space-x-2 text-sm font-medium border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
              )}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "ml-1.5 px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600"
                  initial={false}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}