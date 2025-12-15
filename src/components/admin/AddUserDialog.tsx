import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddUserDialog = ({ open, onOpenChange, onSuccess }: AddUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [hasAllAccess, setHasAllAccess] = useState(false);
  const [selectedExecs, setSelectedExecs] = useState<string[]>([]);
  const [salesExecs, setSalesExecs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSalesExecs();
    }
  }, [open]);

  const loadSalesExecs = async () => {
    const { data } = await supabase.from("sales_executives").select("*").order("name");
    if (data) setSalesExecs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });

      if (authError) throw authError;

      // Set role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role,
      });

      if (roleError) throw roleError;

      // Set sales exec access
      if (hasAllAccess) {
        const { error: accessError } = await supabase
          .from("user_sales_exec_access")
          .insert({
            user_id: authData.user.id,
            has_all_access: true,
          });
        if (accessError) throw accessError;
      } else {
        const accessRecords = selectedExecs.map((execId) => ({
          user_id: authData.user.id,
          sales_exec_id: execId,
          has_all_access: false,
        }));
        if (accessRecords.length > 0) {
          const { error: accessError } = await supabase
            .from("user_sales_exec_access")
            .insert(accessRecords);
          if (accessError) throw accessError;
        }
      }

      toast({
        title: "User Created",
        description: `Successfully created user ${username}`,
      });

      // Reset form
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("user");
      setHasAllAccess(false);
      setSelectedExecs([]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExec = (execId: string) => {
    setSelectedExecs((prev) =>
      prev.includes(execId) ? prev.filter((id) => id !== execId) : [...prev, execId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account with role and permissions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Sales Executive Access</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-access"
                checked={hasAllAccess}
                onCheckedChange={(checked) => {
                  setHasAllAccess(checked as boolean);
                  if (checked) setSelectedExecs([]);
                }}
              />
              <label htmlFor="all-access" className="text-sm font-medium">
                ALL (Full Access)
              </label>
            </div>

            {!hasAllAccess && (
              <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {salesExecs.map((exec) => (
                  <div key={exec.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={exec.id}
                      checked={selectedExecs.includes(exec.id)}
                      onCheckedChange={() => toggleExec(exec.id)}
                    />
                    <label htmlFor={exec.id} className="text-sm">
                      {exec.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
