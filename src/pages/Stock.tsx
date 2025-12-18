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
          .select("*")
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
        return item.product_name.toLowerCase().includes(term);
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
              Search stock items by name. Upload stock data in Admin Data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-search">Search Stock</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stock-search"
                  placeholder="Search by item name..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-border/60 overflow-x-auto">
              <ScrollArea className="h-[420px] min-w-[520px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card border-b border-border">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Product Name</th>
                      <th className="px-3 py-2 font-medium text-right">Quantity (Ltr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                          Loading stock...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                          No stock data found. Upload stock in Admin Data.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id} className="border-b border-border/40 last:border-b-0">
                          <td className="px-3 py-2 align-top">
                            <div className="font-medium">{item.product_name}</div>
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {Number(item.quantity ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Stock;
