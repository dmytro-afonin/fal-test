import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, Plus, ArrowDown, ArrowUp } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function CreditsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("credits").eq("id", user.id).single()

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const credits = profile?.credits || 0

  return (
    <div>
      <div className="container mx-auto mt-5">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Credits</h1>
          <p className="text-muted-foreground">Manage your credits and purchase more to generate images</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Current Balance
              </CardTitle>
              <CardDescription>Your available credits for image generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{credits}</div>
              <p className="text-sm text-muted-foreground mt-2">credits available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Up Credits</CardTitle>
              <CardDescription>Purchase more credits to continue generating images</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/credits/top-up">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Buy More Credits
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {transactions && transactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your credit usage and purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "purchase"
                            ? "bg-green-100 text-green-600"
                            : transaction.type === "refund"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {transaction.type === "purchase" || transaction.type === "refund" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-orange-600"}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {transaction.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are credits?</h3>
              <p className="text-sm text-muted-foreground">
                Credits are used to generate images with our AI pipelines. Each pipeline has a different credit cost
                based on the complexity and resolution of the output.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How much do generations cost?</h3>
              <p className="text-sm text-muted-foreground">
                The cost varies by pipeline and image size. You&apos;ll see the exact cost before generating each image.
                Costs are calculated based on the megapixels of your input image.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">New user bonus</h3>
              <p className="text-sm text-muted-foreground">
                New users receive 100 free credits to get started. You can purchase more credits anytime.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
