'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Receipt,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  CreditCard,
  FileCheck,
  UserCheck,
  Calculator,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  FileUp
} from 'lucide-react';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  companyId?: string;
  companyName?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  adminOnly?: boolean;
  subItems?: NavItem[];
}

export function WorkspaceLayout({ children, companyId, companyName }: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = hasRole('admin') || hasRole('developer');
  const hasCompany = user?.companyId || companyId;

  // Define workspace navigation items
  const workspaceNav: NavItem[] = [
    {
      name: 'Overview',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}` : '/dashboard',
      icon: Home,
    },
    {
      name: 'Banking & Cash',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}/banking` : '#',
      icon: DollarSign,
      subItems: hasCompany ? [
        {
          name: 'Bank Statements',
          href: `/workspace/${companyId || user?.companyId}/bank-statements`,
          icon: FileText,
        },
        {
          name: 'Reconciliation',
          href: `/workspace/${companyId || user?.companyId}/reconciliation`,
          icon: UserCheck,
        },
        {
          name: 'Cash Flow',
          href: `/workspace/${companyId || user?.companyId}/cash-flow`,
          icon: TrendingUp,
        },
        {
          name: 'Bank Import',
          href: `/workspace/${companyId || user?.companyId}/bank-import`,
          icon: FileUp,
          badge: 'NEW'
        },
      ] : [],
    },
    {
      name: 'Invoicing',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}/invoicing` : '#',
      icon: Receipt,
      subItems: hasCompany ? [
        {
          name: 'Invoices',
          href: `/workspace/${companyId || user?.companyId}/invoices`,
          icon: Receipt,
        },
        {
          name: 'Quotes',
          href: `/workspace/${companyId || user?.companyId}/quotes`,
          icon: FileText,
        },
        {
          name: 'Contracts',
          href: `/workspace/${companyId || user?.companyId}/contracts`,
          icon: FileCheck,
        },
      ] : [],
    },
    {
      name: 'Customers & Suppliers',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}/contacts` : '#',
      icon: Users,
      subItems: hasCompany ? [
        {
          name: 'Customers',
          href: `/workspace/${companyId || user?.companyId}/customers`,
          icon: Users,
        },
        {
          name: 'Suppliers',
          href: `/workspace/${companyId || user?.companyId}/suppliers`,
          icon: Building2,
        },
      ] : [],
    },
    {
      name: 'Accounting',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}/accounting` : '#',
      icon: Calculator,
      subItems: hasCompany ? [
        {
          name: 'Chart of Accounts',
          href: `/workspace/${companyId || user?.companyId}/chart-of-accounts`,
          icon: BarChart3,
        },
        {
          name: 'Journal Entries',
          href: `/workspace/${companyId || user?.companyId}/journal`,
          icon: FileText,
        },
      ] : [],
    },
    {
      name: 'Reports',
      href: hasCompany ? `/workspace/${companyId || user?.companyId}/reports` : '#',
      icon: BarChart3,
    },
  ];

  // Admin navigation items
  const adminNav: NavItem[] = isAdmin ? [
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: Settings,
      subItems: [
        {
          name: 'Manage Companies',
          href: '/companies',
          icon: Building2,
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: Users,
        },
        {
          name: 'COA Templates',
          href: '/admin/chart-of-accounts',
          icon: Calculator,
        },
      ],
    },
  ] : [];

  const allNavItems = [...workspaceNav, ...adminNav];

  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          size="sm"
          variant="outline"
          className="bg-white"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                P
              </div>
              <span className="font-semibold text-gray-900">PeakFlow</span>
            </div>
          )}
          <Button
            onClick={() => setCollapsed(!collapsed)}
            size="sm"
            variant="ghost"
            className="hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Company Context */}
        {hasCompany && !collapsed && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">Workspace</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {companyName || 'My Company'}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {allNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href === '#' ? pathname : item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5', collapsed ? 'm-0' : 'mr-0')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Sub-navigation */}
                {!collapsed && item.subItems && item.subItems.length > 0 && (
                  <ul className="mt-1 ml-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                            isActive(subItem.href)
                              ? 'text-indigo-600 font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.roles?.join(', ')}
                  </p>
                </div>
              </div>
              <Button
                onClick={logout}
                size="sm"
                variant="ghost"
                className="ml-2"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={logout}
              size="sm"
              variant="ghost"
              className="w-full justify-center"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}