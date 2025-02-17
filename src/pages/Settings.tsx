
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const [isStravaConnected, setIsStravaConnected] = useState(false);

  useEffect(() => {
    checkStravaConnection();
  }, []);

  const checkStravaConnection = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('strava_accounts')
      .select('id')
      .single();

    setIsStravaConnected(!!data);
  };

  const handleStravaConnect = async () => {
    const { data: functionData, error: functionError } = await supabase.functions.invoke('strava', {
      body: { action: 'get_client_id' }
    });

    if (functionError) {
      toast.error("Failed to initiate Strava connection");
      return;
    }

    const clientId = functionData.clientId;
    const redirectUri = `${window.location.origin}/api/strava?action=callback`;
    const scope = "activity:read_all";
    
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = stravaAuthUrl;
  };

  const handleStravaDisconnect = async () => {
    const { error } = await supabase
      .from('strava_accounts')
      .delete()
      .single();

    if (error) {
      toast.error("Failed to disconnect Strava");
      return;
    }

    setIsStravaConnected(false);
    toast.success("Strava disconnected successfully");
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect your accounts to automatically track your activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">Strava</h4>
                      <p className="text-sm text-muted-foreground">
                        {isStravaConnected 
                          ? "Your Strava account is connected"
                          : "Connect your Strava account to automatically track your fitness activities"}
                      </p>
                    </div>
                    <Button
                      variant={isStravaConnected ? "destructive" : "outline"}
                      onClick={isStravaConnected ? handleStravaDisconnect : handleStravaConnect}
                    >
                      <Link2 className="mr-2" />
                      {isStravaConnected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
