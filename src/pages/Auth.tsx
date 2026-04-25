import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Starfield } from "@/components/Starfield";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/studio", { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const username = String(fd.get("username"));
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/studio`,
        data: { username },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Echoverse!");
    navigate("/studio");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/studio");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <Starfield />
      <Link to="/" className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-cosmic glow-primary" />
        <span className="font-display text-xl">Echoverse</span>
      </Link>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl">Enter the <span className="text-gradient italic">verse</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Your voice, in any language, anywhere.</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/40">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-cosmic text-primary-foreground hover:opacity-90 glow-primary">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input id="signup-username" name="username" required minLength={2} maxLength={32} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-cosmic text-primary-foreground hover:opacity-90 glow-primary">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to let your voice resonate across the cosmos.
        </p>
      </div>
    </div>
  );
};

export default Auth;