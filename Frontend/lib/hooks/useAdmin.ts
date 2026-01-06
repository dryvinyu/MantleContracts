'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { AdminRole } from '@/lib/supabase'

interface AdminInfo {
  id: string
  role: AdminRole
  name: string | null
}

interface UseAdminReturn {
  isAdmin: boolean
  isLoading: boolean
  admin: AdminInfo | null
  error: string | null
  refetch: () => Promise<void>
}

export function useAdmin(): UseAdminReturn {
  const { address, isConnected } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminStatus = useCallback(async () => {
    if (!isConnected || !address) {
      setIsAdmin(false)
      setAdmin(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/verify?wallet=${address}`)
      const data = await response.json()

      if (data.isAdmin) {
        setIsAdmin(true)
        setAdmin(data.admin)
      } else {
        setIsAdmin(false)
        setAdmin(null)
      }
    } catch (err) {
      setError('Failed to verify admin status')
      setIsAdmin(false)
      setAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchAdminStatus()
  }, [fetchAdminStatus])

  return {
    isAdmin,
    isLoading,
    admin,
    error,
    refetch: fetchAdminStatus,
  }
}

/**
 * 检查管理员是否有特定权限
 */
export function hasPermission(
  role: AdminRole | undefined,
  requiredRole: AdminRole,
): boolean {
  if (!role) return false

  const roleHierarchy: Record<AdminRole, number> = {
    reviewer: 1,
    admin: 2,
    super_admin: 3,
  }

  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}
