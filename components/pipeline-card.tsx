import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { Coins } from "lucide-react"

interface PipelineCardProps {
  id: string
  name: string
  description: string
  beforeImage: string
  afterImage: string
  creditCost: number
}

export function PipelineCard({ id, name, description, beforeImage, afterImage, creditCost }: PipelineCardProps) {
  return (
    <Link href={`/pipeline/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardContent className="p-0">
          <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} alt={name} />
        </CardContent>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Coins className="h-4 w-4" />
            <span>From {creditCost} credits</span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
