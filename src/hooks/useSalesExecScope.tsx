import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SalesExecScope {
  loading: boolean;
  hasAllAccess: boolean;
  allowedSalesExecNames: string[];
}

export const useSalesExecScope = (): SalesExecScope => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAllAccess, setHasAllAccess] = useState(false);
  const [allowedSalesExecNames, setAllowedSalesExecNames] = useState<string[]>([]);

  useEffect(() => {
    const loadScope = async () => {
      if (!user) {
        setHasAllAccess(false);
        setAllowedSalesExecNames([]);
        setLoading(false);
        return;
      }

      if (isAdmin) {
        setHasAllAccess(true);
        setAllowedSalesExecNames([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_sales_exec_access")
        .select("has_all_access, sales_executives(name)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load sales exec scope", error);
        setHasAllAccess(true);
        setAllowedSalesExecNames([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setHasAllAccess(true);
        setAllowedSalesExecNames([]);
        setLoading(false);
        return;
      }

      if (data.some((row: any) => row.has_all_access)) {
        setHasAllAccess(true);
        setAllowedSalesExecNames([]);
      } else {
        const names = Array.from(
          new Set(
            data
              .map((row: any) => row.sales_executives?.name as string | undefined)
              .filter((n): n is string => Boolean(n))
          )
        );
        setHasAllAccess(false);
        setAllowedSalesExecNames(names);
      }

      setLoading(false);
    };

    loadScope();
  }, [user, isAdmin]);

  return { loading, hasAllAccess, allowedSalesExecNames };
};
