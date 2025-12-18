import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const Customers = () => {
  const [nameOrCode, setNameOrCode] = useState("");
  const [city, setCity] = useState("");
  const [customers, setCustomers] = useState<Tables<"customers">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, customer_code, customer_name, city, phone, category, sales_executive")
          .order("customer_name", { ascending: true });

        if (error) throw error;
        setCustomers(data || []);
      } catch (error) {
        console.error("Error loading customers", error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        const term = nameOrCode.toLowerCase();
        const cityTerm = city.toLowerCase();
        const matchesNameOrCode =
          !term ||
          c.customer_name.toLowerCase().includes(term) ||
          c.customer_code.toLowerCase().includes(term);
        const matchesCity = !cityTerm || (c.city || "").toLowerCase().includes(cityTerm);
        return matchesNameOrCode && matchesCity;
      }),
    [customers, nameOrCode, city]
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Master</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search Customers</CardTitle>
            <CardDescription>Search by name, code, city, or phone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-search">Customer Name / Code</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    placeholder="Search..."
                    className="pl-9"
                    value={nameOrCode}
                    onChange={(e) => setNameOrCode(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city-search">City</Label>
                <Input
                  id="city-search"
                  placeholder="Enter city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-[420px] rounded-md border border-border/60 mt-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">City</th>
                    <th className="px-3 py-2 font-medium">Sales Exec</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Loading customers...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No customers found. Upload customer master data in Admin Data.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b border-border/40 last:border-b-0">
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {c.customer_code}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">{c.customer_name}</div>
                          {c.category && (
                            <div className="text-xs text-muted-foreground">{c.category}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {c.city}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {c.sales_executive}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {c.phone}
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

export default Customers;
