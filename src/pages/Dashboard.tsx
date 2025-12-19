import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Package, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSalesExecScope } from "@/hooks/useSalesExecScope";

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

type KpiConfigSummary = {
  id: string;
  name: string;
  short_key: string;
  is_active: boolean | null;
};

const Dashboard = () => {
  const currentDate = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current, -1 = prev, -2 = 2 months ago
  const [isLoading, setIsLoading] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [reports, setReports] = useState<Record<string, ReportTable>>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>("");
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [unbilledDetailsBySe, setUnbilledDetailsBySe] = useState<Record<string, { code: string; name: string; volume: number }[]>>({});
  const [drilldownTitle, setDrilldownTitle] = useState<string>("");
  const [drilldownItems, setDrilldownItems] = useState<{ label: string; value: number }[]>([]);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [kpiConfigsByKey, setKpiConfigsByKey] = useState<Record<string, KpiConfigSummary>>({});
  const { loading: scopeLoading, hasAllAccess, allowedSalesExecNames } = useSalesExecScope();

  const getMonthLabel = (offset: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${monthName} ${year}${offset === 0 ? " (Current)" : ""}`;
  };

  const getMonthDateRange = (offset: number) => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset + 1, 1);

    const toStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      start: toStr(start),
      end: toStr(end),
    };
  };

  useEffect(() => {
    if (scopeLoading) return;

    const loadKpis = async () => {
      setIsLoading(true);
      try {
        const { start, end } = getMonthDateRange(selectedMonthOffset);

        let invoiceQuery = supabase
          .from("invoices")
          .select(
            "invoice_date, invoice_no, customer_code, customer_name, sales_exec_name, master_brand_name, product_brand_name, product_name, product_volume, total_value"
          )
          .gte("invoice_date", start)
          .lt("invoice_date", end);

        if (!hasAllAccess && allowedSalesExecNames.length > 0) {
          invoiceQuery = invoiceQuery.in("sales_exec_name", allowedSalesExecNames);
        }

        const { data: invoiceData, error: invoicesError } = await invoiceQuery.range(0, 9999);
        if (invoicesError) throw invoicesError;

        const { data: kpiConfigs, error: kpiConfigsError } = await supabase
          .from("kpi_configs")
          .select("id, name, short_key, is_active");
        if (kpiConfigsError) {
          console.error("Error loading KPI configs for dashboard", kpiConfigsError);
        } else {
          const byKey: Record<string, KpiConfigSummary> = {};
          (kpiConfigs || []).forEach((cfg: any) => {
            if (cfg.short_key) {
              byKey[cfg.short_key] = {
                id: cfg.id,
                name: cfg.name,
                short_key: cfg.short_key,
                is_active: cfg.is_active,
              };
            }
          });
          setKpiConfigsByKey(byKey);
        }

        const volume = (invoiceData || []).reduce((sum, row: any) => {
          const v = Number(row.product_volume) || 0;
          return sum + v;
        }, 0);

        setTotalVolume(volume);

        // Build detailed KPI reports based on previous tool logic
        const reportsMap: Record<string, ReportTable> = {};
        const invoices = invoiceData || [];
        const kpiInvoices = invoices.filter(
          (r: any) => !EXCLUDED_PRODUCTS_LIST.some((s) => getStr(r.product_name).includes(s))
        );
        setRawInvoices(kpiInvoices);

        // Volume by Sales Exec
        const volBySeMap: Record<string, number> = {};
        kpiInvoices.forEach((r: any) => {
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
        kpiInvoices
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

        // Power1 customer count (>= 5L per customer)
        const power1VolByCustomer: Record<string, number> = {};
        kpiInvoices
          .filter((r: any) => POWER1_PRODUCTS_LIST.includes(getStr(r.product_name)))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            const key = `${se}|${cust}`;
            power1VolByCustomer[key] = (power1VolByCustomer[key] || 0) + getNum(r.product_volume);
          });
        const power1QualifiedCounts: Record<string, number> = {};
        Object.entries(power1VolByCustomer).forEach(([key, vol]) => {
          if (vol >= 5) {
            const se = key.split("|")[0] || "";
            if (se) power1QualifiedCounts[se] = (power1QualifiedCounts[se] || 0) + 1;
          }
        });
        reportsMap["power1Count"] = {
          headers: ["Sales Executive Name", "Customers ≥ 5L"],
          rows: Object.entries(power1QualifiedCounts)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Magnatec customer count (>= 5L per customer)
        const magnatecVolByCustomer: Record<string, number> = {};
        kpiInvoices
          .filter((r: any) => isMagnatec(r.product_brand_name))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            const key = `${se}|${cust}`;
            magnatecVolByCustomer[key] = (magnatecVolByCustomer[key] || 0) + getNum(r.product_volume);
          });
        const magnatecQualifiedCounts: Record<string, number> = {};
        Object.entries(magnatecVolByCustomer).forEach(([key, vol]) => {
          if (vol >= 5) {
            const se = key.split("|")[0] || "";
            if (se)
              magnatecQualifiedCounts[se] = (magnatecQualifiedCounts[se] || 0) + 1;
          }
        });
        reportsMap["magnatecCount"] = {
          headers: ["Sales Executive Name", "Customers ≥ 5L"],
          rows: Object.entries(magnatecQualifiedCounts)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // CRB Turbomax customer count (>= 5L per customer)
        const crbVolByCustomer: Record<string, number> = {};
        kpiInvoices
          .filter((r: any) => isCrb(r.product_brand_name))
          .forEach((r: any) => {
            const se = getStr(r.sales_exec_name || "");
            const cust = getStr(r.customer_code || r.customer_name);
            if (!se || !cust) return;
            const key = `${se}|${cust}`;
            crbVolByCustomer[key] = (crbVolByCustomer[key] || 0) + getNum(r.product_volume);
          });
        const crbQualifiedCounts: Record<string, number> = {};
        Object.entries(crbVolByCustomer).forEach(([key, vol]) => {
          if (vol >= 5) {
            const se = key.split("|")[0] || "";
            if (se) crbQualifiedCounts[se] = (crbQualifiedCounts[se] || 0) + 1;
          }
        });
        reportsMap["crbCount"] = {
          headers: ["Sales Executive Name", "Customers ≥ 5L"],
          rows: Object.entries(crbQualifiedCounts)
            .map(([se, count]) => [se, count])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };

        // Core products (non-autocare, non-excluded) for high volume / unbilled
        const coreInvoices = kpiInvoices.filter((r: any) =>
          isCoreProduct(r.product_brand_name, r.product_name)
        );

        // High volume count (>=9L per SE+Customer)
        const customerCoreVol: Record<string, number> = {};
        coreInvoices.forEach((r: any) => {
          const key = `${getStr(r.sales_exec_name)}|${getStr(r.customer_name)}`;
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

        // Autocare count (>=5L per customer, per Sales Exec)
        const autocareVolByCustomer: Record<string, { se: string; name: string; vol: number }> = {};
        kpiInvoices
          .filter((r: any) => isAutocare(r.product_brand_name))
          .forEach((r: any) => {
            const custCode = getStr(r.customer_code);
            const custName = getStr(r.customer_name);
            const se = getStr(r.sales_exec_name);
            if (!se || (!custCode && !custName)) return;
            const key = `${se}|${custCode || custName}`;
            if (!autocareVolByCustomer[key]) {
              autocareVolByCustomer[key] = { se, name: custName || custCode, vol: 0 };
            }
            autocareVolByCustomer[key].vol += getNum(r.product_volume);
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

        // Volume by brand and weekly sales
        const volByBrand: Record<string, number> = {};
        const volByWeek: Record<string, number> = {};
        kpiInvoices.forEach((r: any) => {
          const brand = getStr(r.product_brand_name || "Not Classified");
          volByBrand[brand] = (volByBrand[brand] || 0) + getNum(r.product_volume);

          const d = new Date(r.invoice_date);
          if (!isNaN(d.getTime())) {
            const weekday = d.getDay();
            const diffToMonday = (weekday + 6) % 7; // 0 for Monday
            const monday = new Date(d);
            monday.setDate(d.getDate() - diffToMonday);
            const label = `Week of ${monday.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}`;
            volByWeek[label] = (volByWeek[label] || 0) + getNum(r.product_volume);
          }
        });
        reportsMap["volByBrand"] = {
          headers: ["Brand Name", "Total Volume (Ltr)"],
          rows: Object.entries(volByBrand)
            .map(([name, vol]) => [name, Number((vol as number).toFixed(2))])
            .sort((a, b) => (b[1] as number) - (a[1] as number)),
        };
        reportsMap["weeklySales"] = {
          headers: ["Week", "Total Volume (Ltr)"],
          rows: Object.entries(volByWeek)
            .map(([week, vol]) => [week, Number((vol as number).toFixed(2))])
            .sort((a, b) => (a[0] as string).localeCompare(b[0] as string)),
        };

        // Top 10 customers by value
        const valByCustomer: Record<string, number> = {};
        kpiInvoices.forEach((r: any) => {
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
        let customersQuery = supabase
          .from("customers")
          .select("customer_code, customer_name, sales_executive");

        if (!hasAllAccess && allowedSalesExecNames.length > 0) {
          customersQuery = customersQuery.in("sales_executive", allowedSalesExecNames);
        }

        const { data: customers, error: customersError } = await customersQuery;
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
        const unbilledDetailMap: Record<string, { code: string; name: string; volume: number }[]> = {};
        fullUnbilled.forEach((c) => {
          if (c.se) {
            unbilledSummary[c.se] = (unbilledSummary[c.se] || 0) + 1;
            if (!unbilledDetailMap[c.se]) unbilledDetailMap[c.se] = [];
            unbilledDetailMap[c.se].push({ code: c.code, name: c.name, volume: c.volume });
          }
        });
        setUnbilledDetailsBySe(unbilledDetailMap);

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
      } catch (error) {
        console.error("Error loading dashboard KPIs", error);
        setTotalVolume(0);
        setReports({});
      } finally {
        setIsLoading(false);
      }
    };

    loadKpis();
  }, [selectedMonthOffset, scopeLoading, hasAllAccess, allowedSalesExecNames]);

  const getKpiName = (shortKey: string, defaultLabel: string) =>
    kpiConfigsByKey[shortKey]?.name || defaultLabel;

  const isKpiVisible = (shortKey: string) => {
    const cfg = kpiConfigsByKey[shortKey];
    if (!cfg) return true;
    return cfg.is_active !== false;
  };


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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {/* Report Buttons */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {isKpiVisible("volumeBySE") && (
                <Button
                  variant={selectedReport === "volumeBySE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("volumeBySE");
                    setReportTitle(getKpiName("volumeBySE", "Volume by Sales Exec"));
                  }}
                >
                  {getKpiName("volumeBySE", "Volume by Sales Exec")}
                </Button>
              )}
              {isKpiVisible("activCount") && (
                <Button
                  variant={selectedReport === "activCount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("activCount");
                    setReportTitle(getKpiName("activCount", "'Activ' Customer Count"));
                  }}
                >
                  {getKpiName("activCount", "'Activ' Customer Count")}
                </Button>
              )}
              {isKpiVisible("power1Count") && (
                <Button
                  variant={selectedReport === "power1Count" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("power1Count");
                    setReportTitle(getKpiName("power1Count", "'Power1' Customers ≥ 5L"));
                  }}
                >
                  {getKpiName("power1Count", "Power1 ≥ 5L")}
                </Button>
              )}
              {isKpiVisible("magnatecCount") && (
                <Button
                  variant={selectedReport === "magnatecCount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("magnatecCount");
                    setReportTitle(getKpiName("magnatecCount", "'Magnatec' Customers ≥ 5L"));
                  }}
                >
                  {getKpiName("magnatecCount", "Magnatec ≥ 5L")}
                </Button>
              )}
              {isKpiVisible("crbCount") && (
                <Button
                  variant={selectedReport === "crbCount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("crbCount");
                    setReportTitle(getKpiName("crbCount", "'CRB Turbomax' Count"));
                  }}
                >
                  {getKpiName("crbCount", "'CRB Turbomax' Count")}
                </Button>
              )}
              {isKpiVisible("highVolCount") && (
                <Button
                  variant={selectedReport === "highVolCount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("highVolCount");
                    setReportTitle(getKpiName("highVolCount", "High-Volume Core Customers (≥ 9L)"));
                  }}
                >
                  {getKpiName("highVolCount", "High-Volume Customers")}
                </Button>
              )}
              {isKpiVisible("autocareCount") && (
                <Button
                  variant={selectedReport === "autocareCount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("autocareCount");
                    setReportTitle(getKpiName("autocareCount", "Autocare Customers (>= 5L)"));
                  }}
                >
                  {getKpiName("autocareCount", "Autocare Count")}
                </Button>
              )}
              {isKpiVisible("weeklySales") && (
                <Button
                  variant={selectedReport === "weeklySales" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("weeklySales");
                    setReportTitle(getKpiName("weeklySales", "Weekly Sales Volume"));
                  }}
                >
                  {getKpiName("weeklySales", "Weekly Sales")}
                </Button>
              )}
              {isKpiVisible("volByBrand") && (
                <Button
                  variant={selectedReport === "volByBrand" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("volByBrand");
                    setReportTitle(getKpiName("volByBrand", "Volume by Brand"));
                  }}
                >
                  {getKpiName("volByBrand", "Volume by Brand")}
                </Button>
              )}
              {isKpiVisible("topCustomers") && (
                <Button
                  variant={selectedReport === "topCustomers" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("topCustomers");
                    setReportTitle(getKpiName("topCustomers", "Top 10 Customers"));
                  }}
                >
                  {getKpiName("topCustomers", "Top 10 Customers")}
                </Button>
              )}
              {isKpiVisible("unbilled") && (
                <Button
                  variant={selectedReport === "unbilled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedReport("unbilled");
                    setReportTitle(getKpiName("unbilled", "Unbilled Customers (< 9L)"));
                  }}
                >
                  {getKpiName("unbilled", "Unbilled Customers")}
                </Button>
              )}
            </div>

            {selectedReport && reports[selectedReport] && reports[selectedReport].rows.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold">{reportTitle}</h2>
                  <span className="text-xs text-muted-foreground">
                    Total:{" "}
                    {reports[selectedReport].rows
                      .reduce((sum, row) => {
                        const val = row[row.length - 1];
                        const num =
                          typeof val === "number"
                            ? val
                            : parseFloat(String(val).replace(/[^0-9.-]/g, ""));
                        return sum + (isNaN(num) ? 0 : num);
                      }, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-md border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-card border-b border-border">
                      <tr className="text-left">
                        {reports[selectedReport].headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports[selectedReport].rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border/40 last:border-b-0 hover:bg-muted/40 cursor-pointer"
                          onClick={() => {
                            const se = String(row[0] ?? "");
                            if (!se) return;

                            const items: { label: string; value: number }[] = [];

                            const pushItem = (label: string, value: number) => {
                              if (!label) return;
                              const existing = items.find((i) => i.label === label);
                              if (existing) {
                                existing.value += value;
                              } else {
                                items.push({ label, value });
                              }
                            };

                            const buildCoreKey = (r: any) =>
                              `${getStr(r.sales_exec_name)}|${getStr(r.customer_name)}`;

                            switch (selectedReport) {
                              case "volumeBySE":
                                rawInvoices.forEach((r: any) => {
                                  if (getStr(r.sales_exec_name) === se) {
                                    pushItem(
                                      getStr(r.customer_name),
                                      getNum(r.product_volume)
                                    );
                                  }
                                });
                                setDrilldownTitle(`Customers for ${se}`);
                                break;
                              case "activCount":
                                rawInvoices
                                  .filter((r: any) => isActiv(r.product_brand_name))
                                  .forEach((r: any) => {
                                    if (getStr(r.sales_exec_name) === se) {
                                      pushItem(
                                        getStr(r.customer_name),
                                        getNum(r.product_volume)
                                      );
                                    }
                                  });
                                setDrilldownTitle(`'Activ' customers for ${se}`);
                                break;
                              case "power1Count": {
                                const power1VolByCustomer: Record<string, { name: string; vol: number }> = {};
                                rawInvoices
                                  .filter((r: any) =>
                                    POWER1_PRODUCTS_LIST.includes(getStr(r.product_name))
                                  )
                                  .forEach((r: any) => {
                                    if (getStr(r.sales_exec_name) !== se) return;
                                    const custCode = getStr(r.customer_code);
                                    const custName = getStr(r.customer_name);
                                    if (!custCode && !custName) return;
                                    const key = custCode || custName;
                                    if (!power1VolByCustomer[key]) {
                                      power1VolByCustomer[key] = {
                                        name: custName || custCode,
                                        vol: 0,
                                      };
                                    }
                                    power1VolByCustomer[key].vol += getNum(r.product_volume);
                                  });
                                Object.values(power1VolByCustomer).forEach((entry) => {
                                  if (entry.vol > 0) {
                                    pushItem(entry.name, entry.vol);
                                  }
                                });
                                setDrilldownTitle(`'Power1' customers (all, KPI counts ≥ 5L) for ${se}`);
                                break;
                              }
                              case "magnatecCount": {
                                const magnatecVolByCustomer: Record<string, { name: string; vol: number }> = {};
                                rawInvoices
                                  .filter((r: any) => isMagnatec(r.product_brand_name))
                                  .forEach((r: any) => {
                                    if (getStr(r.sales_exec_name) !== se) return;
                                    const custCode = getStr(r.customer_code);
                                    const custName = getStr(r.customer_name);
                                    if (!custCode && !custName) return;
                                    const key = custCode || custName;
                                    if (!magnatecVolByCustomer[key]) {
                                      magnatecVolByCustomer[key] = {
                                        name: custName || custCode,
                                        vol: 0,
                                      };
                                    }
                                    magnatecVolByCustomer[key].vol += getNum(r.product_volume);
                                  });
                                Object.values(magnatecVolByCustomer).forEach((entry) => {
                                  if (entry.vol > 0) {
                                    pushItem(entry.name, entry.vol);
                                  }
                                });
                                setDrilldownTitle(`'Magnatec' customers (all, KPI counts ≥ 5L) for ${se}`);
                                break;
                              }
                              case "crbCount": {
                                const crbVolByCustomer: Record<string, { name: string; vol: number }> = {};
                                rawInvoices
                                  .filter((r: any) => isCrb(r.product_brand_name))
                                  .forEach((r: any) => {
                                    if (getStr(r.sales_exec_name) !== se) return;
                                    const custCode = getStr(r.customer_code);
                                    const custName = getStr(r.customer_name);
                                    if (!custCode && !custName) return;
                                    const key = custCode || custName;
                                    if (!crbVolByCustomer[key]) {
                                      crbVolByCustomer[key] = {
                                        name: custName || custCode,
                                        vol: 0,
                                      };
                                    }
                                    crbVolByCustomer[key].vol += getNum(r.product_volume);
                                  });
                                Object.values(crbVolByCustomer).forEach((entry) => {
                                  if (entry.vol > 0) {
                                    pushItem(entry.name, entry.vol);
                                  }
                                });
                                setDrilldownTitle(`'CRB Turbomax' customers (all, KPI counts ≥ 5L) for ${se}`);
                                break;
                              }
                              case "highVolCount": {
                                const customerCoreVol: Record<string, number> = {};
                                rawInvoices
                                  .filter((r: any) =>
                                    isCoreProduct(
                                      r.product_brand_name,
                                      r.product_name
                                    )
                                  )
                                  .forEach((r: any) => {
                                    const key = buildCoreKey(r);
                                    if (!key.startsWith(`${se}|`)) return;
                                    customerCoreVol[key] =
                                      (customerCoreVol[key] || 0) +
                                      getNum(r.product_volume);
                                  });
                                Object.entries(customerCoreVol).forEach(
                                  ([key, vol]) => {
                                    if (vol >= 9) {
                                      const label = key.split("|")[1] || "";
                                      pushItem(label, vol);
                                    }
                                  }
                                );
                                setDrilldownTitle(
                                  `High-volume customers (>= 9L) for ${se}`
                                );
                                break;
                              }
                              case "autocareCount": {
                                const autocareVolByCustomer: Record<string, { name: string; vol: number }> = {};
                                rawInvoices
                                  .filter((r: any) => isAutocare(r.product_brand_name))
                                  .forEach((r: any) => {
                                    if (getStr(r.sales_exec_name) !== se) return;
                                    const custCode = getStr(r.customer_code);
                                    const custName = getStr(r.customer_name);
                                    if (!custCode && !custName) return;
                                    const key = custCode || custName;
                                    if (!autocareVolByCustomer[key]) {
                                      autocareVolByCustomer[key] = { name: custName || custCode, vol: 0 };
                                    }
                                    autocareVolByCustomer[key].vol += getNum(r.product_volume);
                                  });
                                Object.values(autocareVolByCustomer)
                                  .filter((entry) => entry.vol > 0)
                                  .forEach((entry) => {
                                    pushItem(entry.name, entry.vol);
                                  });
                                setDrilldownTitle(
                                  `Autocare customers (all, KPI counts ≥ 5L) for ${se}`
                                );
                                break;
                              }
                              case "unbilled": {
                                const details = unbilledDetailsBySe[se] || [];
                                details.forEach((d) => {
                                  pushItem(`${d.name} (${d.code})`, d.volume);
                                });
                                setDrilldownTitle(
                                  `Under-billed customers (< 9L) for ${se}`
                                );
                                break;
                              }
                              default:
                                return;
                            }

                            items.sort((a, b) => b.value - a.value);
                            setDrilldownItems(items);
                            setDrilldownOpen(true);
                          }}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-3 py-2 align-top text-sm text-muted-foreground"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
                  <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>{drilldownTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto border border-border/60 rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-card border-b border-border">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium">Customer</th>
                            <th className="px-3 py-2 font-medium text-right">Volume (Ltr)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drilldownItems.map((item) => (
                            <tr
                              key={item.label}
                              className="border-b border-border/40 last:border-b-0"
                            >
                              <td className="px-3 py-2 align-top">{item.label}</td>
                              <td className="px-3 py-2 align-top text-right font-medium">
                                {item.value.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="mt-2 p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                Upload Excel files in Admin Data to populate reports, then select a report to view details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
