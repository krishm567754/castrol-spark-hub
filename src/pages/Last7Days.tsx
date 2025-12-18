import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
                    <th className="px-3 py-2 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No invoices found for the last 7 days.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/40 last:border-b-0">
                        <td className="px-3 py-2 align-top text-muted-foreground">{inv.invoice_date}</td>
                        <td className="px-3 py-2 align-top font-medium">{inv.invoice_no}</td>
                        <td className="px-3 py-2 align-top">{inv.customer_name}</td>
                        <td className="px-3 py-2 align-top text-muted-foreground">{inv.sales_exec_name}</td>
                        <td className="px-3 py-2 align-top text-right font-medium">
                          {inv.total_value != null
                            ? `₹${Number(inv.total_value).toLocaleString("en-IN", {
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

export default Last7Days;
