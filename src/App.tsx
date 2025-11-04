import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminTechverse from "./pages/AdminTechverse";
import Auth from "./pages/Auth";
import Templates from "./pages/Templates";
import UserLogin from "./pages/UserLogin";
import Drafts from "./pages/Drafts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserLogin />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/work" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-techverse" element={<AdminTechverse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
