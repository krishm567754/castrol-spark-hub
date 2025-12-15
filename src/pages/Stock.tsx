import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

const Stock = () => {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Stock</h1>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
            <CardDescription>Search stock items by name or code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-search">Search Stock</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stock-search"
                  placeholder="Search by item name or code..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              Upload stock data in Admin Data to view inventory
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Stock;
