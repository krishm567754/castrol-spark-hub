import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MasterRow {
  invoice_date: string;
  invoice_no: string;
  customer_name: string;
  product_brand_name: string | null;
  product_name: string | null;
  sales_exec_name: string | null;
  total_value: number | null;
}

const MasterSearch = () => {
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [results, setResults] = useState<MasterRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!customer.trim() && !product.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("invoices")
        .select(
          "invoice_date, invoice_no, customer_name, product_brand_name, product_name, sales_exec_name, total_value"
        )
        .order("invoice_date", { ascending: false })
        .limit(200);

      if (customer.trim()) {
        query = query.ilike("customer_name", `%${customer.trim()}%`);
      }

      if (product.trim()) {
        const term = product.trim();
        query = query.or(
          `product_brand_name.ilike.%${term}%,product_name.ilike.%${term}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error("Master search failed", err);
      setError(err.message || "Failed to search invoices");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Master Search</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search All Invoices</CardTitle>
            <CardDescription>Search current and historical invoices by customer and product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Search customer..."
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-brand">Product / Brand</Label>
                <Input
                  id="product-brand"
                  placeholder="Search product or brand..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSearch}
              disabled={isLoading || (!customer.trim() && !product.trim())}
            >
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Searching..." : "Search"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="mt-4 border border-border/60 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Invoice No</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Product / Brand</th>
                    <th className="px-3 py-2 font-medium">Sales Exec</th>
                    <th className="px-3 py-2 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        Searching invoices...
                      </td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        Enter search criteria and click search to view results.
                      </td>
                    </tr>
                  ) : (
                    results.map((row, idx) => (
                      <tr key={`${row.invoice_no}-${idx}`} className="border-b border-border/40 last:border-b-0">
                        <td className="px-3 py-2 align-top text-muted-foreground">{row.invoice_date}</td>
                        <td className="px-3 py-2 align-top font-medium">{row.invoice_no}</td>
                        <td className="px-3 py-2 align-top">{row.customer_name}</td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {row.product_name || row.product_brand_name}
                        </td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {row.sales_exec_name || "-"}
                        </td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {row.total_value != null
                            ? `₹${Number(row.total_value).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "-"}
                        </td>
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

export default MasterSearch;
