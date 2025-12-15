import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

const Customers = () => {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Master</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Search Customers</CardTitle>
            <CardDescription>Search by name, code, city, or phone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-search">Customer Name / Code</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    placeholder="Search..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city-search">City</Label>
                <Input id="city-search" placeholder="Enter city..." />
              </div>
            </div>
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload customer master data in Admin Data to view customer records
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Customers;
