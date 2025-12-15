import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet } from "lucide-react";

const AdminData = () => {
  const dataCards = [
    {
      title: "Current Year Invoices",
      desc: "Invoice data for current fiscal year",
      fileName: "invoice_current.xlsx",
    },
    {
      title: "Historical Invoices (Q1)",
      desc: "Quarter 1 historical invoice data",
      fileName: "q1.xlsx",
    },
    {
      title: "Historical Invoices (Q2-Q7)",
      desc: "Additional historical quarters",
      fileName: "q2.xlsx - q7.xlsx",
    },
    {
      title: "Open Sales Orders",
      desc: "Current open orders data",
      fileName: "open_orders.xlsx",
    },
    {
      title: "Stock Data",
      desc: "Current inventory and stock levels",
      fileName: "stock.xlsx",
    },
    {
      title: "Customer Master",
      desc: "Customer details and contact info",
      fileName: "customers.xlsx",
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
            <Card key={index} className="border-border">
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
                  />
                </div>
                <Button className="w-full" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Import
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No data imported yet
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminData;
