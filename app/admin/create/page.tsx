import { CreatePipelineForm } from "@/components/admin/create-pipeline-form";

export default function CreatePipelinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create Preset</h1>
          <p className="text-sm text-muted-foreground">
            Configure a new AI preset
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
