import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/sections/Hero";
import { HowItWorks } from "./components/sections/HowItWorks";
import { Features } from "./components/sections/Features";
import { SocialDiscovery } from "./components/sections/SocialDiscovery";
import { TrustSafety } from "./components/sections/TrustSafety";
import { AppShowcase } from "./components/sections/AppShowcase";
import { CTA } from "./components/sections/CTA";
import { DownloadApp } from "./components/sections/DownloadApp";
import { DeleteAccount } from "./components/pages/DeleteAccount";
import { DocsLayout } from "./components/docs/DocsLayout";
import { DocsAbout } from "./components/pages/DocsAbout";
import { DocsSetupArchitecture } from "./components/pages/DocsSetupArchitecture";
import { DocsSetupSelfHost } from "./components/pages/DocsSetupSelfHost";
import { DocsSetupDevSetup } from "./components/pages/DocsSetupDevSetup";
import { DocsSetupContributing } from "./components/pages/DocsSetupContributing";
import { DocsPrivacy } from "./components/pages/DocsPrivacy";
import { DocsTerms } from "./components/pages/DocsTerms";
import { DocsCsae } from "./components/pages/DocsCsae";
import { Join } from "./components/pages/Join";
import { Login } from "./components/pages/Login";
import { Register } from "./components/pages/Register";

function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <SocialDiscovery />
        <TrustSafety />
        <AppShowcase />
        <CTA />
        <DownloadApp />
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<Navigate to="/docs/about" replace />} />
          <Route path="about" element={<DocsAbout />} />
          <Route path="setup/architecture" element={<DocsSetupArchitecture />} />
          <Route path="setup/self-host" element={<DocsSetupSelfHost />} />
          <Route path="setup/dev-setup" element={<DocsSetupDevSetup />} />
          <Route path="setup/contributing" element={<DocsSetupContributing />} />
          <Route path="privacy" element={<DocsPrivacy />} />
          <Route path="terms" element={<DocsTerms />} />
          <Route path="csae" element={<DocsCsae />} />
        </Route>
        <Route path="/join" element={<Join />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        {/* /app is served by Vite middleware (Expo app); login redirects to /app/ */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
