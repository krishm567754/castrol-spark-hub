import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useExcelUpload } from "@/hooks/useExcelUpload";
import { supabase } from "@/integrations/supabase/client";

const AdminData = () => {
  const {
    isUploading,
    uploadInvoices,
    uploadCustomers,
    uploadStock,
    uploadOpenOrders,
    clearInvoices,
    clearCustomers,
    clearStock,
    clearOpenOrders,
  } = useExcelUpload();
  const [uploadCounts, setUploadCounts] = useState<Record<string, number>>({});
  const [datasetCounts, setDatasetCounts] = useState<{
    invoicesCurrent: number;
    invoicesHistorical: number;
    customers: number;
    stock: number;
    openOrders: number;
  }>({ invoicesCurrent: 0, invoicesHistorical: 0, customers: 0, stock: 0, openOrders: 0 });

  const refreshDatasetCounts = async () => {
    const [currentInv, historicalInv, customers, stock, openOrders] = await Promise.all([
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("is_current_year", true),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("is_current_year", false),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("stock").select("id", { count: "exact", head: true }),
      supabase.from("open_orders").select("id", { count: "exact", head: true }),
    ]);

    setDatasetCounts({
      invoicesCurrent: currentInv.count || 0,
      invoicesHistorical: historicalInv.count || 0,
      customers: customers.count || 0,
      stock: stock.count || 0,
      openOrders: openOrders.count || 0,
    });
  };

  useEffect(() => {
    refreshDatasetCounts();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string,
    isCurrentYear: boolean = true
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let count = 0;
      switch (type) {
        case "current":
          count = await uploadInvoices(file, true);
          break;
        case "historical":
          count = await uploadInvoices(file, false);
          break;
        case "customers":
          count = await uploadCustomers(file);
          break;
        case "stock":
          count = await uploadStock(file);
          break;
        case "orders":
          count = await uploadOpenOrders(file);
          break;
      }
      setUploadCounts((prev) => ({ ...prev, [type]: count }));
      await refreshDatasetCounts();
      // Reset input
      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const dataCards = [
    {
      title: "Current Year Invoices",
      desc: "Invoice data for current fiscal year",
      fileName: "invoice_current.xlsx",
      type: "current",
      clearLabel: "Clear current year invoices",
    },
    {
      title: "Historical Invoices (Q1-Q7)",
      desc: "Past quarter invoice data",
      fileName: "q1.xlsx, q2.xlsx, etc.",
      type: "historical",
      clearLabel: "Clear historical invoices",
    },
    {
      title: "Open Sales Orders",
      desc: "Current open orders data",
      fileName: "open_orders.xlsx",
      type: "orders",
      clearLabel: "Clear open orders",
    },
    {
      title: "Stock Data",
      desc: "Current inventory and stock levels",
      fileName: "stock.xlsx",
      type: "stock",
      clearLabel: "Clear stock data",
    },
    {
      title: "Customer Master",
      desc: "Customer details and contact info",
      fileName: "customers.xlsx",
      type: "customers",
      clearLabel: "Clear customer data",
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Data Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage Excel data sources</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataCards.map((card, index) => (
            <Card key={index} className="border-border flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`file-${index}`} className="text-xs text-muted-foreground">
                    Expected: {card.fileName}
                  </Label>
                  <Input
                    id={`file-${index}`}
                    type="file"
                    accept=".xlsx,.xls"
                    className="cursor-pointer"
                    onChange={(e) => handleFileUpload(e, card.type)}
                    disabled={isUploading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="w-full" size="sm" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload & Import
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center">
                  {uploadCounts[card.type] ? (
                    <span className="text-primary font-medium">
                      ✓ {uploadCounts[card.type]} rows imported
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No data imported yet</span>
                  )}
                 </p>
               </CardContent>
             </Card>
           ))}
         </div>

         <Card className="border-border">
           <CardHeader>
             <CardTitle>Loaded Data Overview</CardTitle>
             <CardDescription>See which datasets are loaded and clear them if needed</CardDescription>
           </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Current Year Invoices</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {datasetCounts.invoicesCurrent.toLocaleString()} rows
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={async () => {
                      await clearInvoices(true);
                      await refreshDatasetCounts();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Historical Invoices</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {datasetCounts.invoicesHistorical.toLocaleString()} rows
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={async () => {
                      await clearInvoices(false);
                      await refreshDatasetCounts();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer Master</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {datasetCounts.customers.toLocaleString()} rows
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={async () => {
                      await clearCustomers();
                      await refreshDatasetCounts();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Stock</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {datasetCounts.stock.toLocaleString()} rows
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={async () => {
                      await clearStock();
                      await refreshDatasetCounts();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Open Orders</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {datasetCounts.openOrders.toLocaleString()} rows
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={async () => {
                      await clearOpenOrders();
                      await refreshDatasetCounts();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
};

export default AdminData;
