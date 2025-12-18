import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PageAccessState {
  loading: boolean;
  hasAllPages: boolean;
  allowedPages: string[];
}

export const usePageAccess = (): PageAccessState => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAllPages, setHasAllPages] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setHasAllPages(false);
        setAllowedPages([]);
        setLoading(false);
        return;
      }

      if (isAdmin) {
        // Admins always see all pages
        setHasAllPages(true);
        setAllowedPages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_page_access")
        .select("page_key")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load page access", error);
        // Fail open so users are not locked out due to config issues
        setHasAllPages(true);
        setAllowedPages([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // No explicit rules configured -> allow all pages
        setHasAllPages(true);
        setAllowedPages([]);
      } else {
        setHasAllPages(false);
        setAllowedPages(Array.from(new Set(data.map((r: any) => r.page_key as string))));
      }

      setLoading(false);
    };

    load();
  }, [user, isAdmin]);

  return { loading, hasAllPages, allowedPages };
};
