import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Last7Days = () => {
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
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload invoice data in Admin Data to see recent billing
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Last7Days;
