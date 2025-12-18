import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSalesExecScope } from "@/hooks/useSalesExecScope";

interface InvoiceHeaderRow {
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  sales_exec_name: string | null;
  total_volume: number;
}

interface InvoiceDetailRow {
  product_name: string | null;
  product_brand_name: string | null;
  product_volume: number | null;
}

const InvoiceSearch = () => {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [headers, setHeaders] = useState<InvoiceHeaderRow[]>([]);
  const [details, setDetails] = useState<Record<string, InvoiceDetailRow[]>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading: scopeLoading, hasAllAccess, allowedSalesExecNames } = useSalesExecScope();

  const handleSearch = async () => {
    if (!invoiceNo.trim()) return;
    setIsLoading(true);
    setError(null);
    setSelectedInvoice(null);

    try {
      const thisYear = new Date().getFullYear().toString();

      let query = supabase
        .from("invoices")
        .select(
          "invoice_no, invoice_date, customer_name, sales_exec_name, product_name, product_brand_name, product_volume"
        )
        .eq("fiscal_year", thisYear)
        .ilike("invoice_no", `%${invoiceNo.trim()}%`);

      if (!hasAllAccess && allowedSalesExecNames.length > 0) {
        query = query.in("sales_exec_name", allowedSalesExecNames);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data || [];
      if (rows.length === 0) {
        setHeaders([]);
        setDetails({});
        return;
      }

      const headerMap = new Map<string, InvoiceHeaderRow>();
      const detailMap: Record<string, InvoiceDetailRow[]> = {};

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
      console.error("Invoice search failed", err);
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
        <h1 className="text-2xl sm:text-3xl font-bold">Invoice Search</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search Current Year Invoices</CardTitle>
            <CardDescription>
              Search by invoice number. Results are grouped by invoice; click an invoice to see product-wise details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-no">Invoice Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invoice-no"
                  placeholder="Enter invoice number..."
                  className="pl-9"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSearch}
              disabled={isLoading || scopeLoading || !invoiceNo.trim()}
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
                        Enter invoice number and click search to view invoices.
                      </td>
                    </tr>
                  ) : (
                    headers.map((row) => (
                      <tr
                        key={row.invoice_no}
                        className={`border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/40 ${
                          selectedInvoice === row.invoice_no ? "bg-muted/40" : ""
                        }`}
                        onClick={() =>
                          setSelectedInvoice((prev) =>
                            prev === row.invoice_no ? null : row.invoice_no,
                          )
                        }
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

            {selectedInvoice && details[selectedInvoice] && (
              <div className="mt-4 border border-border/60 rounded-md overflow-hidden">
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default InvoiceSearch;
