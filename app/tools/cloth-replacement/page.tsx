import { CloseReplacement } from "@/components/common/cloth-replacement";

export default async function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Cloth Replacement</h1>
          <p className="text-sm text-muted-foreground">
            Get clothes from one character and puts it on another
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <CloseReplacement />
      </section>
    </div>
  );
}
