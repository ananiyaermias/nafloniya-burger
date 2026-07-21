import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useBurgers } from "@/hooks/use-burgers";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "burger-clicks";

export const MenuGridSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [clicks, setClicks] = useState<Record<number, number>>({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { burgers } = useBurgers();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setClicks(JSON.parse(stored));
    }
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleClick = (id: number) => {
    const newClicks = { ...clicks, [id]: (clicks[id] || 0) + 1 };
    setClicks(newClicks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newClicks));
  };

  const handleInteraction = (id: number) => {
    // Track click for popularity
    handleClick(id);
    
    // Find the burger and add to cart
    const burger = burgers.find(b => b.id === id);
    if (burger) {
      addItem(burger, 1);
      toast({
        title: "Added to cart! 🍔",
        description: `${burger.name} has been added to your cart.`,
      });
    }
  };

  // Auto-cycle: every 2.5s show the next burger's ingredients automatically
  useEffect(() => {
    if (burgers.length === 0) return;
    const interval = setInterval(() => {
      setActiveId((prev) => {
        if (prev === null) return burgers[0].id;
        const idx = burgers.findIndex((b) => b.id === prev);
        const next = burgers[(idx + 1) % burgers.length];
        return next.id;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [burgers]);

  const handleMouseEnter = (id: number) => {
    if (!isTouchDevice) setActiveId(id);
  };

  const handleMouseLeave = () => {
    // Keep auto-cycle going; don't clear on leave
  };

  const mostPopularId = Object.keys(clicks).length > 0 
    ? Number(Object.entries(clicks).sort((a, b) => b[1] - a[1])[0]?.[0])
    : null;

  return (
    <section id="menu-section" ref={ref} className="min-h-screen bg-background py-16 sm:py-20 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.span 
            className="inline-block text-accent font-semibold text-sm uppercase tracking-widest mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            Our Menu
          </motion.span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Our Premium Collection
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Explore our carefully curated selection of gourmet burgers, each crafted with premium ingredients.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {burgers.map((burger, index) => (
            <motion.div
              key={burger.id}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={isInView ? { 
                opacity: 1, 
                scale: 1, 
                y: 0 
              } : {}}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="perspective-1000"
            >
              <motion.div
                className={`relative bg-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-elevated transition-all duration-300 cursor-pointer preserve-3d touch-target ${
                  mostPopularId === burger.id ? "ring-2 ring-accent shadow-glow" : ""
                }`}
                onClick={() => handleInteraction(burger.id)}
                onMouseEnter={() => handleMouseEnter(burger.id)}
                onMouseLeave={handleMouseLeave}
                whileHover={{ 
                  rotateY: 5, 
                  rotateX: -5, 
                  scale: 1.02,
                  y: -8
                }}
                whileTap={{ 
                  scale: 0.95,
                  rotateY: 8,
                  rotateX: -8,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {mostPopularId === burger.id && (
                  <motion.div 
                    className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-glow z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    🔥 Popular
                  </motion.div>
                )}
                
                <div className="relative mb-2 sm:mb-4">
                  <img
                    src={burger.image}
                    alt={`${burger.name} - Gourmet Burger`}
                    width={192}
                    height={192}
                    className="w-full h-28 sm:h-40 lg:h-48 object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                
                <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-card-foreground text-center line-clamp-2">
                  {burger.name}
                </h3>
                
                {/* Auto-show ingredients when hovered (desktop) / tapped (mobile) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: activeId === burger.id ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-card/95 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
                >
                  <img
                    src={burger.image}
                    alt={burger.name}
                    className="w-14 h-14 sm:w-20 sm:h-20 object-contain mb-1 sm:mb-2"
                  />
                  <h3 className="text-xs sm:text-base font-bold text-foreground text-center mb-1 line-clamp-1">
                    {burger.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-accent font-semibold uppercase tracking-wider mb-1">
                    Ingredients
                  </p>
                  <ul className="text-[10px] sm:text-xs text-foreground/80 text-center leading-snug font-medium space-y-0.5 mb-2">
                    {burger.ingredients.slice(0, 5).map((ing) => (
                      <li key={ing}>• {ing}</li>
                    ))}
                  </ul>
                  <span className="text-accent font-bold text-xs sm:text-sm flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    Tap to Add
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};