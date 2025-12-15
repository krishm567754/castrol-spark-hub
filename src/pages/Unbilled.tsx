import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Unbilled = () => {
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
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload invoice data in Admin Data to see unbilled customers
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Unbilled;
