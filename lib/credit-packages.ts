export interface CreditPackage {
  id: string
  name: string
  description: string
  credits: number
  priceInCents: number
  popular?: boolean
}

// Credit packages available for purchase
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter-100",
    name: "Starter Pack",
    description: "Perfect for trying out our AI pipelines",
    credits: 100,
    priceInCents: 999, // $9.99
  },
  {
    id: "popular-500",
    name: "Popular Pack",
    description: "Best value for regular users",
    credits: 500,
    priceInCents: 3999, // $39.99
    popular: true,
  },
  {
    id: "pro-1000",
    name: "Pro Pack",
    description: "For power users and professionals",
    credits: 1000,
    priceInCents: 6999, // $69.99
  },
  {
    id: "enterprise-5000",
    name: "Enterprise Pack",
    description: "Maximum credits for heavy usage",
    credits: 5000,
    priceInCents: 29999, // $299.99
  },
]
