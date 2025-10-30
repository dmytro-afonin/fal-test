import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PipelineExecutor } from "@/components/pipeline-executor"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"

interface PipelinePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pipeline, error } = await supabase.from("pipelines").select("*").eq("id", id).single()

  if (error || !pipeline) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header/>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground">{pipeline.description}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <PipelineExecutor pipeline={pipeline} />
      </main>
    </div>
  )
}
