import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const MasterSearch = () => {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Master Search</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search All Invoices</CardTitle>
            <CardDescription>Search current and historical invoices by customer and product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" placeholder="Search customer..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-brand">Product / Brand</Label>
                <Input id="product-brand" placeholder="Search product or brand..." />
              </div>
            </div>
            <Button className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload invoice data in Admin Data to search across all records
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MasterSearch;
