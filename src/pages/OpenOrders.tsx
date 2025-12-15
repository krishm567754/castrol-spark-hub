import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OpenOrders = () => {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Open Orders</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Orders from Last 3 Days</CardTitle>
            <CardDescription>Recent open sales orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload open orders data in Admin Data to see recent orders
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default OpenOrders;
