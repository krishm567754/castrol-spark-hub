import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Lock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Shri Laxmi Hybrid ERP</CardTitle>
          <CardDescription className="text-lg">
            Castrol Distributor Performance & ERP Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-bold text-primary">📊</div>
                <div className="text-sm font-medium mt-2">Real-time KPIs</div>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-bold text-primary">📈</div>
                <div className="text-sm font-medium mt-2">Sales Analytics</div>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <div className="text-2xl font-bold text-primary">🔒</div>
                <div className="text-sm font-medium mt-2">Secure Access</div>
              </div>
            </div>
            
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="w-full text-base"
            >
              <Lock className="mr-2 h-5 w-5" />
              Login to Dashboard
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Secure login required to access ERP features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
