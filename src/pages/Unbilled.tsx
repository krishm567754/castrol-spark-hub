import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface UnbilledRow {
  se: string;
  count: number;
}

interface UnbilledDetailRow {
  code: string;
  name: string;
  volume: number;
}

const Unbilled = () => {
  const [rows, setRows] = useState<UnbilledRow[]>([]);
  const [detailBySe, setDetailBySe] = useState<Record<string, UnbilledDetailRow[]>>({});
  const [selectedSe, setSelectedSe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUnbilled = async () => {
      setIsLoading(true);
      try {
        const currentDate = new Date();
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
          .toISOString()
          .split("T")[0];

        const { data: invoiceData, error: invoicesError } = await supabase
          .from("invoices")
          .select(
            "customer_code, customer_name, sales_exec_name, product_brand_name, product_name, product_volume"
          )
          .gte("invoice_date", start)
          .lt("invoice_date", end);
        if (invoicesError) throw invoicesError;

        const { data: customers, error: customersError } = await supabase
          .from("customers")
          .select("customer_code, customer_name, sales_executive");
        if (customersError) throw customersError;

        const EXCLUDED_PRODUCTS_LIST = [
          "TW SHINER SPONGE",
          "CHAIN LUBE",
          "CHAIN CLEANER",
          "BRAKE CLEANER",
          "FUELINJECT",
          "ANTI RUST LUB SPRAY",
          "THROTTLEBODYCLEANER",
          "MICRO FBR CLOTH",
          "AIOHELMET CLEANER",
          "TW SHINER 3 IN 1",
        ];
        const AUTOCARE_BRANDS_INCLUDE = ["AUTO CARE EXTERIOR", "AUTO CARE MAINTENANCE"];

        const getStr = (v: any) => (v == null ? "" : String(v).trim());
        const getNum = (v: any) => {
          const n = parseFloat(v);
          return isNaN(n) ? 0 : n;
        };
        const isAutocare = (brand: string) => {
          const b = getStr(brand).toUpperCase();
          return AUTOCARE_BRANDS_INCLUDE.some((s) => b.includes(s));
        };
        const isCoreProduct = (brand: string, productName: string) => {
          const b = getStr(brand);
          const p = getStr(productName);
          if (isAutocare(b)) return false;
          return !EXCLUDED_PRODUCTS_LIST.some((s) => p.includes(s));
        };

        const invoices = invoiceData || [];
        const coreInvoices = invoices.filter((r: any) =>
          isCoreProduct(r.product_brand_name, r.product_name)
        );

        const coreVolByCustomerCode: Record<string, number> = {};
        coreInvoices.forEach((r: any) => {
          const code = getStr(r.customer_code);
          if (!code) return;
          coreVolByCustomerCode[code] =
            (coreVolByCustomerCode[code] || 0) + getNum(r.product_volume);
        });

        const fullUnbilled = (customers || [])
          .map((c: any) => {
            const code = getStr(c.customer_code);
            return {
              code,
              name: getStr(c.customer_name),
              se: getStr(c.sales_executive),
              volume: coreVolByCustomerCode[code] || 0,
            };
          })
          .filter((c) => c.code && c.volume < 9);

        const summary: Record<string, number> = {};
        const detailMap: Record<string, UnbilledDetailRow[]> = {};
        fullUnbilled.forEach((c) => {
          if (!c.se) return;
          summary[c.se] = (summary[c.se] || 0) + 1;
          if (!detailMap[c.se]) detailMap[c.se] = [];
          detailMap[c.se].push({ code: c.code, name: c.name, volume: c.volume });
        });

        const rows: UnbilledRow[] = Object.entries(summary)
          .map(([se, count]) => ({ se, count: count as number }))
          .sort((a, b) => b.count - a.count);

        setRows(rows);
        setDetailBySe(detailMap);
      } catch (error) {
        console.error("Error loading unbilled customers", error);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUnbilled();
  }, []);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Unbilled Customers</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Customers &lt; 9L Volume (Current Month)</CardTitle>
            <CardDescription>Under-billed customers by sales executive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border/60 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Sales Executive</th>
                    <th className="px-3 py-2 font-medium text-right">Under-billed Customers</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                        Loading unbilled customers...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-8 text-center text-muted-foreground">
                        No under-billed customers found for the current month.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.se}
                        className="border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedSe(row.se)}
                      >
                        <td className="px-3 py-2 align-top">{row.se}</td>
                        <td className="px-3 py-2 align-top text-right font-medium">{row.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedSe} onOpenChange={(open) => !open && setSelectedSe(null)}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                Under-billed Customers{selectedSe ? ` - ${selectedSe}` : ""}
              </DialogTitle>
            </DialogHeader>
            {selectedSe && (
              <div className="max-h-[60vh] overflow-y-auto border border-border/60 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-card border-b border-border">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Customer Code</th>
                      <th className="px-3 py-2 font-medium">Customer Name</th>
                      <th className="px-3 py-2 font-medium text-right">Volume (Ltr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailBySe[selectedSe] || [])
                      .slice()
                      .sort((a, b) => b.volume - a.volume)
                      .map((c) => (
                        <tr
                          key={c.code}
                          className="border-b border-border/40 last:border-b-0"
                        >
                          <td className="px-3 py-2 align-top text-muted-foreground">{c.code}</td>
                          <td className="px-3 py-2 align-top">{c.name}</td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {c.volume.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Unbilled;
