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

const PAGE_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "unbilled", label: "Unbilled" },
  { key: "open_orders", label: "Open Orders" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "invoice_search", label: "Invoice Search" },
  { key: "master_search", label: "Master Search" },
  { key: "stock", label: "Stock" },
  { key: "customers", label: "Customers" },
  { key: "wbc_report", label: "WBC Report" },
];

export const AddUserDialog = ({ open, onOpenChange, onSuccess }: AddUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [hasAllAccess, setHasAllAccess] = useState(false);
  const [selectedExecs, setSelectedExecs] = useState<string[]>([]);
  const [salesExecs, setSalesExecs] = useState<any[]>([]);
  const [allPages, setAllPages] = useState(true);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSalesExecs();
    }
  }, [open]);

  const loadSalesExecs = async () => {
    // First load any existing sales executives
    const { data: existingExecs, error: execError } = await supabase
      .from("sales_executives")
      .select("id, name");

    if (execError) {
      console.error("Failed to load sales executives", execError);
      return;
    }

    const byName = new Map<string, { id: string; name: string }>();
    (existingExecs || []).forEach((e: any) => {
      byName.set(String(e.name).trim().toUpperCase(), e);
    });

    // Discover sales executives from invoice data
    const { data: invoiceExecs, error: invError } = await supabase
      .from("invoices")
      .select("sales_exec_name")
      .not("sales_exec_name", "is", null);

    if (invError) {
      console.error("Failed to load sales execs from invoices", invError);
    }

    const newExecNames: string[] = [];
    (invoiceExecs || []).forEach((row: any) => {
      const raw = String(row.sales_exec_name || "").trim();
      if (!raw) return;
      const key = raw.toUpperCase();
      if (!byName.has(key)) {
        byName.set(key, { id: "", name: raw });
        newExecNames.push(raw);
      }
    });

    // Insert any newly discovered execs so they can be reused elsewhere
    if (newExecNames.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("sales_executives")
        .insert(newExecNames.map((name) => ({ name })))
        .select("id, name");

      if (insertError) {
        console.error("Failed to insert discovered sales executives", insertError);
      } else if (inserted) {
        inserted.forEach((e: any) => {
          byName.set(String(e.name).trim().toUpperCase(), e);
        });
      }
    }

    const allExecs = Array.from(byName.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setSalesExecs(allExecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email,
          password,
          username,
          role,
          hasAllAccess,
          selectedExecs,
          allPages,
          selectedPages,
        },
      });

      const backendMessage =
        (data && (data as any).error) ||
        (error as any)?.context?.error?.message ||
        (error as any)?.message;

      if (error || backendMessage) {
        throw new Error(
          backendMessage ||
            "Something went wrong while creating the user. Please try again."
        );
      }

      toast({
        title: "User Created",
        description: `Successfully created user ${username}`,
      });

      setEmail("");
      setUsername("");
      setPassword("");
      setRole("user");
      setHasAllAccess(false);
      setSelectedExecs([]);
      setAllPages(true);
      setSelectedPages([]);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create user", error);
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description:
          error?.message ===
          "new row violates row-level security policy for table \"user_roles\""
            ? "You are not allowed to create users. Only admins can create users."
            : error.message || "Something went wrong while creating the user.",
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

          <div className="space-y-3">
            <Label>Page Access</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-pages"
                checked={allPages}
                onCheckedChange={(checked) => {
                  setAllPages(checked as boolean);
                  if (checked) setSelectedPages([]);
                }}
              />
              <label htmlFor="all-pages" className="text-sm font-medium">
                ALL Pages
              </label>
            </div>

            {!allPages && (
              <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {PAGE_OPTIONS.map((page) => (
                  <div key={page.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={page.key}
                      checked={selectedPages.includes(page.key)}
                      onCheckedChange={() =>
                        setSelectedPages((prev) =>
                          prev.includes(page.key)
                            ? prev.filter((p) => p !== page.key)
                            : [...prev, page.key]
                        )
                      }
                    />
                    <label htmlFor={page.key} className="text-sm">
                      {page.label}
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
