"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 500));
      router.push("/dashboard");
      return;
    }

    try {
      // const supabase = createClient();
      // const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      // if (error) throw error;
      router.push("/dashboard");
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <span className="font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}><span style={{color:"#111"}}>Trade</span><span style={{background:"linear-gradient(90deg,#F97316,#FBBF24)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>CORE</span></span>
          <p className="mt-1 text-sm text-muted-foreground">
            Start building your edge today.
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create account</CardTitle>
            <CardDescription>
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {isDemo && (
                <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                  Demo mode — click create account to explore.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isDemo}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isDemo}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isDemo}
                  minLength={8}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
