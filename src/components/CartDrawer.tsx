import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Plus, Minus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EXTRA_OPTIONS = ["Ketchup", "Mayonnaise", "Extra Sausage"];

export const CartDrawer = () => {
  const { items, removeItem, updateQuantity, updateCustomization, clearCart, totalItems, isOpen, setIsOpen } = useCart();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.burger.price * item.quantity,
    0
  );

  const buildBurgerName = (item: typeof items[number]) => {
    const parts: string[] = [item.burger.name];
    const c = item.customization;
    if (c.remove.trim()) parts.push(`-${c.remove.trim()}`);
    if (c.add.trim()) parts.push(`+${c.add.trim()}`);
    if (c.extras.length) parts.push(`Extras: ${c.extras.join(", ")}`);
    return parts.join(" | ").slice(0, 100);
  };

  const toggleExtra = (burgerId: number, extra: string, current: string[]) => {
    const next = current.includes(extra)
      ? current.filter(e => e !== extra)
      : [...current, extra];
    updateCustomization(burgerId, { extras: next });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast({ title: "Cart is empty", description: "Please add some burgers to your cart first.", variant: "destructive" });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: "Missing information", description: "Please fill in your name and phone number.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        burger_name: buildBurgerName(item),
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          items: orderItems,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Failed to submit order");
      }

      toast({
        title: "Order Placed! 🎉",
        description: `Your order of ${totalItems} item${totalItems > 1 ? 's' : ''} has been submitted successfully.`,
      });

      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setShowCheckout(false);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-accent text-white p-4 rounded-full shadow-glow hover:bg-accent/90 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-foreground text-background w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Cart ({totalItems})
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-2">Add some delicious burgers!</p>
                </div>
              ) : showCheckout ? (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your name" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter your phone number" required maxLength={15} />
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Order Summary</h3>
                    {items.map(item => (
                      <div key={item.burger.id} className="text-sm py-1">
                        <div className="flex justify-between">
                          <span>{item.burger.name} x{item.quantity}</span>
                          <span>${(item.burger.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {(item.customization.remove || item.customization.add || item.customization.extras.length > 0) && (
                          <div className="text-xs text-muted-foreground pl-2">
                            {item.customization.remove && <div>− {item.customization.remove}</div>}
                            {item.customization.add && <div>+ {item.customization.add}</div>}
                            {item.customization.extras.length > 0 && <div>Extras: {item.customization.extras.join(", ")}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-accent">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">Back</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 bg-accent hover:bg-accent/90 text-white">
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {items.map(item => {
                    const isExpanded = expandedId === item.burger.id;
                    return (
                      <motion.div
                        key={item.burger.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-background rounded-xl p-4"
                      >
                        <div className="flex gap-4">
                          <img src={item.burger.image} alt={item.burger.name} width={80} height={80} className="w-20 h-20 object-contain rounded-lg" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-card-foreground">{item.burger.name}</h3>
                            <p className="text-accent font-bold">${item.burger.price.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.burger.id, item.quantity - 1)}>
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.burger.id, item.quantity + 1)} disabled={item.quantity >= 10}>
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive ml-auto" onClick={() => removeItem(item.burger.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-1">
                            Includes
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {item.burger.ingredients.join(" • ")}
                          </p>
                        </div>


                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.burger.id)}
                          className="mt-3 w-full flex items-center justify-between text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                        >
                          <span>Customize this burger</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-3 mt-2 border-t border-border">
                                <div className="space-y-1">
                                  <Label htmlFor={`remove-${item.burger.id}`} className="text-xs">Ingredients to remove</Label>
                                  <Textarea
                                    id={`remove-${item.burger.id}`}
                                    value={item.customization.remove}
                                    onChange={(e) => updateCustomization(item.burger.id, { remove: e.target.value })}
                                    placeholder="e.g. no pickles, no onions"
                                    rows={2}
                                    maxLength={80}
                                    className="text-sm resize-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`add-${item.burger.id}`} className="text-xs">Ingredients to add</Label>
                                  <Textarea
                                    id={`add-${item.burger.id}`}
                                    value={item.customization.add}
                                    onChange={(e) => updateCustomization(item.burger.id, { add: e.target.value })}
                                    placeholder="e.g. extra cheese, avocado"
                                    rows={2}
                                    maxLength={80}
                                    className="text-sm resize-none"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Extras</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {EXTRA_OPTIONS.map((extra) => {
                                      const selected = item.customization.extras.includes(extra);
                                      return (
                                        <button
                                          key={extra}
                                          type="button"
                                          onClick={() => toggleExtra(item.burger.id, extra, item.customization.extras)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            selected
                                              ? "bg-accent text-accent-foreground border-accent"
                                              : "bg-transparent border-border text-muted-foreground hover:border-accent"
                                          }`}
                                        >
                                          {selected ? "✓ " : "+ "}{extra}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && !showCheckout && (
              <div className="border-t border-border p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-2xl font-bold text-accent">${totalPrice.toFixed(2)}</span>
                </div>
                <Button onClick={() => setShowCheckout(true)} className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-6 text-lg">
                  Proceed to Checkout
                </Button>
                <Button variant="ghost" onClick={clearCart} className="w-full text-muted-foreground">
                  Clear Cart
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
