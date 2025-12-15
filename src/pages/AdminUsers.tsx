import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2 } from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: access } = await supabase
      .from("user_sales_exec_access")
      .select("*, sales_executives(name)");

    if (profiles && roles) {
      const combined = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        const userAccess = access?.filter((a) => a.user_id === profile.id);
        const hasAll = userAccess?.some((a) => a.has_all_access);
        const execNames = hasAll
          ? "ALL"
          : userAccess
              ?.map((a) => a.sales_executives?.name)
              .filter(Boolean)
              .join(", ");

        return {
          ...profile,
          role: userRole?.role || "user",
          scope: execNames || "None",
        };
      });
      setUsers(combined);
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "User Deleted",
        description: "User account removed successfully",
      });
      loadUsers();
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage users, roles, and sales executive access</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
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
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sales Exec Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.scope}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddUserDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadUsers}
      />
    </AppLayout>
  );
};

export default AdminUsers;
