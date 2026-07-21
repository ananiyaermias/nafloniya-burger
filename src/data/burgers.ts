import burger1 from "@/assets/burger-1-optimized.png";
import burger2 from "@/assets/burger-2-optimized.png";
import burger3 from "@/assets/burger-3-optimized.png";
import burger4 from "@/assets/burger-4-optimized.png";
import burger5 from "@/assets/burger-5-optimized.png";
import burger6 from "@/assets/burger-6-optimized.png";
import burger7 from "@/assets/burger-7-optimized.png";
import burger8 from "@/assets/burger-8-optimized.png";

// Preload all bundled burger images immediately
const preloadImages = [burger1, burger2, burger3, burger4, burger5, burger6, burger7, burger8];
preloadImages.forEach((src) => {
  const img = new Image();
  img.src = src;
});

export interface Burger {
  id: number;
  name: string;
  image: string;
  description: string;
  price: number;
  ingredients: string[];
}

// Bundled fallback images for the seed burgers (id 1-8). New burgers will use
// their stored image_url; seed burgers without an uploaded photo fall back here.
export const bundledBurgerImages: Record<number, string> = {
  1: burger1, 2: burger2, 3: burger3, 4: burger4,
  5: burger5, 6: burger6, 7: burger7, 8: burger8,
};

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export const resolveBurgerImage = (id: number, imageUrl: string | null | undefined): string => {
  if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
  return bundledBurgerImages[id] ?? PLACEHOLDER_IMAGE;
};

// Static fallback used when the database is unreachable, so the menu always renders.
export const burgers: Burger[] = [
  { id: 1, name: "Double Bacon Deluxe", image: burger1, description: "Two juicy beef patties layered with crispy bacon, melted cheddar, and our secret sauce.", price: 12.99, ingredients: ["Brioche bun", "Beef patty x2", "Crispy bacon", "Cheddar cheese", "Lettuce", "Tomato", "Secret sauce"] },
  { id: 2, name: "Crispy Chicken Supreme", image: burger2, description: "Golden crispy chicken breast with fresh lettuce, tomato, and creamy mayo.", price: 10.99, ingredients: ["Sesame bun", "Crispy chicken breast", "Lettuce", "Tomato", "Pickles", "Creamy mayo"] },
  { id: 3, name: "Plant Power Burger", image: burger3, description: "100% plant-based patty with avocado, sprouts, and tangy vegan aioli.", price: 11.99, ingredients: ["Whole-grain bun", "Plant-based patty", "Avocado", "Sprouts", "Red onion", "Vegan aioli"] },
  { id: 4, name: "BBQ Bacon Bliss", image: burger4, description: "Smoky BBQ sauce drizzled over bacon, onion rings, and a perfectly grilled patty.", price: 13.99, ingredients: ["Brioche bun", "Beef patty", "Bacon", "Onion rings", "Cheddar", "BBQ sauce"] },
  { id: 5, name: "Jalapeño Fire", image: burger5, description: "Spicy jalapeños, pepper jack cheese, and chipotle mayo for heat lovers.", price: 11.49, ingredients: ["Brioche bun", "Beef patty", "Jalapeños", "Pepper jack cheese", "Lettuce", "Chipotle mayo"] },
  { id: 6, name: "Mushroom Swiss Heaven", image: burger6, description: "Sautéed mushrooms and melted Swiss cheese on a herb-seasoned patty.", price: 12.49, ingredients: ["Brioche bun", "Herb beef patty", "Sautéed mushrooms", "Swiss cheese", "Arugula", "Garlic aioli"] },
  { id: 7, name: "Truffle Excellence", image: burger7, description: "Luxurious truffle aioli, arugula, and parmesan on premium Wagyu beef.", price: 18.99, ingredients: ["Brioche bun", "Wagyu beef patty", "Arugula", "Parmesan", "Caramelized onions", "Truffle aioli"] },
  { id: 8, name: "Breakfast Champion", image: burger8, description: "Fried egg, bacon, hash brown, and maple syrup glaze for morning cravings.", price: 13.49, ingredients: ["Brioche bun", "Beef patty", "Fried egg", "Bacon", "Hash brown", "Maple glaze"] },
];
