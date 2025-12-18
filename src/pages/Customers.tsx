import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
          .select("*")
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
        if (!term) return true;
        return (
          c.customer_name.toLowerCase().includes(term) ||
          c.customer_code.toLowerCase().includes(term)
        );
      }),
    [customers, nameOrCode]
  );

  const [selectedCustomer, setSelectedCustomer] = useState<Tables<"customers"> | null>(null);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Master</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search Customers</CardTitle>
            <CardDescription>Search by name or code, then tap to view details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <ScrollArea className="h-[320px] rounded-md border border-border/60 mt-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                        Loading customers...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                        No customers found. Upload customer master data in Admin Data.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {c.customer_code}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">{c.customer_name}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>

            <Dialog
              open={!!selectedCustomer}
              onOpenChange={(open) => !open && setSelectedCustomer(null)}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Customer Details</DialogTitle>
                </DialogHeader>
                {selectedCustomer && (
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold">
                      {selectedCustomer.customer_name} ({selectedCustomer.customer_code})
                    </div>
                    {selectedCustomer.address && (
                      <div className="text-muted-foreground">
                        Address: {selectedCustomer.address}
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="text-muted-foreground">
                        Contact: {selectedCustomer.phone}
                      </div>
                    )}
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

export default Customers;
