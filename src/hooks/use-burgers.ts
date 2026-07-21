import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Burger, burgers as fallbackBurgers, resolveBurgerImage } from "@/data/burgers";

/**
 * Fetches the live burger menu from the database and keeps it in sync via realtime.
 * Falls back to the bundled static list if the request fails, so the menu always renders.
 */
export function useBurgers() {
  const [burgers, setBurgers] = useState<Burger[]>(fallbackBurgers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("burgers")
        .select("id, name, description, price, image_url, ingredients, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setBurgers(
          data.map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description ?? "",
            price: Number(b.price) || 0,
            image: resolveBurgerImage(b.id, b.image_url),
            ingredients: (b.ingredients ?? []) as string[],
          })),
        );
      }
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("burgers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "burgers" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { burgers, loading };
}
