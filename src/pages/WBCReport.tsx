import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WbcAgreement {
  id: string;
  customer_code: string;
  customer_name: string | null;
  agreement_start_date: string;
  agreement_end_date: string;
  target_volume: number;
}

interface WbcAgreementWithAchieved extends WbcAgreement {
  achieved_volume: number;
}

const WBCReport = () => {
  const { isAdmin } = useAuth();
  const [agreements, setAgreements] = useState<WbcAgreementWithAchieved[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_code: "",
    customer_name: "",
    agreement_start_date: "",
    agreement_end_date: "",
    target_volume: "",
  });

  const [productDrilldown, setProductDrilldown] = useState<{
    open: boolean;
    title: string;
    items: { label: string; value: number }[];
  }>({ open: false, title: "", items: [] });

  const [invoiceDrilldown, setInvoiceDrilldown] = useState<{
    open: boolean;
    title: string;
    items: { invoice_no: string; product_name: string; volume: number }[];
  }>({ open: false, title: "", items: [] });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: agreementsRaw, error: agreementsError } = await supabase
          .from("wbc_agreements")
          .select("id, customer_code, customer_name, agreement_start_date, agreement_end_date, target_volume")
          .order("customer_code", { ascending: true });

        if (agreementsError) throw agreementsError;

        const agreements = (agreementsRaw || []) as WbcAgreement[];

        if (agreements.length === 0) {
          setAgreements([]);
          return;
        }

        const minStart = agreements.reduce((min, a) =>
          a.agreement_start_date < min ? a.agreement_start_date : min,
          agreements[0].agreement_start_date,
        );
        const maxEnd = agreements.reduce((max, a) =>
          a.agreement_end_date > max ? a.agreement_end_date : max,
          agreements[0].agreement_end_date,
        );

        const customerCodes = Array.from(
          new Set(agreements.map((a) => a.customer_code).filter(Boolean)),
        );

        let invoiceQuery = supabase
          .from("invoices")
          .select("invoice_no, invoice_date, customer_code, customer_name, product_name, product_volume")
          .gte("invoice_date", minStart)
          .lte("invoice_date", maxEnd);

        if (customerCodes.length > 0) {
          invoiceQuery = invoiceQuery.in("customer_code", customerCodes);
        }

        const { data: invoices, error: invoicesError } = await invoiceQuery;
        if (invoicesError) throw invoicesError;

        const enriched: WbcAgreementWithAchieved[] = agreements.map((a) => {
          const achieved = (invoices || []).reduce((sum, inv: any) => {
            if (!inv.customer_code) return sum;
            if (inv.customer_code !== a.customer_code) return sum;
            const d = String(inv.invoice_date);
            if (d < a.agreement_start_date || d > a.agreement_end_date) return sum;
            const v = Number(inv.product_volume) || 0;
            return sum + v;
          }, 0);
          return {
            ...a,
            achieved_volume: achieved,
          };
        });

        setAgreements(enriched);
      } catch (e: any) {
        console.error("Error loading WBC report", e);
        setError(e.message || "Failed to load WBC report");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_code || !form.agreement_start_date || !form.agreement_end_date || !form.target_volume) {
      setError("Please fill all required fields (code, dates, target)");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const target = parseFloat(form.target_volume);
      const { error: insertError } = await supabase.from("wbc_agreements").insert({
        customer_code: form.customer_code.trim(),
        customer_name: form.customer_name.trim() || null,
        agreement_start_date: form.agreement_start_date,
        agreement_end_date: form.agreement_end_date,
        target_volume: isNaN(target) ? 0 : target,
      });
      if (insertError) throw insertError;
      setAddOpen(false);
      setForm({
        customer_code: "",
        customer_name: "",
        agreement_start_date: "",
        agreement_end_date: "",
        target_volume: "",
      });
      // reload
      window.location.reload();
    } catch (e: any) {
      console.error("Error saving agreement", e);
      setError(e.message || "Failed to save agreement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgreement = async (id: string) => {
    if (!confirm("Delete this agreement?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("wbc_agreements")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setAgreements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      console.error("Error deleting agreement", e);
      setError(e.message || "Failed to delete agreement");
    }
  };

  const overallAchievement = useMemo(() => {
    if (agreements.length === 0) return 0;
    const totalTarget = agreements.reduce((s, a) => s + Number(a.target_volume || 0), 0);
    const totalAchieved = agreements.reduce((s, a) => s + Number(a.achieved_volume || 0), 0);
    if (!totalTarget) return 0;
    return (totalAchieved / totalTarget) * 100;
  }, [agreements]);

  const openProductDrilldown = async (agreement: WbcAgreementWithAchieved) => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("invoice_no, invoice_date, customer_code, customer_name, product_name, product_volume")
        .gte("invoice_date", agreement.agreement_start_date)
        .lte("invoice_date", agreement.agreement_end_date)
        .eq("customer_code", agreement.customer_code);
      if (error) throw error;

      const map: Record<string, number> = {};
      (invoices || []).forEach((inv: any) => {
        const key = String(inv.product_name || "Unknown");
        const v = Number(inv.product_volume) || 0;
        map[key] = (map[key] || 0) + v;
      });

      const items = Object.entries(map)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      setProductDrilldown({
        open: true,
        title: `Products for ${agreement.customer_name || agreement.customer_code}`,
        items,
      });
    } catch (e) {
      console.error("Error loading product drilldown", e);
    }
  };

  const openInvoiceDrilldown = async (
    agreement: WbcAgreementWithAchieved,
    productName: string,
  ) => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("invoice_no, invoice_date, customer_code, customer_name, product_name, product_volume")
        .gte("invoice_date", agreement.agreement_start_date)
        .lte("invoice_date", agreement.agreement_end_date)
        .eq("customer_code", agreement.customer_code)
        .eq("product_name", productName);
      if (error) throw error;

      const items = (invoices || []).map((inv: any) => ({
        invoice_no: String(inv.invoice_no || ""),
        product_name: String(inv.product_name || ""),
        volume: Number(inv.product_volume) || 0,
      }));

      setInvoiceDrilldown({
        open: true,
        title: `${productName} invoices for ${agreement.customer_name || agreement.customer_code}`,
        items,
      });
    } catch (e) {
      console.error("Error loading invoice drilldown", e);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">WBC Report</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Overall achievement: <strong>{overallAchievement.toFixed(1)}%</strong>
            </span>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                Add Agreement
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Customer Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading WBC data...</div>
            ) : agreements.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No WBC agreements yet. Use "Add Agreement" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-card border-b border-border">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Customer Code</th>
                      <th className="px-3 py-2 font-medium">Customer Name</th>
                      <th className="px-3 py-2 font-medium">Agreement Start</th>
                      <th className="px-3 py-2 font-medium">Agreement End</th>
                      <th className="px-3 py-2 font-medium text-right">Target (Ltr)</th>
                      <th className="px-3 py-2 font-medium text-right">Achieved (Ltr)</th>
                      <th className="px-3 py-2 font-medium text-right">% Achieved</th>
                      <th className="px-3 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((a) => {
                      const target = Number(a.target_volume || 0);
                      const achieved = Number(a.achieved_volume || 0);
                      const pct = target ? (achieved / target) * 100 : 0;
                      return (
                        <tr key={a.id} className="border-b border-border/40 last:border-b-0">
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">
                            {a.customer_code}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">
                            {a.customer_name || "-"}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">
                            {a.agreement_start_date}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">
                            {a.agreement_end_date}
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {target.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {achieved.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 align-top text-right font-medium">
                            {pct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 align-top text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openProductDrilldown(a)}
                            >
                              View Products
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteAgreement(a.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add WBC Agreement</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleAddAgreement}>
              <div className="space-y-2">
                <Label htmlFor="customer_code">Customer Code</Label>
                <Input
                  id="customer_code"
                  name="customer_code"
                  value={form.customer_code}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name (optional)</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agreement_start_date">Agreement Start Date</Label>
                  <Input
                    id="agreement_start_date"
                    name="agreement_start_date"
                    type="date"
                    value={form.agreement_start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agreement_end_date">Agreement End Date</Label>
                  <Input
                    id="agreement_end_date"
                    name="agreement_end_date"
                    type="date"
                    value={form.agreement_end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_volume">Target Volume (Ltr)</Label>
                <Input
                  id="target_volume"
                  name="target_volume"
                  type="number"
                  step="0.01"
                  value={form.target_volume}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={productDrilldown.open}
          onOpenChange={(open) => setProductDrilldown((p) => ({ ...p, open }))}
        >
          <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{productDrilldown.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border border-border/60 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium text-right">Volume (Ltr)</th>
                  </tr>
                </thead>
                <tbody>
                  {productDrilldown.items.map((item) => (
                    <tr
                      key={item.label}
                      className="border-b border-border/40 last:border-b-0 hover:bg-muted/40 cursor-pointer"
                      onClick={() => {
                        const agreement = agreements.find((a) =>
                          productDrilldown.title.includes(a.customer_code),
                        );
                        if (agreement) {
                          openInvoiceDrilldown(agreement, item.label);
                        }
                      }}
                    >
                      <td className="px-3 py-2 align-top">{item.label}</td>
                      <td className="px-3 py-2 align-top text-right font-medium">
                        {item.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={invoiceDrilldown.open}
          onOpenChange={(open) => setInvoiceDrilldown((p) => ({ ...p, open }))}
        >
          <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{invoiceDrilldown.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border border-border/60 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Invoice No</th>
                    <th className="px-3 py-2 font-medium text-right">Volume (Ltr)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceDrilldown.items.map((item) => (
                    <tr key={item.invoice_no} className="border-b border-border/40 last:border-b-0">
                      <td className="px-3 py-2 align-top">{item.invoice_no}</td>
                      <td className="px-3 py-2 align-top text-right font-medium">
                        {item.volume.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default WBCReport;
