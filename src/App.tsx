import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import SubmitAspiration from "./pages/SubmitAspiration";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import Games from "./pages/Games";
import BrainRush from "./pages/BrainRush";
import PatternMaster from "./pages/PatternMaster";
import WordSprint from "./pages/WordSprint";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import PlayerAuth from "./pages/PlayerAuth";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/submit" element={<SubmitAspiration />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/statistics" element={<Statistics />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/brain-rush" element={<BrainRush />} />
            <Route path="/games/pattern-master" element={<PatternMaster />} />
        <Route path="/games/word-sprint" element={<WordSprint />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/player-auth" element={<PlayerAuth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
