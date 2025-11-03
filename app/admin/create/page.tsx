import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreatePipelineForm } from "@/components/create-pipeline-form";
import { Button } from "@/components/ui/button";

export default function CreatePipelinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Configure a new AI pipeline
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <CreatePipelineForm />
      </main>
    </div>
  );
}
