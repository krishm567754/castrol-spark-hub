import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert Excel date serial number to YYYY-MM-DD format
const excelDateToString = (excelDate: any): string => {
  if (!excelDate) return "";

  // If it's already a string in a date format, try to parse it
  if (typeof excelDate === "string") {
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return "";
  }

  // If it's a number (Excel serial date)
  if (typeof excelDate === "number") {
    // Excel date serial number starts from 1900-01-01
    // JavaScript Date starts from 1970-01-01
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(excelEpoch.getTime() + excelDate * 86400000);

    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }

  return "";
};

// Helper to safely parse numbers
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadInvoices = async (file: File, isCurrentYear: boolean = true) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Sample row from Excel:", jsonData[0]); // For debugging

      // Map Excel columns to database columns with proper date parsing
      const invoices = jsonData
        .map((row: any) => {
          const invoiceDate = excelDateToString(row["Invoice Date"] || row["Date"] || "");

          return {
            invoice_no: String(row["Invoice No"] || row["Invoice Number"] || ""),
            invoice_date: invoiceDate,
            customer_code: String(row["Customer Code"] || ""),
            customer_name: String(row["Customer Name"] || ""),
            sales_exec_name: String(row["Sales Executive Name"] || row["Sales Executive"] || ""),
            master_brand_name: String(row["Master Brand Name"] || ""),
            product_brand_name: String(row["Product Brand Name"] || ""),
            product_name: String(row["Product Name"] || ""),
            product_volume: safeParseFloat(row["Product Volume"] || row["Volume"]),
            total_value: safeParseFloat(row["Total Value incl VAT/GST"] || row["Total Value"]),
            state_name: String(row["State Name"] || ""),
            district_name: String(row["District Name"] || ""),
            is_current_year: isCurrentYear,
            fiscal_year: String(row["Fiscal Year"] || new Date().getFullYear()),
          };
        })
        .filter((invoice) => invoice.invoice_date && invoice.invoice_no); // Only include rows with valid dates and invoice numbers

      if (invoices.length === 0) {
        throw new Error("No valid invoice records found in the file");
      }

      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < invoices.length; i += batchSize) {
        const batch = invoices.slice(i, i + batchSize);
        const { error } = await supabase.from("invoices").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        totalInserted += batch.length;
      }

      toast({
        title: "Success",
        description: `Imported ${totalInserted} invoice records`,
      });

      return totalInserted;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCustomers = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const customers = jsonData
        .map((row: any) => ({
          customer_code: String(row["Customer Code"] || ""),
          customer_name: String(row["Customer Name"] || ""),
          sales_executive: String(row["Sales Executive"] || ""),
          city: String(row["City"] || ""),
          address: String(row["Address"] || ""),
          phone: String(row["Phone"] || row["Mobile"] || ""),
          gst: String(row["GST"] || row["GSTIN"] || ""),
          category: String(row["Category"] || ""),
        }))
        .filter((customer) => customer.customer_code && customer.customer_name);

      if (customers.length === 0) {
        throw new Error("No valid customer records found in the file");
      }

      // Delete existing and insert new
      await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        const { error } = await supabase.from("customers").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        totalInserted += batch.length;
      }

      toast({
        title: "Success",
        description: `Imported ${totalInserted} customer records`,
      });

      return totalInserted;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadStock = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Sample stock row from Excel:", jsonData[0]);

      const stock = jsonData
        .map((row: any) => {
          const product_code = String(
            row["Product Code"] ||
              row["Item Code"] ||
              row["Material Code"] ||
              row["SKU Code"] ||
              ""
          );
          const product_name = String(
            row["Product Name"] ||
              row["Item Name"] ||
              row["Material Name"] ||
              row["SKU Name"] ||
              ""
          );

          return {
            product_code,
            product_name,
            quantity: safeParseFloat(
              row["Qty(EA/Ltrs/Kg)"] ||
                row["Qty (EA/Ltrs/Kg)"] ||
                row["Quantity"] ||
                row["Qty"] ||
                row["Closing Qty"]
            ),
            pack_size: String(
              row["Pack/Size"] || row["Pack Size"] || row["Packsize"] || ""
            ),
            brand: String(row["Brand"] || row["Brand Name"] || ""),
          };
        })
        .filter((item) => item.product_name);

      if (stock.length === 0) {
        throw new Error(
          "No valid stock records found in the file. Please check the column headers for Product Code / Item Code and Product Name / Item Name."
        );
      }

      // Delete existing and insert new
      await supabase.from("stock").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < stock.length; i += batchSize) {
        const batch = stock.slice(i, i + batchSize);
        const { error } = await supabase.from("stock").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        totalInserted += batch.length;
      }

      toast({
        title: "Success",
        description: `Imported ${totalInserted} stock records`,
      });

      return totalInserted;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOpenOrders = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const orders = jsonData
        .map((row: any) => {
          const orderDate = excelDateToString(row["SO Date"] || row["Order Date"] || "");

          return {
            order_no: String(row["SO No"] || row["Order No"] || ""),
            order_date: orderDate,
            customer_code: String(row["Customer Code"] || ""),
            customer_name: String(row["Customer Name"] || ""),
            sales_exec_name: String(row["DSR Name"] || row["Sales Executive"] || ""),
            product_name: String(row["Product Name"] || ""),
            quantity: safeParseFloat(row["Quantity"]),
            status: String(row["Status"] || "Open"),
          };
        })
        .filter((order) => order.order_date && order.order_no);

      if (orders.length === 0) {
        throw new Error("No valid order records found in the file");
      }

      // Delete existing and insert new
      await supabase.from("open_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const batchSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const { error } = await supabase.from("open_orders").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        totalInserted += batch.length;
      }

      toast({
        title: "Success",
        description: `Imported ${totalInserted} order records`,
      });

      return totalInserted;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Clear helpers so you can delete uploaded datasets
  const clearInvoices = async (isCurrentYear?: boolean) => {
    setIsUploading(true);
    try {
      let query = supabase.from("invoices").delete();
      if (typeof isCurrentYear === "boolean") {
        query = query.eq("is_current_year", isCurrentYear);
      }
      const { error } = await query;
      if (error) throw error;
      toast({
        title: "Data cleared",
        description:
          isCurrentYear === undefined
            ? "Cleared all invoices"
            : isCurrentYear
            ? "Cleared current year invoices"
            : "Cleared historical invoices",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Clear Failed", description: error.message });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearCustomers = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Data cleared", description: "Cleared all customers" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Clear Failed", description: error.message });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearStock = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from("stock")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Data cleared", description: "Cleared all stock records" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Clear Failed", description: error.message });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearOpenOrders = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from("open_orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Data cleared", description: "Cleared all open orders" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Clear Failed", description: error.message });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadInvoices,
    uploadCustomers,
    uploadStock,
    uploadOpenOrders,
    clearInvoices,
    clearCustomers,
    clearStock,
    clearOpenOrders,
  };
};
