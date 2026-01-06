'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  CheckSquare,
  ChevronDown,
  Coins,
  DollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import { useAdmin } from '@/lib/hooks/useAdmin'
import { useWallet } from '@/lib/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const sidebarSections = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
      { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      {
        icon: CheckSquare,
        label: 'Review Applications',
        href: '/admin/applications',
        badge: 'pending',
      },
      { icon: Package, label: 'Listed Assets', href: '/admin/assets' },
    ],
  },
  {
    title: 'User & Finance',
    items: [
      { icon: Users, label: 'User Management', href: '/admin/users' },
      { icon: DollarSign, label: 'Yield Distribution', href: '/admin/yields' },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, isLoading, admin } = useAdmin()
  const { address, disconnect } = useWallet()
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending applications count
  useEffect(() => {
    if (!address || !isAdmin) return

    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/admin/applications?status=pending', {
          headers: { 'x-wallet-address': address },
        })
        const data = await response.json()
        setPendingCount(data.applications?.length || 0)
      } catch (error) {
        console.error('Failed to fetch pending count:', error)
      }
    }

    fetchPendingCount()
  }, [address, isAdmin])

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, isLoading, router])

  const handleDisconnect = () => {
    disconnect()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">
            You don&apos;t have permission to access the admin panel.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/20 text-purple-500'
      case 'admin':
        return 'bg-blue-500/20 text-blue-500'
      case 'reviewer':
        return 'bg-green-500/20 text-green-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold block">RealFi Admin</span>
              <span className="text-xs text-slate-600">Management Console</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-6 px-3">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  const showBadge = item.badge === 'pending' && pendingCount > 0

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-slate-600 hover:bg-secondary hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      {showBadge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Admin Info */}
          {admin && (
            <div className="px-3 py-2 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {admin.name || 'Admin'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(admin.role)}`}
                >
                  {admin.role.replace('_', ' ')}
                </span>
              </div>
              {address && (
                <span className="text-xs text-slate-600">
                  {formatAddress(address)}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-secondary transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
