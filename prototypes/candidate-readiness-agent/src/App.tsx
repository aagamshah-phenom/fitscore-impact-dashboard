import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DemoGuide } from "./components/DemoGuide";
import { ToastViewport } from "./components/Toast";
import { JobsPage } from "./pages/JobsPage";
import { MLEngineerJobPage } from "./pages/jobs/MLEngineerJobPage";
import { CustomerServiceJobPage } from "./pages/jobs/CustomerServiceJobPage";
import { StoreOpsJobPage } from "./pages/jobs/StoreOpsJobPage";

export default function App() {
  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/ml-engineer" element={<MLEngineerJobPage />} />
          <Route
            path="/jobs/customer-service-outfitter"
            element={<CustomerServiceJobPage />}
          />
          <Route
            path="/jobs/store-operations-manager"
            element={<StoreOpsJobPage />}
          />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </AppShell>
      <DemoGuide />
      <ToastViewport />
    </>
  );
}
