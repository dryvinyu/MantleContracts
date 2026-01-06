'use client'

import { toast } from 'sonner'
import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddAssetModalProps {
  onClose: () => void
  onSuccess?: () => void
}

type AssetType =
  | 'fixed-income'
  | 'real-estate'
  | 'private-credit'
  | 'alternatives'
type AssetStatus = 'Active' | 'Maturing' | 'Paused'

interface FormData {
  id: string
  name: string
  type: AssetType | ''
  apy: string
  durationDays: string
  riskScore: string
  yieldConfidence: string
  aumUsd: string
  price: string
  status: AssetStatus | ''
  nextPayoutDate: string
  description: string
  tokenAddress: string
  distributorAddress: string
}

export default function AddAssetModal({
  onClose,
  onSuccess,
}: AddAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    type: '',
    apy: '',
    durationDays: '',
    riskScore: '',
    yieldConfidence: '',
    aumUsd: '',
    price: '',
    status: '',
    nextPayoutDate: '',
    description: '',
    tokenAddress: '',
    distributorAddress: '',
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.id.trim()) {
      newErrors.id = 'Asset ID is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.type) {
      newErrors.type = 'Type is required'
    }
    if (!formData.apy) {
      newErrors.apy = 'APY is required'
    } else {
      const apy = Number.parseFloat(formData.apy)
      if (isNaN(apy) || apy < 0) {
        newErrors.apy = 'APY must be >= 0'
      }
    }
    if (!formData.durationDays) {
      newErrors.durationDays = 'Duration is required'
    } else {
      const duration = Number.parseInt(formData.durationDays, 10)
      if (isNaN(duration) || duration <= 0) {
        newErrors.durationDays = 'Duration must be a positive integer'
      }
    }
    if (!formData.riskScore) {
      newErrors.riskScore = 'Risk score is required'
    } else {
      const risk = Number.parseInt(formData.riskScore, 10)
      if (isNaN(risk) || risk < 0 || risk > 100) {
        newErrors.riskScore = 'Risk score must be between 0 and 100'
      }
    }
    if (!formData.yieldConfidence) {
      newErrors.yieldConfidence = 'Yield confidence is required'
    } else {
      const confidence = Number.parseInt(formData.yieldConfidence, 10)
      if (isNaN(confidence) || confidence < 0 || confidence > 100) {
        newErrors.yieldConfidence = 'Yield confidence must be between 0 and 100'
      }
    }
    if (!formData.aumUsd) {
      newErrors.aumUsd = 'AUM is required'
    } else {
      const aum = Number.parseFloat(formData.aumUsd)
      if (isNaN(aum) || aum < 0) {
        newErrors.aumUsd = 'AUM must be >= 0'
      }
    }
    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else {
      const price = Number.parseFloat(formData.price)
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Price must be >= 0'
      }
    }
    if (!formData.status) {
      newErrors.status = 'Status is required'
    }
    if (!formData.nextPayoutDate) {
      newErrors.nextPayoutDate = 'Next payout date is required'
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(formData.nextPayoutDate)) {
        newErrors.nextPayoutDate = 'Date must be in YYYY-MM-DD format'
      } else {
        const date = new Date(formData.nextPayoutDate)
        if (isNaN(date.getTime())) {
          newErrors.nextPayoutDate = 'Invalid date'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type as AssetType,
        apy: Number.parseFloat(formData.apy),
        durationDays: Number.parseInt(formData.durationDays, 10),
        riskScore: Number.parseInt(formData.riskScore, 10),
        yieldConfidence: Number.parseInt(formData.yieldConfidence, 10),
        aumUsd: Number.parseFloat(formData.aumUsd),
        price: Number.parseFloat(formData.price),
        status: formData.status as AssetStatus,
        nextPayoutDate: formData.nextPayoutDate,
        description: formData.description.trim() || null,
        tokenAddress: formData.tokenAddress.trim() || null,
        distributorAddress: formData.distributorAddress.trim() || null,
      }

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Duplicate Asset ID', {
            description: data.message || 'An asset with this ID already exists',
          })
          setErrors({ id: 'Asset ID already exists' })
        } else if (response.status === 400) {
          toast.error('Validation Error', {
            description:
              data.message ||
              data.validationErrors?.join(', ') ||
              'Please check your input',
          })
          if (data.missingFields) {
            const missingErrors: Record<string, string> = {}
            data.missingFields.forEach((field: string) => {
              missingErrors[field] = 'This field is required'
            })
            setErrors(missingErrors)
          }
        } else {
          toast.error('Failed to create asset', {
            description: data.message || 'An error occurred',
          })
        }
        setIsSubmitting(false)
        return
      }

      toast.success('Asset created successfully', {
        description: `${formData.name} has been added`,
      })

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error('Failed to create asset', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
      setIsSubmitting(false)
    }
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h3 className="font-semibold text-lg">Create New Asset</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Asset ID <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.id}
                onChange={(e) => updateField('id', e.target.value)}
                placeholder="e.g., us-treasury-2y-2024"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Asset name"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateField('type', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed-income">Fixed Income</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="private-credit">Private Credit</SelectItem>
                  <SelectItem value="alternatives">Alternatives</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.type}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maturing">Maturing</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.status}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                APY (%) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.apy}
                onChange={(e) => updateField('apy', e.target.value)}
                placeholder="0.00"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.apy && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.apy}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Duration (days) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => updateField('durationDays', e.target.value)}
                placeholder="365"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.durationDays && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.durationDays}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Risk Score (0-100) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.riskScore}
                onChange={(e) => updateField('riskScore', e.target.value)}
                placeholder="0"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.riskScore && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.riskScore}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Yield Confidence (0-100){' '}
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.yieldConfidence}
                onChange={(e) => updateField('yieldConfidence', e.target.value)}
                placeholder="0"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.yieldConfidence && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.yieldConfidence}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                AUM (RWA) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.aumUsd}
                onChange={(e) => updateField('aumUsd', e.target.value)}
                placeholder="0.00"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.aumUsd && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.aumUsd}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Price (RWA) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0.00"
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.price && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.price}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Next Payout Date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={formData.nextPayoutDate}
                onChange={(e) => updateField('nextPayoutDate', e.target.value)}
                className="bg-secondary"
                disabled={isSubmitting}
              />
              {errors.nextPayoutDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nextPayoutDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional description"
              className="bg-secondary"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Address</label>
              <Input
                value={formData.tokenAddress}
                onChange={(e) => updateField('tokenAddress', e.target.value)}
                placeholder="0x..."
                className="bg-secondary"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Distributor Address</label>
              <Input
                value={formData.distributorAddress}
                onChange={(e) =>
                  updateField('distributorAddress', e.target.value)
                }
                placeholder="0x..."
                className="bg-secondary"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Asset'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
