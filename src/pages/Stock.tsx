import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const Stock = () => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Tables<"stock">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStock = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("stock")
          .select("id, product_code, product_name, pack_size, brand, quantity, created_at, updated_at")
          .order("product_name", { ascending: true });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error("Error loading stock", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStock();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
          item.product_name.toLowerCase().includes(term) ||
          item.product_code.toLowerCase().includes(term) ||
          (item.brand || "").toLowerCase().includes(term)
        );
      }),
    [items, search]
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Stock</h1>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
            <CardDescription>
              Search stock items by name, code or brand. Upload stock data in Admin Data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-search">Search Stock</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stock-search"
                  placeholder="Search by item name, code or brand..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-[420px] rounded-md border border-border/60">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Pack</th>
                    <th className="px-3 py-2 font-medium">Brand</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Loading stock...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No stock data found. Upload stock in Admin Data.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="border-b border-border/40 last:border-b-0">
                        <td className="px-3 py-2 align-top whitespace-nowrap text-muted-foreground">
                          {item.product_code}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">{item.product_name}</div>
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {item.pack_size}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {item.brand}
                        </td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {Number(item.quantity ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Stock;
