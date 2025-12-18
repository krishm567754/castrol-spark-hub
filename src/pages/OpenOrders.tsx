import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const OpenOrders = () => {
  const [orders, setOrders] = useState<Tables<"open_orders">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const { data, error } = await supabase
          .from("open_orders")
          .select("*")
          .gte("order_date", threeDaysAgo.toISOString().split("T")[0])
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

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Open Orders</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Orders from Last 3 Days</CardTitle>
            <CardDescription>Recent open sales orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border/60 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Order No</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sales Exec</th>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        Loading open orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        No open orders found for the last 3 days.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="border-b border-border/40 last:border-b-0">
                        <td className="px-3 py-2 align-top text-muted-foreground">{o.order_date}</td>
                        <td className="px-3 py-2 align-top font-medium">{o.order_no}</td>
                        <td className="px-3 py-2 align-top">{o.customer_name}</td>
                        <td className="px-3 py-2 align-top text-muted-foreground">{o.sales_exec_name}</td>
                        <td className="px-3 py-2 align-top text-muted-foreground">{o.product_name}</td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {o.quantity != null ? Number(o.quantity).toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">{o.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default OpenOrders;
