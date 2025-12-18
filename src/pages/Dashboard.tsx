import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Package, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// KPI filter config migrated from previous tool
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

const POWER1_PRODUCTS_LIST = [
  "POWER1 4T 10W-30, 10X.9L MK",
  "POWER1 4T 10W-30, 10X1L MK",
  "POWER1 4T 15W-40, 10X1L MK",
  "POWER1 CRUISE4T 20W50 10X1.2HMK",
  "POWER1 CRUISE 4T20W-50,10X1L",
  "POWER1 ULTIMATE4T10W-40,6X1LMK",
  "POWER1CRUISE4T 15W50,4X2.5L MK",
];

const ACTIV_BRANDS_INCLUDE = ["ACTIV"];
const ACTIV_BRANDS_EXCLUDE = ["ACTIV ESSENTIAL"];

const MAGNATEC_BRANDS_INCLUDE = ["MAGNATEC", "MAGNTEC SUV", "MAGNATEC DIESEL"];

const CRB_BRANDS_INCLUDE = ["CRB TURBOMAX"];

const AUTOCARE_BRANDS_INCLUDE = ["AUTO CARE EXTERIOR", "AUTO CARE MAINTENANCE"];

const getStr = (v: any) => (v == null ? "" : String(v).trim());
const getNum = (v: any) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const isActiv = (brand: string) => {
  const b = getStr(brand).toUpperCase();
  if (!b) return false;
  if (!ACTIV_BRANDS_INCLUDE.some((s) => b.includes(s))) return false;
  if (ACTIV_BRANDS_EXCLUDE.some((s) => b.includes(s))) return false;
  return true;
};

const isMagnatec = (brand: string) => {
  const b = getStr(brand).toUpperCase();
  return MAGNATEC_BRANDS_INCLUDE.some((s) => b.includes(s));
};

const isCrb = (brand: string) => {
  const b = getStr(brand).toUpperCase();
  return CRB_BRANDS_INCLUDE.some((s) => b.includes(s));
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

type ReportTable = {
  headers: string[];
  rows: (string | number)[][];
};

const Dashboard = () => {
  const currentDate = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current, -1 = prev, -2 = 2 months ago
  const [isLoading, setIsLoading] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [openOrders3d, setOpenOrders3d] = useState(0);
  const [stockSkus, setStockSkus] = useState(0);
  const [reports, setReports] = useState<Record<string, ReportTable>>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>("");

  const getMonthLabel = (offset: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${monthName} ${year}${offset === 0 ? " (Current)" : ""}`;
  };

  const getMonthDateRange = (offset: number) => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset + 1, 1);

    const toStr = (d: Date) => d.toISOString().split("T")[0];

    return {
      start: toStr(start),
      end: toStr(end),
    };
  };

  useEffect(() => {
    const loadKpis = async () => {
      setIsLoading(true);
      try {
        const { start, end } = getMonthDateRange(selectedMonthOffset);

        // Invoices for selected month (current + historical)
        const { data: invoiceData, error: invoicesError } = await supabase
          .from("invoices")
          .select(
            "invoice_date, invoice_no, customer_code, customer_name, sales_exec_name, master_brand_name, product_brand_name, product_name, product_volume, total_value"
          )
          .gte("invoice_date", start)
          .lt("invoice_date", end);

        if (invoicesError) throw invoicesError;

        const volume = (invoiceData || []).reduce((sum, row: any) => {
          const v = Number(row.product_volume) || 0;
          return sum + v;
        }, 0);

        setTotalVolume(volume);
        setTotalInvoices(invoiceData?.length || 0);

        // Build detailed KPI reports based on previous tool logic
        const reportsMap: Record<string, ReportTable> = {};
        const invoices = invoiceData || [];

        // Volume by Sales Exec
        const volBySeMap: Record<string, number> = {};
        invoices.forEach((r: any) => {
          const se = getStr(r.sales_exec_name || "Unknown");
          volBySeMap[se] = (volBySeMap[se] || 0) + getNum(r.product_volume);
        });
        reportsMap["volumeBySE"] = {
          headers: ["Sales Executive Name", "Total Volume (Ltr)"],
          rows: Object.entries(volBySeMap)
            .map(([name, vol]) => [name, Number(vol.toFixed(2))])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Activ customer count
        const activCustomerBySe: Record<string, Set<string>> = {};
        invoices
          .filter((r: any) => isActiv(r.product_brand_name))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            if (!activCustomerBySe[se]) activCustomerBySe[se] = new Set();
            activCustomerBySe[se].add(cust);
          });
        reportsMap["activCount"] = {
          headers: ["Sales Executive Name", "Unique Customer Count"],
          rows: Object.entries(activCustomerBySe)
            .map(([se, set]) => [se, (set as Set<string>).size])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Power1 customer count (exact product match)
        const power1CustomerBySe: Record<string, Set<string>> = {};
        invoices
          .filter((r: any) => POWER1_PRODUCTS_LIST.includes(getStr(r.product_name)))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            if (!power1CustomerBySe[se]) power1CustomerBySe[se] = new Set();
            power1CustomerBySe[se].add(cust);
          });
        reportsMap["power1Count"] = {
          headers: ["Sales Executive Name", "Unique Customer Count"],
          rows: Object.entries(power1CustomerBySe)
            .map(([se, set]) => [se, (set as Set<string>).size])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Magnatec customer count
        const magnatecCustomerBySe: Record<string, Set<string>> = {};
        invoices
          .filter((r: any) => isMagnatec(r.product_brand_name))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            if (!magnatecCustomerBySe[se]) magnatecCustomerBySe[se] = new Set();
            magnatecCustomerBySe[se].add(cust);
          });
        reportsMap["magnatecCount"] = {
          headers: ["Sales Executive Name", "Unique Customer Count"],
          rows: Object.entries(magnatecCustomerBySe)
            .map(([se, set]) => [se, (set as Set<string>).size])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // CRB Turbomax customer count
        const crbCustomerBySe: Record<string, Set<string>> = {};
        invoices
          .filter((r: any) => isCrb(r.product_brand_name))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            if (!crbCustomerBySe[se]) crbCustomerBySe[se] = new Set();
            crbCustomerBySe[se].add(cust);
          });
        reportsMap["crbCount"] = {
          headers: ["Sales Executive Name", "Unique Customer Count"],
          rows: Object.entries(crbCustomerBySe)
            .map(([se, set]) => [se, (set as Set<string>).size])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Core products (non-autocare, non-excluded) for high volume / unbilled
        const coreInvoices = invoices.filter((r: any) =>
          isCoreProduct(r.product_brand_name, r.product_name)
        );

        // High volume count (>=9L per SE+Customer)
        const customerCoreVol: Record<string, number> = {};
        coreInvoices.forEach((r: any) => {
          const key = `${getStr(r.sales_exec_name)}|${getStr(
            r.customer_name
          )}`;
          customerCoreVol[key] = (customerCoreVol[key] || 0) + getNum(r.product_volume);
        });
        const highVolCounts: Record<string, number> = {};
        Object.entries(customerCoreVol).forEach(([key, vol]) => {
          if (vol >= 9) {
            const se = key.split("|")[0];
            if (se) highVolCounts[se] = (highVolCounts[se] || 0) + 1;
          }
        });
        reportsMap["highVolCount"] = {
          headers: ["Sales Executive Name", "Qualified Customers (>= 9L)"],
          rows: Object.entries(highVolCounts)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Autocare count (>=5L per customer)
        const autocareVolByCustomer: Record<string, { se: string; vol: number }> = {};
        invoices
          .filter((r: any) => isAutocare(r.product_brand_name))
          .forEach((r: any) => {
            const custCode = getStr(r.customer_code);
            const se = getStr(r.sales_exec_name);
            if (!custCode) return;
            if (!autocareVolByCustomer[custCode]) {
              autocareVolByCustomer[custCode] = { se, vol: 0 };
            }
            autocareVolByCustomer[custCode].vol += getNum(r.product_volume);
          });
        const autocareCounts: Record<string, number> = {};
        Object.values(autocareVolByCustomer)
          .filter((c) => c.vol >= 5)
          .forEach((c) => {
            if (c.se) autocareCounts[c.se] = (autocareCounts[c.se] || 0) + 1;
          });
        reportsMap["autocareCount"] = {
          headers: ["Sales Executive Name", "Qualified Customers (>= 5L)"],
          rows: Object.entries(autocareCounts)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Volume by brand
        const volByBrand: Record<string, number> = {};
        invoices.forEach((r: any) => {
          const brand = getStr(r.product_brand_name || "Not Classified");
          volByBrand[brand] = (volByBrand[brand] || 0) + getNum(r.product_volume);
        });
        reportsMap["volByBrand"] = {
          headers: ["Brand Name", "Total Volume (Ltr)"],
          rows: Object.entries(volByBrand)
            .map(([name, vol]) => [name, Number(vol.toFixed(2))])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Top 10 customers by value
        const valByCustomer: Record<string, number> = {};
        invoices.forEach((r: any) => {
          const name = getStr(r.customer_name || "Unknown");
          valByCustomer[name] = (valByCustomer[name] || 0) + getNum(r.total_value);
        });
        reportsMap["topCustomers"] = {
          headers: ["Customer Name", "Total Value"],
          rows: Object.entries(valByCustomer)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 10)
            .map(([name, val]) => [
              name,
              `₹${(val as number).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]),
        };

        // Unbilled (needs customer master)
        const { data: customers, error: customersError } = await supabase
          .from("customers")
          .select("customer_code, customer_name, sales_executive");
        if (customersError) throw customersError;

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

        const unbilledSummary: Record<string, number> = {};
        fullUnbilled.forEach((c) => {
          if (c.se) unbilledSummary[c.se] = (unbilledSummary[c.se] || 0) + 1;
        });

        reportsMap["unbilled"] = {
          headers: [
            "Sales Executive Name",
            "Count of Under-Billed Customers (< 9L)",
          ],
          rows: Object.entries(unbilledSummary)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        setReports(reportsMap);

        // Open orders in last 3 days
        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const { data: ordersData, error: ordersError } = await supabase
          .from("open_orders")
          .select("id, order_date")
          .gte("order_date", threeDaysAgo.toISOString().split("T")[0]);

        if (ordersError) throw ordersError;
        setOpenOrders3d(ordersData?.length || 0);

        // Stock SKUs (number of products)
        const { data: stockData, error: stockError } = await supabase
          .from("stock")
          .select("product_code");

        if (stockError) throw stockError;

        const uniqueSkus = new Set((stockData || []).map((row: any) => row.product_code)).size;
        setStockSkus(uniqueSkus);
      } catch (error) {
        console.error("Error loading dashboard KPIs", error);
        setTotalVolume(0);
        setTotalInvoices(0);
        setOpenOrders3d(0);
        setStockSkus(0);
        setReports({});
      } finally {
        setIsLoading(false);
      }
    };

    loadKpis();
  }, [selectedMonthOffset]);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMonthOffset(Math.max(-2, selectedMonthOffset - 1))}
              disabled={selectedMonthOffset === -2 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center">
              {getMonthLabel(selectedMonthOffset)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMonthOffset(Math.min(0, selectedMonthOffset + 1))}
              disabled={selectedMonthOffset === 0 || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Volume (Ltrs)</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : totalVolume.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Selected month</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : totalInvoices.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Invoices in selected month</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Orders (3d)</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : openOrders3d.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 3 days</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock SKUs</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : stockSkus.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Items in stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Buttons */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Volume by Sales Exec</Button>
              <Button variant="outline">Weekly Sales Volume</Button>
              <Button variant="outline">'Activ' Customer Count</Button>
              <Button variant="outline">'Power1' Customer Count</Button>
              <Button variant="outline">'Magnatec' Customer Count</Button>
              <Button variant="outline">'CRB Turbomax' Count</Button>
              <Button variant="outline">High-Volume Customers</Button>
              <Button variant="outline">Autocare Count</Button>
              <Button variant="outline">Volume by Brand</Button>
              <Button variant="outline">Top 10 Customers</Button>
            </div>
            <div className="mt-6 p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload Excel files in Admin Data to populate reports, then select a report to view details.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
