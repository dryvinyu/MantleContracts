'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract } from 'wagmi'
import { decodeEventLog, keccak256, toHex } from 'viem'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdmin, hasPermission } from '@/lib/hooks/useAdmin'
import { useWallet } from '@/lib/hooks/useWallet'
import {
  ASSET_REGISTRY_ABI,
  ASSET_REGISTRY_ADDRESS,
  getClient,
} from '@/lib/contracts'
import { mantleTestnet } from '@/lib/config/networks'
import type { AssetType } from '@/lib/supabase'

interface FormData {
  name: string
  type: AssetType
  description: string
  expectedApy: string
  targetAum: string
  minimumInvestment: string
  durationDays: string
  price: string
  riskScore: string
  // Fixed Income
  issuer: string
  couponRate: string
  payoutFrequency: string
  maturityDate: string
  collateral: string
  rating: string
  callTerms: string
  // Real Estate
  propertyName: string
  location: string
  propertyType: string
  occupancyRate: string
  valuation: string
  manager: string
  ltv: string
  // Private Credit
  borrower: string
  loanType: string
  repaymentSchedule: string
  creditEnhancement: string
  covenants: string
  useOfFunds: string
  // Alternatives
  assetSubtype: string
  valuationMethod: string
  liquidityTerms: string
  custody: string
  insurance: string
  volatilityNotes: string
}

export default function NewApplicationPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { chainId } = useWallet()
  const { admin } = useAdmin()
  const { writeContractAsync } = useWriteContract()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<(keyof FormData)[]>([])
  const fieldRefs = useRef<
    Partial<Record<keyof FormData, HTMLDivElement | null>>
  >({})

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'fixed-income',
    description: '',
    expectedApy: '',
    targetAum: '',
    minimumInvestment: '100',
    durationDays: '',
    price: '1.00',
    riskScore: '',
    issuer: '',
    couponRate: '',
    payoutFrequency: '',
    maturityDate: '',
    collateral: '',
    rating: '',
    callTerms: '',
    propertyName: '',
    location: '',
    propertyType: '',
    occupancyRate: '',
    valuation: '',
    manager: '',
    ltv: '',
    borrower: '',
    loanType: '',
    repaymentSchedule: '',
    creditEnhancement: '',
    covenants: '',
    useOfFunds: '',
    assetSubtype: '',
    valuationMethod: '',
    liquidityTerms: '',
    custody: '',
    insurance: '',
    volatilityNotes: '',
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === 'type') {
      setMissingFields([])
      return
    }
    if (missingFields.includes(field) && value) {
      setMissingFields((prev) => prev.filter((item) => item !== field))
    }
  }

  const registerFieldRef =
    (field: keyof FormData) => (node: HTMLDivElement | null) => {
      fieldRefs.current[field] = node
    }

  const fieldHasError = (field: keyof FormData) => missingFields.includes(field)

  const fieldClassName = (field: keyof FormData) =>
    fieldHasError(field)
      ? 'border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive/40'
      : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return

    const requiredByType: Record<AssetType, (keyof FormData)[]> = {
      'fixed-income': ['issuer', 'couponRate', 'payoutFrequency'],
      'real-estate': ['propertyName', 'location', 'propertyType'],
      'private-credit': ['borrower', 'loanType', 'repaymentSchedule'],
      alternatives: ['assetSubtype', 'valuationMethod', 'liquidityTerms'],
    }

    const requiredBase: (keyof FormData)[] = [
      'name',
      'expectedApy',
      'targetAum',
      'durationDays',
      'riskScore',
    ]

    const fieldLabels: Record<keyof FormData, string> = {
      name: 'Asset Name',
      type: 'Asset Type',
      description: 'Description',
      expectedApy: 'Expected APY',
      targetAum: 'Target AUM (RWA)',
      minimumInvestment: 'Minimum Investment (RWA)',
      durationDays: 'Duration',
      price: 'Price per Share (RWA)',
      riskScore: 'Risk Score',
      issuer: 'Issuer',
      couponRate: 'Coupon Rate',
      payoutFrequency: 'Payout Frequency',
      maturityDate: 'Maturity Date',
      collateral: 'Collateral',
      rating: 'Rating',
      callTerms: 'Call / Prepayment Terms',
      propertyName: 'Property Name',
      location: 'Location',
      propertyType: 'Property Type',
      occupancyRate: 'Occupancy Rate',
      valuation: 'Valuation (RWA)',
      manager: 'Property Manager',
      ltv: 'Loan to Value',
      borrower: 'Borrower',
      loanType: 'Loan Type',
      repaymentSchedule: 'Repayment Schedule',
      creditEnhancement: 'Credit Enhancement',
      covenants: 'Covenants',
      useOfFunds: 'Use of Funds',
      assetSubtype: 'Asset Subtype',
      valuationMethod: 'Valuation Method',
      liquidityTerms: 'Liquidity Terms',
      custody: 'Custody',
      insurance: 'Insurance',
      volatilityNotes: 'Volatility Notes',
    }

    // Validate required fields
    const requiredFields = [...requiredBase, ...requiredByType[formData.type]]
    const missingFields = requiredFields.filter((field) => !formData[field])
    if (missingFields.length > 0) {
      setError(
        `Please fill in required fields: ${missingFields
          .map((field) => fieldLabels[field])
          .join(', ')}`,
      )
      setMissingFields(missingFields)
      const firstMissing = missingFields[0]
      if (firstMissing && fieldRefs.current[firstMissing]) {
        fieldRefs.current[firstMissing]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (!ASSET_REGISTRY_ADDRESS) {
        throw new Error('Asset registry address is not configured')
      }

      const expectedApyBps = Math.round(parseFloat(formData.expectedApy) * 100)
      const targetAumUsdCents = Math.round(parseFloat(formData.targetAum) * 100)
      const minimumInvestmentUsdCents = Math.round(
        (parseFloat(formData.minimumInvestment) || 0) * 100,
      )
      const durationDays = parseInt(formData.durationDays, 10)
      const priceUsdCents = Math.round((parseFloat(formData.price) || 1) * 100)
      const riskScore = parseInt(formData.riskScore, 10)

      const metadataHash = keccak256(
        toHex(
          JSON.stringify({
            ...formData,
          }),
        ),
      )

      const txHash = await writeContractAsync({
        address: ASSET_REGISTRY_ADDRESS,
        abi: ASSET_REGISTRY_ABI,
        functionName: 'registerAsset',
        args: [
          formData.name,
          formData.type,
          BigInt(expectedApyBps),
          BigInt(targetAumUsdCents),
          BigInt(minimumInvestmentUsdCents),
          BigInt(durationDays),
          BigInt(priceUsdCents),
          BigInt(riskScore),
          metadataHash,
        ],
      })

      const client = getClient(chainId || mantleTestnet.id)
      const receipt = await client.waitForTransactionReceipt({ hash: txHash })
      let onchainAssetId: string | null = null
      const registryAddress = ASSET_REGISTRY_ADDRESS.toLowerCase()

      for (const log of receipt.logs) {
        if (log.address?.toLowerCase() !== registryAddress) continue
        try {
          const decoded = decodeEventLog({
            abi: ASSET_REGISTRY_ABI,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'AssetRegistered') {
            onchainAssetId = decoded.args.assetId as string
            break
          }
        } catch {
          // Ignore non-matching logs
        }
      }

      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          expectedApy: parseFloat(formData.expectedApy),
          targetAum: parseFloat(formData.targetAum),
          minimumInvestment: parseFloat(formData.minimumInvestment) || 100,
          durationDays: durationDays,
          price: parseFloat(formData.price) || 1.0,
          riskScore: riskScore,
          tokenSymbol: null,
          tokenAddress: null,
          distributorAddress: null,
          metadata: formData,
          onchainAssetId: onchainAssetId,
          onchainTxHash: txHash,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create application')
      }

      router.push('/admin/applications')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create application',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasPermission(admin?.role, 'admin')) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Permission Denied</h2>
          <p className="text-slate-600 mb-4">
            Only admins can create new applications.
          </p>
          <Button onClick={() => router.push('/admin/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/applications')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">New Asset Application</h1>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={registerFieldRef('name')}>
              <label className="text-sm font-medium mb-1 block">
                Asset Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., US Treasury Bond Fund"
                className={fieldClassName('name')}
              />
            </div>

            <div ref={registerFieldRef('type')}>
              <label className="text-sm font-medium mb-1 block">
                Asset Type *
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  handleChange('type', value as AssetType)
                }
              >
                <SelectTrigger className={fieldClassName('type')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed-income">Fixed Income</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="private-credit">Private Credit</SelectItem>
                  <SelectItem value="alternatives">Alternatives</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div ref={registerFieldRef('description')}>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the asset..."
                rows={3}
                className={fieldClassName('description')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div ref={registerFieldRef('expectedApy')}>
              <label className="text-sm font-medium mb-1 block">
                Expected APY (%) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.expectedApy}
                onChange={(e) => handleChange('expectedApy', e.target.value)}
                placeholder="e.g., 5.5"
                className={fieldClassName('expectedApy')}
              />
            </div>

            <div ref={registerFieldRef('targetAum')}>
              <label className="text-sm font-medium mb-1 block">
                Target AUM (RWA) *
              </label>
              <Input
                type="number"
                value={formData.targetAum}
                onChange={(e) => handleChange('targetAum', e.target.value)}
                placeholder="e.g., 1000000"
                className={fieldClassName('targetAum')}
              />
            </div>

            <div ref={registerFieldRef('minimumInvestment')}>
              <label className="text-sm font-medium mb-1 block">
                Minimum Investment (RWA)
              </label>
              <Input
                type="number"
                value={formData.minimumInvestment}
                onChange={(e) =>
                  handleChange('minimumInvestment', e.target.value)
                }
                placeholder="100"
                className={fieldClassName('minimumInvestment')}
              />
            </div>

            <div ref={registerFieldRef('durationDays')}>
              <label className="text-sm font-medium mb-1 block">
                Duration (days) *
              </label>
              <Input
                type="number"
                value={formData.durationDays}
                onChange={(e) => handleChange('durationDays', e.target.value)}
                placeholder="e.g., 365"
                className={fieldClassName('durationDays')}
              />
            </div>

            <div ref={registerFieldRef('price')}>
              <label className="text-sm font-medium mb-1 block">
                Price per Share (RWA)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="1.00"
                className={fieldClassName('price')}
              />
            </div>

            <div ref={registerFieldRef('riskScore')}>
              <label className="text-sm font-medium mb-1 block">
                Risk Score (0-100) *
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.riskScore}
                onChange={(e) => handleChange('riskScore', e.target.value)}
                placeholder="e.g., 25"
                className={fieldClassName('riskScore')}
              />
            </div>
          </CardContent>
        </Card>

        {formData.type === 'fixed-income' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Fixed Income Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div ref={registerFieldRef('issuer')}>
                <label className="text-sm font-medium mb-1 block">
                  Issuer *
                </label>
                <Input
                  value={formData.issuer}
                  onChange={(e) => handleChange('issuer', e.target.value)}
                  placeholder="e.g., US Treasury"
                  className={fieldClassName('issuer')}
                />
              </div>
              <div ref={registerFieldRef('couponRate')}>
                <label className="text-sm font-medium mb-1 block">
                  Coupon Rate (%) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.couponRate}
                  onChange={(e) => handleChange('couponRate', e.target.value)}
                  placeholder="e.g., 4.25"
                  className={fieldClassName('couponRate')}
                />
              </div>
              <div ref={registerFieldRef('payoutFrequency')}>
                <label className="text-sm font-medium mb-1 block">
                  Payout Frequency *
                </label>
                <Select
                  value={formData.payoutFrequency}
                  onValueChange={(value) =>
                    handleChange('payoutFrequency', value)
                  }
                >
                  <SelectTrigger className={fieldClassName('payoutFrequency')}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannual">Semiannual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div ref={registerFieldRef('maturityDate')}>
                <label className="text-sm font-medium mb-1 block">
                  Maturity Date
                </label>
                <Input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => handleChange('maturityDate', e.target.value)}
                  className={fieldClassName('maturityDate')}
                />
              </div>
              <div ref={registerFieldRef('collateral')}>
                <label className="text-sm font-medium mb-1 block">
                  Collateral
                </label>
                <Input
                  value={formData.collateral}
                  onChange={(e) => handleChange('collateral', e.target.value)}
                  placeholder="e.g., Government guarantee"
                  className={fieldClassName('collateral')}
                />
              </div>
              <div ref={registerFieldRef('rating')}>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <Input
                  value={formData.rating}
                  onChange={(e) => handleChange('rating', e.target.value)}
                  placeholder="e.g., AA+"
                  className={fieldClassName('rating')}
                />
              </div>
              <div className="col-span-2" ref={registerFieldRef('callTerms')}>
                <label className="text-sm font-medium mb-1 block">
                  Call / Prepayment Terms
                </label>
                <Textarea
                  value={formData.callTerms}
                  onChange={(e) => handleChange('callTerms', e.target.value)}
                  placeholder="Optional call or prepayment details"
                  rows={2}
                  className={fieldClassName('callTerms')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === 'real-estate' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Real Estate Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div ref={registerFieldRef('propertyName')}>
                <label className="text-sm font-medium mb-1 block">
                  Property Name *
                </label>
                <Input
                  value={formData.propertyName}
                  onChange={(e) => handleChange('propertyName', e.target.value)}
                  placeholder="e.g., Downtown Office Tower"
                  className={fieldClassName('propertyName')}
                />
              </div>
              <div ref={registerFieldRef('location')}>
                <label className="text-sm font-medium mb-1 block">
                  Location *
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, Country"
                  className={fieldClassName('location')}
                />
              </div>
              <div ref={registerFieldRef('propertyType')}>
                <label className="text-sm font-medium mb-1 block">
                  Property Type *
                </label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleChange('propertyType', value)}
                >
                  <SelectTrigger className={fieldClassName('propertyType')}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="mixed-use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div ref={registerFieldRef('occupancyRate')}>
                <label className="text-sm font-medium mb-1 block">
                  Occupancy Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.occupancyRate}
                  onChange={(e) =>
                    handleChange('occupancyRate', e.target.value)
                  }
                  placeholder="e.g., 92"
                  className={fieldClassName('occupancyRate')}
                />
              </div>
              <div ref={registerFieldRef('valuation')}>
                <label className="text-sm font-medium mb-1 block">
                  Valuation (RWA)
                </label>
                <Input
                  type="number"
                  value={formData.valuation}
                  onChange={(e) => handleChange('valuation', e.target.value)}
                  placeholder="e.g., 25000000"
                  className={fieldClassName('valuation')}
                />
              </div>
              <div ref={registerFieldRef('manager')}>
                <label className="text-sm font-medium mb-1 block">
                  Property Manager
                </label>
                <Input
                  value={formData.manager}
                  onChange={(e) => handleChange('manager', e.target.value)}
                  placeholder="Operator name"
                  className={fieldClassName('manager')}
                />
              </div>
              <div ref={registerFieldRef('ltv')}>
                <label className="text-sm font-medium mb-1 block">
                  Loan to Value (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.ltv}
                  onChange={(e) => handleChange('ltv', e.target.value)}
                  placeholder="e.g., 55"
                  className={fieldClassName('ltv')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === 'private-credit' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Private Credit Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div ref={registerFieldRef('borrower')}>
                <label className="text-sm font-medium mb-1 block">
                  Borrower *
                </label>
                <Input
                  value={formData.borrower}
                  onChange={(e) => handleChange('borrower', e.target.value)}
                  placeholder="Borrower or SPV name"
                  className={fieldClassName('borrower')}
                />
              </div>
              <div ref={registerFieldRef('loanType')}>
                <label className="text-sm font-medium mb-1 block">
                  Loan Type *
                </label>
                <Select
                  value={formData.loanType}
                  onValueChange={(value) => handleChange('loanType', value)}
                >
                  <SelectTrigger className={fieldClassName('loanType')}>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secured">Secured</SelectItem>
                    <SelectItem value="unsecured">Unsecured</SelectItem>
                    <SelectItem value="revolving">Revolving</SelectItem>
                    <SelectItem value="term">Term Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div ref={registerFieldRef('repaymentSchedule')}>
                <label className="text-sm font-medium mb-1 block">
                  Repayment Schedule *
                </label>
                <Input
                  value={formData.repaymentSchedule}
                  onChange={(e) =>
                    handleChange('repaymentSchedule', e.target.value)
                  }
                  placeholder="e.g., Monthly principal + interest"
                  className={fieldClassName('repaymentSchedule')}
                />
              </div>
              <div ref={registerFieldRef('creditEnhancement')}>
                <label className="text-sm font-medium mb-1 block">
                  Credit Enhancement
                </label>
                <Input
                  value={formData.creditEnhancement}
                  onChange={(e) =>
                    handleChange('creditEnhancement', e.target.value)
                  }
                  placeholder="Guarantee, reserve, etc."
                  className={fieldClassName('creditEnhancement')}
                />
              </div>
              <div className="col-span-2" ref={registerFieldRef('covenants')}>
                <label className="text-sm font-medium mb-1 block">
                  Covenants
                </label>
                <Textarea
                  value={formData.covenants}
                  onChange={(e) => handleChange('covenants', e.target.value)}
                  placeholder="Financial covenants or restrictions"
                  rows={2}
                  className={fieldClassName('covenants')}
                />
              </div>
              <div className="col-span-2" ref={registerFieldRef('useOfFunds')}>
                <label className="text-sm font-medium mb-1 block">
                  Use of Funds
                </label>
                <Textarea
                  value={formData.useOfFunds}
                  onChange={(e) => handleChange('useOfFunds', e.target.value)}
                  placeholder="Describe the use of funds"
                  rows={2}
                  className={fieldClassName('useOfFunds')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {formData.type === 'alternatives' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Alternatives Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div ref={registerFieldRef('assetSubtype')}>
                <label className="text-sm font-medium mb-1 block">
                  Asset Subtype *
                </label>
                <Input
                  value={formData.assetSubtype}
                  onChange={(e) => handleChange('assetSubtype', e.target.value)}
                  placeholder="e.g., Art, Carbon Credits"
                  className={fieldClassName('assetSubtype')}
                />
              </div>
              <div ref={registerFieldRef('valuationMethod')}>
                <label className="text-sm font-medium mb-1 block">
                  Valuation Method *
                </label>
                <Input
                  value={formData.valuationMethod}
                  onChange={(e) =>
                    handleChange('valuationMethod', e.target.value)
                  }
                  placeholder="e.g., Comparable sales"
                  className={fieldClassName('valuationMethod')}
                />
              </div>
              <div ref={registerFieldRef('liquidityTerms')}>
                <label className="text-sm font-medium mb-1 block">
                  Liquidity Terms *
                </label>
                <Input
                  value={formData.liquidityTerms}
                  onChange={(e) =>
                    handleChange('liquidityTerms', e.target.value)
                  }
                  placeholder="Lock-up or redemption rules"
                  className={fieldClassName('liquidityTerms')}
                />
              </div>
              <div ref={registerFieldRef('custody')}>
                <label className="text-sm font-medium mb-1 block">
                  Custody
                </label>
                <Input
                  value={formData.custody}
                  onChange={(e) => handleChange('custody', e.target.value)}
                  placeholder="Custodian / storage"
                  className={fieldClassName('custody')}
                />
              </div>
              <div ref={registerFieldRef('insurance')}>
                <label className="text-sm font-medium mb-1 block">
                  Insurance
                </label>
                <Input
                  value={formData.insurance}
                  onChange={(e) => handleChange('insurance', e.target.value)}
                  placeholder="Coverage details"
                  className={fieldClassName('insurance')}
                />
              </div>
              <div
                className="col-span-2"
                ref={registerFieldRef('volatilityNotes')}
              >
                <label className="text-sm font-medium mb-1 block">
                  Volatility Notes
                </label>
                <Textarea
                  value={formData.volatilityNotes}
                  onChange={(e) =>
                    handleChange('volatilityNotes', e.target.value)
                  }
                  placeholder="Price volatility or risk notes"
                  rows={2}
                  className={fieldClassName('volatilityNotes')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Application'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/applications')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
