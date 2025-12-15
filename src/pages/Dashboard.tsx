import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Package, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const currentDate = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current, -1 = prev, -2 = 2 months ago
  const [isLoading, setIsLoading] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [openOrders3d, setOpenOrders3d] = useState(0);
  const [stockSkus, setStockSkus] = useState(0);

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
          .select("product_volume, total_value, invoice_date")
          .gte("invoice_date", start)
          .lt("invoice_date", end);

        if (invoicesError) throw invoicesError;

        const volume = (invoiceData || []).reduce((sum, row: any) => {
          const v = Number(row.product_volume) || 0;
          return sum + v;
        }, 0);

        setTotalVolume(volume);
        setTotalInvoices(invoiceData?.length || 0);

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
