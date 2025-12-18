import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface Last7HeaderRow {
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  sales_exec_name: string | null;
  total_volume: number;
}

interface Last7DetailRow {
  product_name: string | null;
  product_brand_name: string | null;
  product_volume: number | null;
}

const Last7Days = () => {
  const [headers, setHeaders] = useState<Last7HeaderRow[]>([]);
  const [details, setDetails] = useState<Record<string, Last7DetailRow[]>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const { data, error } = await supabase
          .from("invoices")
          .select(
            "invoice_no, invoice_date, customer_name, sales_exec_name, product_name, product_brand_name, product_volume"
          )
          .gte("invoice_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("invoice_date", { ascending: false });

        if (error) throw error;

        const rows = (data || []) as Tables<"invoices">[];
        const headerMap = new Map<string, Last7HeaderRow>();
        const detailMap: Record<string, Last7DetailRow[]> = {};

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
      } catch (error) {
        console.error("Error loading last 7 days invoices", error);
        setHeaders([]);
        setDetails({});
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, []);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Billing - Last 7 Days</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Invoices from the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border/60 rounded-md overflow-hidden">
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : headers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No invoices found for the last 7 days.
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

export default Last7Days;
