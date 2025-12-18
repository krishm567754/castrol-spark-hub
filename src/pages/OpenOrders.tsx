import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const OpenOrders = () => {
  const [orders, setOrders] = useState<Tables<"open_orders">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Tables<"open_orders"> | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const formatDate = (d: Date) => d.toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("open_orders")
          .select("*")
          .gte("order_date", formatDate(threeDaysAgo))
          .lte("order_date", formatDate(today))
          .order("order_date", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error loading open orders", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Tables<"open_orders">[]>();
    orders.forEach((o) => {
      const key = o.order_no || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return Array.from(map.entries());
  }, [orders]);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Open Orders</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Orders from Last 3 Days</CardTitle>
            <CardDescription>Recent open sales orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border/60 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sales Exec</th>
                    <th className="px-3 py-2 font-medium text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        Loading open orders...
                      </td>
                    </tr>
                  ) : grouped.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                        No open orders found for the last 3 days.
                      </td>
                    </tr>
                  ) : (
                    grouped.map(([orderNo, rows]) => {
                      const first = rows[0];
                      return (
                        <tr
                          key={orderNo}
                          className="border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/40"
                          onClick={() => setSelectedOrder(first)}
                        >
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {first.order_date}
                          </td>
                          <td className="px-3 py-2 align-top">{first.customer_name}</td>
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {first.sales_exec_name}
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {rows.length}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Dialog
              open={!!selectedOrder}
              onOpenChange={(open) => !open && setSelectedOrder(null)}
            >
              <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Order Details</DialogTitle>
                </DialogHeader>
                {selectedOrder && (
                  <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                    <div className="font-semibold">
                      {selectedOrder.customer_name}
                    </div>
                    <div className="text-muted-foreground">
                      Date: {selectedOrder.order_date}
                    </div>
                    <div className="text-muted-foreground">
                      Order No: {selectedOrder.order_no}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs font-semibold mb-1">Products</div>
                      {orders
                        .filter((o) => o.order_no === selectedOrder.order_no)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between border-b border-border/40 last:border-b-0 py-1"
                          >
                            <span className="mr-2 text-xs text-muted-foreground">
                              {o.product_name}
                            </span>
                            <span className="text-xs font-medium">
                              {o.quantity != null ? Number(o.quantity).toFixed(2) : "-"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default OpenOrders;
