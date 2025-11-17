import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Zap } from "lucide-react";

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  effect_type: string;
  effect_value: number;
}

interface PlayerItem {
  id: string;
  power_up_id: string;
  quantity: number;
  power_ups: PowerUp;
}

export default function PowerUpsShop({ userId, userPoints }: { userId: string; userPoints: number }) {
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [ownedItems, setOwnedItems] = useState<PlayerItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPowerUps();
    loadOwnedItems();
  }, [userId]);

  const loadPowerUps = async () => {
    const { data } = await supabase
      .from("power_ups")
      .select("*")
      .order("cost", { ascending: true });
    if (data) setPowerUps(data);
  };

  const loadOwnedItems = async () => {
    const { data } = await supabase
      .from("player_items")
      .select("*, power_ups(*)")
      .eq("user_id", userId);
    if (data) setOwnedItems(data);
  };

  const purchasePowerUp = async (powerUp: PowerUp) => {
    if (userPoints < powerUp.cost) {
      toast({
        title: "Poin Tidak Cukup!",
        description: `Kamu butuh ${powerUp.cost} poin untuk membeli ini`,
        variant: "destructive",
      });
      return;
    }

    // Check if already owned
    const existing = ownedItems.find((item) => item.power_up_id === powerUp.id);

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from("player_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal membeli power-up",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("player_items")
        .insert({
          user_id: userId,
          power_up_id: powerUp.id,
          quantity: 1,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Gagal membeli power-up",
          variant: "destructive",
        });
        return;
      }
    }

    // Deduct points
    const { error: statsError } = await supabase
      .from("player_stats")
      .update({ total_points: userPoints - powerUp.cost })
      .eq("user_id", userId);

    if (statsError) {
      toast({
        title: "Error",
        description: "Gagal mengurangi poin",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil!",
      description: `${powerUp.name} telah dibeli!`,
    });

    loadOwnedItems();
  };

  const getOwnedQuantity = (powerUpId: string) => {
    const item = ownedItems.find((i) => i.power_up_id === powerUpId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Toko Power-Ups</h2>
          <p className="text-muted-foreground">Poin Tersedia: <span className="text-primary font-bold">{userPoints.toLocaleString('id-ID')}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {powerUps.map((powerUp) => {
          const owned = getOwnedQuantity(powerUp.id);
          const canAfford = userPoints >= powerUp.cost;

          return (
            <Card
              key={powerUp.id}
              className="p-6 bg-card hover:bg-accent/5 transition-all border-2 hover:border-primary/50"
            >
              <div className="text-center space-y-4">
                <div className="text-6xl">{powerUp.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{powerUp.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{powerUp.description}</p>
                </div>

                {owned > 0 && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-bold">Dimiliki: {owned}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-2xl font-bold text-primary">{powerUp.cost}</span>
                  <Button
                    onClick={() => purchasePowerUp(powerUp)}
                    disabled={!canAfford}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    Beli
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
