import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const AdminUsers = () => {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage users, roles, and sales executive access</p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>All registered users and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              User management interface will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
