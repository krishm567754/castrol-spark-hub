import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unbilled from "./pages/Unbilled";
import OpenOrders from "./pages/OpenOrders";
import Last7Days from "./pages/Last7Days";
import InvoiceSearch from "./pages/InvoiceSearch";
import MasterSearch from "./pages/MasterSearch";
import Stock from "./pages/Stock";
import Customers from "./pages/Customers";
import AdminData from "./pages/AdminData";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/unbilled" element={<Unbilled />} />
          <Route path="/open-orders" element={<OpenOrders />} />
          <Route path="/last-7-days" element={<Last7Days />} />
          <Route path="/invoice-search" element={<InvoiceSearch />} />
          <Route path="/master-search" element={<MasterSearch />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/admin-data" element={<AdminData />} />
          <Route path="/admin-users" element={<AdminUsers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
