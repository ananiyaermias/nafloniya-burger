import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Burger } from "@/data/burgers";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().min(10, "Phone must be at least 10 digits").max(20, "Phone too long"),
  quantity: z.number().min(1, "At least 1 required").max(10, "Max 10 per order"),
});

interface OrderFormDialogProps {
  burger: Burger | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderFormDialog = ({ burger, open, onOpenChange }: OrderFormDialogProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!burger) return;

    const validation = orderSchema.safeParse({ name, phone, quantity });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI - show success immediately
    const orderName = name.trim();
    const orderQuantity = quantity;
    const burgerName = burger.name;
    
    setLoading(true);
    
    // Close dialog and show success toast immediately (optimistic)
    toast({
      title: "Order Placed! 🎉",
      description: `Your order for ${orderQuantity}x ${burgerName} is being processed.`,
    });
    
    setName("");
    setPhone("");
    setQuantity(1);
    onOpenChange(false);
    
    // Process in background
    try {
      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: {
          burger_name: burgerName,
          customer_name: orderName,
          customer_phone: phone.trim(),
          quantity: orderQuantity,
        },
      });

      if (error || !data?.success) {
        // Show error toast if background processing failed
        toast({
          title: "Order Issue",
          description: data?.error || "There was an issue with your order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Order Issue",
        description: "Network error. Please check your order status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Order {burger?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <img
              src={burger?.image}
              alt={burger?.name}
              width={128}
              height={128}
              className="w-32 h-32 object-contain"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
              placeholder="Enter your phone number"
              required
              maxLength={20}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              required
            />
          </div>

          <div className="text-lg font-semibold text-center">
            Total: ${((burger?.price || 0) * quantity).toFixed(2)}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-accent text-accent-foreground font-bold"
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Confirm Order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
