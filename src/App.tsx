import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewExplanation from "./pages/NewExplanation";
import ChallengePage from "./pages/ChallengePage";
import HistoryPage from "./pages/HistoryPage";
import ViewExplanation from "./pages/ViewExplanation";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/terms";
import Contact from "./pages/Contact";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-explanation" element={<NewExplanation />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/view/:id" element={<ViewExplanation />} />
          <Route path="/privacy" element={<PrivacyPolicy/>} />
          <Route path="/term" element={<TermsOfService/>} />
           <Route path="/contact" element={<Contact/>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
