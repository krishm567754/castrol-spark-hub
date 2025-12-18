import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSalesExecScope } from "@/hooks/useSalesExecScope";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MasterHeaderRow {
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  sales_exec_name: string | null;
  total_volume: number;
}

interface MasterDetailRow {
  product_name: string | null;
  product_brand_name: string | null;
  product_volume: number | null;
}

const MasterSearch = () => {
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [headers, setHeaders] = useState<MasterHeaderRow[]>([]);
  const [details, setDetails] = useState<Record<string, MasterDetailRow[]>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading: scopeLoading, hasAllAccess, allowedSalesExecNames } = useSalesExecScope();

  const handleSearch = async () => {
    if (!customer.trim() && !product.trim()) return;
    setIsLoading(true);
    setError(null);
    setSelectedInvoice(null);

    try {
      let query = supabase
        .from("invoices")
        .select(
          "invoice_no, invoice_date, customer_name, sales_exec_name, product_brand_name, product_name, product_volume"
        )
        .order("invoice_date", { ascending: false })
        .limit(500);

      if (customer.trim()) {
        query = query.ilike("customer_name", `%${customer.trim()}%`);
      }

      if (product.trim()) {
        const term = product.trim();
        query = query.or(
          `product_brand_name.ilike.%${term}%,product_name.ilike.%${term}%`
        );
      }

      if (!hasAllAccess && allowedSalesExecNames.length > 0) {
        query = query.in("sales_exec_name", allowedSalesExecNames);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data || [];
      const headerMap = new Map<string, MasterHeaderRow>();
      const detailMap: Record<string, MasterDetailRow[]> = {};

      for (const row of rows) {
        const key = row.invoice_no as string;
        if (!headerMap.has(key)) {
          headerMap.set(key, {
            invoice_no: key,
            invoice_date: row.invoice_date as string,
            customer_name: row.customer_name as string,
            sales_exec_name: row.sales_exec_name as string | null,
            total_volume: 0,
          });
          detailMap[key] = [];
        }
        const hdr = headerMap.get(key)!;
        hdr.total_volume += Number(row.product_volume || 0);
        detailMap[key].push({
          product_name: row.product_name as string | null,
          product_brand_name: row.product_brand_name as string | null,
          product_volume: row.product_volume as number | null,
        });
      }

      setHeaders(Array.from(headerMap.values()));
      setDetails(detailMap);
    } catch (err: any) {
      console.error("Master search failed", err);
      setError(err.message || "Failed to search invoices");
      setHeaders([]);
      setDetails({});
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
            <CardDescription>
              Search current and historical invoices by customer and product. Results are grouped by invoice.
            </CardDescription>
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
              disabled={isLoading || scopeLoading || (!customer.trim() && !product.trim())}
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
                    <th className="px-3 py-2 font-medium">Sales Exec</th>
                    <th className="px-3 py-2 font-medium text-right">Total Volume (Ltr)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || scopeLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Searching invoices...
                      </td>
                    </tr>
                  ) : headers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Enter search criteria and click search to view results.
                      </td>
                    </tr>
                  ) : (
                    headers.map((row) => (
                      <tr
                        key={row.invoice_no}
                        className="border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedInvoice(row.invoice_no)}
                      >
                        <td className="px-3 py-2 align-top text-muted-foreground">{row.invoice_date}</td>
                        <td className="px-3 py-2 align-top font-medium">{row.invoice_no}</td>
                        <td className="px-3 py-2 align-top">{row.customer_name}</td>
                        <td className="px-3 py-2 align-top text-muted-foreground">
                          {row.sales_exec_name || "-"}
                        </td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {row.total_volume.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <div className="flex items-center justify-between gap-4">
                    <DialogTitle>Invoice Details</DialogTitle>
                    <button
                      type="button"
                      className="rounded-full border border-border p-1 text-muted-foreground hover:bg-muted/60"
                      onClick={() => setSelectedInvoice(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </DialogHeader>
                {selectedInvoice && details[selectedInvoice] && (
                  <div className="mt-2 border border-border/60 rounded-md max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-card border-b border-border">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">Product</th>
                          <th className="px-3 py-2 font-medium">Brand</th>
                          <th className="px-3 py-2 font-medium text-right">Volume (Ltr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details[selectedInvoice].map((d, idx) => (
                          <tr key={idx} className="border-b border-border/40 last:border-b-0">
                            <td className="px-3 py-2 align-top">{d.product_name || "-"}</td>
                            <td className="px-3 py-2 align-top text-muted-foreground">
                              {d.product_brand_name || "-"}
                            </td>
                            <td className="px-3 py-2 align-top text-right font-medium">
                              {d.product_volume != null ? Number(d.product_volume).toFixed(2) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default MasterSearch;
