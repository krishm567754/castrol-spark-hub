import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Package, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const currentDate = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current, -1 = prev, -2 = 2 months ago

  const getMonthLabel = (offset: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${monthName} ${year}${offset === 0 ? " (Current)" : ""}`;
  };

  const months = [0, -1, -2].map((offset) => ({
    offset,
    label: getMonthLabel(offset),
  }));

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMonthOffset(Math.max(-2, selectedMonthOffset - 1))}
              disabled={selectedMonthOffset === -2}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[120px] text-center">
              {getMonthLabel(selectedMonthOffset)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedMonthOffset(Math.min(0, selectedMonthOffset + 1))}
              disabled={selectedMonthOffset === 0}
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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No data loaded yet</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No data loaded yet</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Orders (3d)</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Last 3 days</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock SKUs</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
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
              Select a report to view data. Upload Excel files in Admin Data to populate reports.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
