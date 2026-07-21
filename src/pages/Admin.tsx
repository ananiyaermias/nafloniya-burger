import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, RefreshCw, CheckCircle, Clock, XCircle, ArrowLeft, ListOrdered, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AdminBurgerManager } from "@/components/admin/AdminBurgerManager";

interface Order {
  id: string;
  burger_name: string;
  customer_name: string;
  customer_phone: string;
  quantity: number;
  status: string;
  created_at: string;
}

const Admin = () => {
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [activeTab, setActiveTab] = useState<"orders" | "burgers">("orders");
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;
  const { toast } = useToast();

  const handleSessionExpired = useCallback(() => {
    setAuthenticated(false);
    setSessionToken(null);
    setOrders([]);
    toast({
      title: "Session Expired",
      description: "Please log in again.",
      variant: "destructive",
    });
  }, [toast]);

  const fetchOrders = useCallback(async (token: string, isInitial = false) => {
    if (!token) return;
    
    if (isInitial) setInitialLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-fetch-orders", {
        body: { token },
      });

      if (error || !data?.success) {
        if (data?.error?.includes("expired") || data?.error?.includes("Session")) {
          handleSessionExpired();
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch orders.",
            variant: "destructive",
          });
        }
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch orders.",
        variant: "destructive",
      });
    }
    
    if (isInitial) setInitialLoading(false);
  }, [toast, handleSessionExpired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (error || !data?.success) {
        toast({
          title: "Access Denied",
          description: data?.error || "Invalid password. Please try again.",
          variant: "destructive",
        });
        setPassword("");
      } else {
        // Store session token (not password)
        setAuthenticated(true);
        setSessionToken(data.token);
        setPassword(""); // Clear password from state immediately
        fetchOrders(data.token, true);
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await supabase.functions.invoke("verify-admin", {
          body: { action: "logout", token: sessionToken },
        });
      } catch {
        // Ignore logout errors
      }
    }
    setAuthenticated(false);
    setSessionToken(null);
    setOrders([]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, removeFromList = false) => {
    if (!sessionToken) {
      handleSessionExpired();
      return;
    }

    // Store original order for potential revert
    const originalOrder = orders.find(o => o.id === orderId);

    // Optimistic update - remove from list if cancelled, otherwise update status
    if (removeFromList) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } else {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-update-order", {
        body: { token: sessionToken, orderId, status: newStatus },
      });

      if (error || !data?.success) {
        // Revert on error - add back if removed, or refetch
        if (removeFromList && originalOrder) {
          setOrders(prev => [...prev, originalOrder].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        } else {
          fetchOrders(sessionToken);
        }
        
        if (data?.error?.includes("expired") || data?.error?.includes("Session")) {
          handleSessionExpired();
        } else {
          toast({
            title: "Update Failed",
            description: data?.error || "Could not update order status.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: removeFromList ? "Order Removed" : "Status Updated",
        description: removeFromList ? "Order has been cancelled and removed." : `Order marked as ${newStatus}.`,
      });
    } catch {
      // Revert on error
      if (removeFromList && originalOrder) {
        setOrders(prev => [...prev, originalOrder].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } else {
        fetchOrders(sessionToken);
      }
      toast({
        title: "Update Failed",
        description: "Could not update order status.",
        variant: "destructive",
      });
    }
  };

  // Pull-to-refresh handlers
  const handlePullRefresh = useCallback(async () => {
    if (!sessionToken || refreshing) return;
    setRefreshing(true);
    await fetchOrders(sessionToken);
    setRefreshing(false);
  }, [sessionToken, refreshing, fetchOrders]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!mainRef.current || refreshing) return;
    const scrollTop = mainRef.current.scrollTop;
    if (scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD) {
      handlePullRefresh();
    }
    setPullDistance(0);
  }, [pullDistance, handlePullRefresh]);

  useEffect(() => {
    if (!authenticated || !sessionToken) return;

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(sessionToken)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticated, sessionToken, fetchOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl p-8 shadow-elevated max-w-md w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground">Admin Access</h1>
            <p className="text-muted-foreground text-center mt-2">
              Enter the admin password to view orders
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-accent text-accent-foreground font-bold"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === "orders" && (
              <Button
                variant="outline"
                onClick={() => sessionToken && fetchOrders(sessionToken)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 pt-4">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "orders" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListOrdered className="w-4 h-4" /> Orders
          </button>
          <button
            onClick={() => setActiveTab("burgers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "burgers" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Beef className="w-4 h-4" /> Burgers
          </button>
        </div>
      </div>

      <main
        ref={mainRef}
        className="container mx-auto px-6 py-8 overflow-auto"
        onTouchStart={activeTab === "orders" ? handleTouchStart : undefined}
        onTouchMove={activeTab === "orders" ? handleTouchMove : undefined}
        onTouchEnd={activeTab === "orders" ? handleTouchEnd : undefined}
        style={{ touchAction: "pan-y" }}
      >
        {activeTab === "burgers" ? (
          sessionToken && <AdminBurgerManager sessionToken={sessionToken} onSessionExpired={handleSessionExpired} />
        ) : (
        <>
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || refreshing) && (
          <div className="flex justify-center items-center mb-4 transition-all" style={{ height: refreshing ? 40 : pullDistance * 0.5 }}>
            <RefreshCw className={`w-5 h-5 text-muted-foreground transition-transform ${refreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${pullDistance * 3}deg)`, opacity: Math.min(pullDistance / PULL_THRESHOLD, 1) }} />
            {pullDistance >= PULL_THRESHOLD && !refreshing && (
              <span className="ml-2 text-sm text-muted-foreground">Release to refresh</span>
            )}
          </div>
        )}
        {initialLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-md border border-border animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-5 h-5 rounded-full bg-muted" />
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-4 w-28 bg-muted rounded" />
                      <div className="h-4 w-12 bg-muted rounded" />
                      <div className="h-4 w-36 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.filter(o => o.status !== "cancelled").length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No orders yet. Orders will appear here when customers place them.
              </div>
            ) : (
              orders.filter(o => o.status !== "cancelled").map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-xl p-6 shadow-md border border-border"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(order.status)}
                        <h3 className="text-lg font-bold text-card-foreground">
                          {order.burger_name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-card-foreground">Customer:</span>{" "}
                          {order.customer_name}
                        </div>
                        <div>
                          <span className="font-medium text-card-foreground">Phone:</span>{" "}
                          {order.customer_phone}
                        </div>
                        <div>
                          <span className="font-medium text-card-foreground">Qty:</span>{" "}
                          {order.quantity}
                        </div>
                        <div>
                          <span className="font-medium text-card-foreground">Time:</span>{" "}
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {order.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, "cancelled", true)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
};

export default Admin;
