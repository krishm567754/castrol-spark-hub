import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface KpiConfig {
  id: string;
  name: string;
  short_key: string;
  kpi_type: string;
  field_name: string;
  operator: string;
  field_value: string;
  aggregation_type: string;
  icon_name: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

const emptyForm = {
  name: "",
  short_key: "",
  kpi_type: "",
  field_name: "",
  operator: "",
  field_value: "",
  aggregation_type: "",
  icon_name: "",
  display_order: "",
  is_active: true,
};

const KpiAdmin = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<KpiConfig[]>([]);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kpi_configs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading KPI configs", error);
      toast({
        variant: "destructive",
        title: "Failed to load",
        description: error.message,
      });
      setLoading(false);
      return [] as KpiConfig[];
    }

    const typed = (data || []) as KpiConfig[];
    setConfigs(typed);
    setLoading(false);
    return typed;
  };

  const seedDefaultKpis = async () => {
    if (!isAdmin) return;

    const defaults = [
      {
        name: "Volume by Sales Exec",
        short_key: "volumeBySE",
        kpi_type: "volume",
        field_name: "product_volume",
        operator: "> 0",
        field_value: "0",
        aggregation_type: "sum_by_sales_exec",
        icon_name: "BarChart3",
        display_order: 1,
        is_active: true,
      },
      {
        name: "'Activ' Customer Count",
        short_key: "activCount",
        kpi_type: "customer_count",
        field_name: "product_brand_name",
        operator: "brand = ACTIV (excl. ESSENTIAL)",
        field_value: "ACTIV",
        aggregation_type: "distinct_customers_by_se",
        icon_name: "Users",
        display_order: 2,
        is_active: true,
      },
      {
        name: "Power1 Customers ≥ 5L",
        short_key: "power1Count",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: ">=",
        field_value: "5",
        aggregation_type: "per_se_per_customer (Power1 only)",
        icon_name: "TrendingUp",
        display_order: 3,
        is_active: true,
      },
      {
        name: "Magnatec Customers ≥ 5L",
        short_key: "magnatecCount",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: ">=",
        field_value: "5",
        aggregation_type: "per_se_per_customer (Magnatec only)",
        icon_name: "TrendingUp",
        display_order: 4,
        is_active: true,
      },
      {
        name: "CRB Turbomax Customers ≥ 5L",
        short_key: "crbCount",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: ">=",
        field_value: "5",
        aggregation_type: "per_se_per_customer (CRB Turbomax only)",
        icon_name: "TrendingUp",
        display_order: 5,
        is_active: true,
      },
      {
        name: "High-Volume Core Customers (≥ 9L)",
        short_key: "highVolCount",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: ">=",
        field_value: "9",
        aggregation_type: "core_products_only_per_se_per_customer",
        icon_name: "TrendingUp",
        display_order: 6,
        is_active: true,
      },
      {
        name: "Autocare Customers (≥ 5L)",
        short_key: "autocareCount",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: ">=",
        field_value: "5",
        aggregation_type: "autocare_only_per_se_per_customer",
        icon_name: "Package",
        display_order: 7,
        is_active: true,
      },
      {
        name: "Weekly Sales Volume",
        short_key: "weeklySales",
        kpi_type: "volume",
        field_name: "product_volume",
        operator: "> 0",
        field_value: "0",
        aggregation_type: "sum_by_week",
        icon_name: "BarChart3",
        display_order: 8,
        is_active: true,
      },
      {
        name: "Volume by Brand",
        short_key: "volByBrand",
        kpi_type: "volume",
        field_name: "product_volume",
        operator: "> 0",
        field_value: "0",
        aggregation_type: "sum_by_brand",
        icon_name: "Package",
        display_order: 9,
        is_active: true,
      },
      {
        name: "Top 10 Customers by Value",
        short_key: "topCustomers",
        kpi_type: "value",
        field_name: "total_value",
        operator: "> 0",
        field_value: "0",
        aggregation_type: "sum_by_customer",
        icon_name: "FileText",
        display_order: 10,
        is_active: true,
      },
      {
        name: "Unbilled Customers (< 9L)",
        short_key: "unbilled",
        kpi_type: "customer_count",
        field_name: "product_volume",
        operator: "<",
        field_value: "9",
        aggregation_type: "core_products_only_per_se_per_customer",
        icon_name: "AlertCircle",
        display_order: 11,
        is_active: true,
      },
    ];

    const { error } = await supabase.from("kpi_configs").insert(defaults);
    if (error) {
      console.error("Error seeding default KPI configs", error);
      toast({
        variant: "destructive",
        title: "Failed to create defaults",
        description: error.message,
      });
    } else {
      toast({
        title: "Default KPIs created",
        description: "Existing dashboard KPIs are now visible here.",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const existing = await loadConfigs();
      if (isAdmin && (!existing || existing.length === 0)) {
        await seedDefaultKpis();
        await loadConfigs();
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleChange = (field: keyof typeof emptyForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Only admins can manage KPI configs.",
      });
      return;
    }

    const displayOrderNum = form.display_order ? Number(form.display_order) : null;

    const payload = {
      name: form.name.trim(),
      short_key: form.short_key.trim(),
      kpi_type: form.kpi_type.trim(),
      field_name: form.field_name.trim(),
      operator: form.operator.trim(),
      field_value: form.field_value.trim(),
      aggregation_type: form.aggregation_type.trim(),
      icon_name: form.icon_name.trim() || null,
      display_order: displayOrderNum,
      is_active: form.is_active,
    };

    const { error } = editingId
      ? await supabase
          .from("kpi_configs")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("kpi_configs").insert([payload]);

    if (error) {
      console.error(editingId ? "Error updating KPI config" : "Error creating KPI config", error);
      toast({
        variant: "destructive",
        title: editingId ? "Update failed" : "Create failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: editingId ? "KPI updated" : "KPI created",
      description: editingId
        ? "KPI configuration changes saved."
        : "New KPI configuration added.",
    });
    setForm(emptyForm);
    setEditingId(null);
    loadConfigs();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">KPI Builder</h1>
            <p className="text-muted-foreground mt-1">
              Define KPI rules that can be used on the dashboard.
            </p>
          </div>
        </div>

        {!isAdmin ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>Only admin users can configure KPIs.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Create New KPI</CardTitle>
                <CardDescription>Set basic rule fields for a new KPI.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="short_key">Short Key</Label>
                      <Input
                        id="short_key"
                        value={form.short_key}
                        onChange={(e) => handleChange("short_key", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kpi_type">KPI Type</Label>
                      <Input
                        id="kpi_type"
                        placeholder="e.g. volume, count"
                        value={form.kpi_type}
                        onChange={(e) => handleChange("kpi_type", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="field_name">Field Name</Label>
                      <Input
                        id="field_name"
                        placeholder="e.g. product_volume"
                        value={form.field_name}
                        onChange={(e) => handleChange("field_name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operator">Operator</Label>
                      <Input
                        id="operator"
                        placeholder=">=, <=, =, IN..."
                        value={form.operator}
                        onChange={(e) => handleChange("operator", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_value">Field Value</Label>
                    <Input
                      id="field_value"
                      placeholder="e.g. 5, 9, POWER1"
                      value={form.field_value}
                      onChange={(e) => handleChange("field_value", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="aggregation_type">Aggregation Type</Label>
                      <Input
                        id="aggregation_type"
                        placeholder="sum, count, distinct-count"
                        value={form.aggregation_type}
                        onChange={(e) => handleChange("aggregation_type", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon_name">Icon Name (optional)</Label>
                      <Input
                        id="icon_name"
                        placeholder="e.g. TrendingUp"
                        value={form.icon_name}
                        onChange={(e) => handleChange("icon_name", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 items-center">
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={form.display_order}
                        onChange={(e) => handleChange("display_order", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-4 sm:pt-7">
                      <div className="space-y-1">
                        <Label htmlFor="is_active">Active</Label>
                        <p className="text-xs text-muted-foreground">
                          Inactive KPIs will be hidden from dashboards.
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={form.is_active}
                        onCheckedChange={(checked) => handleChange("is_active", checked)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="mt-2" disabled={loading}>
                    Save KPI
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border overflow-hidden">
              <CardHeader>
                <CardTitle>Existing KPI Configs</CardTitle>
                <CardDescription>
                  These rules are stored in the backend and can be wired to dashboard KPIs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Loading KPI configurations...
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No KPI configurations found yet.
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto border border-border/60 rounded-md">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-card border-b border-border">
                        <tr className="text-left">
                          <th className="px-2 py-2">Name</th>
                          <th className="px-2 py-2">Key</th>
                          <th className="px-2 py-2">Type</th>
                          <th className="px-2 py-2">Field / Operator / Value</th>
                          <th className="px-2 py-2 text-right">Active</th>
                          <th className="px-2 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {configs.map((cfg) => (
                          <tr key={cfg.id} className="border-b border-border/40 last:border-b-0">
                            <td className="px-2 py-2 align-top font-medium">
                              {cfg.name}
                            </td>
                            <td className="px-2 py-2 align-top">{cfg.short_key}</td>
                            <td className="px-2 py-2 align-top">{cfg.kpi_type}</td>
                            <td className="px-2 py-2 align-top text-xs sm:text-sm">
                              <div className="space-y-0.5">
                                <div>
                                  <span className="font-medium">Field:</span> {cfg.field_name}
                                </div>
                                <div>
                                  <span className="font-medium">Rule:</span> {cfg.operator} {cfg.field_value}
                                </div>
                                <div>
                                  <span className="font-medium">Aggregation:</span> {cfg.aggregation_type}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 align-top text-right">
                              {cfg.is_active ? "Active" : "Inactive"}
                            </td>
                            <td className="px-2 py-2 align-top text-right space-x-2 whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setForm({
                                    name: cfg.name,
                                    short_key: cfg.short_key,
                                    kpi_type: cfg.kpi_type,
                                    field_name: cfg.field_name,
                                    operator: cfg.operator,
                                    field_value: cfg.field_value,
                                    aggregation_type: cfg.aggregation_type,
                                    icon_name: cfg.icon_name || "",
                                    display_order: cfg.display_order?.toString() ?? "",
                                    is_active: cfg.is_active ?? true,
                                  });
                                  setEditingId(cfg.id);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!isAdmin) {
                                    toast({
                                      variant: "destructive",
                                      title: "Access denied",
                                      description: "Only admins can manage KPI configs.",
                                    });
                                    return;
                                  }
                                  if (!window.confirm(`Delete KPI "${cfg.name}"?`)) return;
                                  const { error } = await supabase
                                    .from("kpi_configs")
                                    .delete()
                                    .eq("id", cfg.id);
                                  if (error) {
                                    console.error("Error deleting KPI config", error);
                                    toast({
                                      variant: "destructive",
                                      title: "Delete failed",
                                      description: error.message,
                                    });
                                  } else {
                                    toast({
                                      title: "KPI deleted",
                                      description: "KPI configuration removed.",
                                    });
                                    if (editingId === cfg.id) {
                                      setEditingId(null);
                                      setForm(emptyForm);
                                    }
                                    loadConfigs();
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default KpiAdmin;
