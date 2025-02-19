
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerkTree } from "@/components/perks/PerkTree";
import { Layout } from "@/components/Layout";
import { Trees } from "lucide-react";

export default function Perks() {
  return (
    <Layout>
      <div className="container py-6 space-y-8">
        <header className="flex items-center gap-4">
          <Trees className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Perk Trees</h1>
            <p className="text-muted-foreground">
              Unlock powerful abilities and bonuses
            </p>
          </div>
        </header>

        <Tabs defaultValue="strategist" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="strategist">Strategist</TabsTrigger>
            <TabsTrigger value="explorer">Explorer</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
          </TabsList>
          <TabsContent value="strategist">
            <PerkTree path="strategist" />
          </TabsContent>
          <TabsContent value="explorer">
            <PerkTree path="explorer" />
          </TabsContent>
          <TabsContent value="creator">
            <PerkTree path="creator" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
