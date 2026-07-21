import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Burger } from "@/data/burgers";
import { useBurgers } from "@/hooks/use-burgers";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const Order = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem, items, setIsOpen } = useCart();
  const { toast } = useToast();
  const { burgers } = useBurgers();
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  // Check for pre-selected burger from URL
  useEffect(() => {
    const burgerId = searchParams.get("burger");
    if (burgerId) {
      const burger = burgers.find(b => b.id === parseInt(burgerId, 10));
      if (burger) {
        addItem(burger, 1);
        toast({
          title: "Added to cart!",
          description: `${burger.name} has been added to your cart.`,
        });
        // Clear the URL param after adding to cart
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, addItem, toast, burgers]);

  const handleAddToCart = (burger: Burger) => {
    addItem(burger, 1);
    setAddedItems(prev => new Set(prev).add(burger.id));
    toast({
      title: "Added to cart! 🍔",
      description: `${burger.name} has been added to your cart.`,
    });
    
    // Reset the "added" state after 1 second
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(burger.id);
        return next;
      });
    }, 1000);
  };

  const isInCart = (burgerId: number) => {
    return items.some(item => item.burger.id === burgerId);
  };

  const getCartQuantity = (burgerId: number) => {
    const item = items.find(item => item.burger.id === burgerId);
    return item?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Order Menu</h1>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Build Your Order
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Add your favorite burgers to cart and checkout when ready!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {burgers.map((burger, index) => (
            <motion.div
              key={burger.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-elevated hover:shadow-glow transition-all duration-300 hover:-translate-y-2 relative"
            >
              {/* Quantity Badge */}
              {isInCart(burger.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 bg-accent text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center"
                >
                  {getCartQuantity(burger.id)}
                </motion.div>
              )}

              <img
                src={burger.image}
                alt={burger.name}
                width={160}
                height={160}
                className="w-full h-40 object-contain mb-4"
                loading="eager"
                decoding="async"
              />
              
              <h3 className="text-xl font-bold text-card-foreground text-center mb-2">
                {burger.name}
              </h3>
              
              <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                {burger.description}
              </p>
              
              <div className="text-2xl font-bold text-accent text-center mb-4">
                ${burger.price.toFixed(2)}
              </div>
              
              <Button
                onClick={() => handleAddToCart(burger)}
                className={`w-full font-bold py-3 transition-all ${
                  addedItems.has(burger.id)
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "gradient-accent text-accent-foreground"
                }`}
              >
                {addedItems.has(burger.id) ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Added!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add to Cart
                  </span>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Floating Checkout Button */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-6 text-lg shadow-glow rounded-full"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Order;
