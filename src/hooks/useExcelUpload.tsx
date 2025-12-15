import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

      // Map Excel columns to database columns
      const invoices = jsonData.map((row: any) => ({
        invoice_no: row["Invoice No"] || row["Invoice Number"] || "",
        invoice_date: row["Invoice Date"] || row["Date"] || "",
        customer_code: row["Customer Code"] || "",
        customer_name: row["Customer Name"] || "",
        sales_exec_name: row["Sales Executive Name"] || row["Sales Executive"] || "",
        master_brand_name: row["Master Brand Name"] || "",
        product_brand_name: row["Product Brand Name"] || "",
        product_name: row["Product Name"] || "",
        product_volume: parseFloat(row["Product Volume"] || row["Volume"] || 0),
        total_value: parseFloat(row["Total Value incl VAT/GST"] || row["Total Value"] || 0),
        state_name: row["State Name"] || "",
        district_name: row["District Name"] || "",
        is_current_year: isCurrentYear,
        fiscal_year: row["Fiscal Year"] || new Date().getFullYear().toString(),
      }));

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < invoices.length; i += batchSize) {
        const batch = invoices.slice(i, i + batchSize);
        const { error } = await supabase.from("invoices").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Imported ${invoices.length} invoice records`,
      });

      return invoices.length;
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

      const customers = jsonData.map((row: any) => ({
        customer_code: row["Customer Code"] || "",
        customer_name: row["Customer Name"] || "",
        sales_executive: row["Sales Executive"] || "",
        city: row["City"] || "",
        address: row["Address"] || "",
        phone: row["Phone"] || row["Mobile"] || "",
        gst: row["GST"] || row["GSTIN"] || "",
        category: row["Category"] || "",
      }));

      // Delete existing and insert new
      await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const batchSize = 500;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        const { error } = await supabase.from("customers").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Imported ${customers.length} customer records`,
      });

      return customers.length;
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

      const stock = jsonData.map((row: any) => ({
        product_code: row["Product Code"] || "",
        product_name: row["Product Name"] || "",
        quantity: parseFloat(row["Qty(EA/Ltrs/Kg)"] || row["Quantity"] || 0),
        pack_size: row["Pack/Size"] || "",
        brand: row["Brand"] || "",
      }));

      // Delete existing and insert new
      await supabase.from("stock").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const batchSize = 500;
      for (let i = 0; i < stock.length; i += batchSize) {
        const batch = stock.slice(i, i + batchSize);
        const { error } = await supabase.from("stock").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Imported ${stock.length} stock records`,
      });

      return stock.length;
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

      const orders = jsonData.map((row: any) => ({
        order_no: row["SO No"] || row["Order No"] || "",
        order_date: row["SO Date"] || row["Order Date"] || "",
        customer_code: row["Customer Code"] || "",
        customer_name: row["Customer Name"] || "",
        sales_exec_name: row["DSR Name"] || row["Sales Executive"] || "",
        product_name: row["Product Name"] || "",
        quantity: parseFloat(row["Quantity"] || 0),
        status: row["Status"] || "Open",
      }));

      // Delete existing and insert new
      await supabase.from("open_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const batchSize = 500;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const { error } = await supabase.from("open_orders").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Imported ${orders.length} order records`,
      });

      return orders.length;
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

  return {
    isUploading,
    uploadInvoices,
    uploadCustomers,
    uploadStock,
    uploadOpenOrders,
  };
};
