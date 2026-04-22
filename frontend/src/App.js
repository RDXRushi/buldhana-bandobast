import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import StaffManagement from "./pages/StaffManagement";
import NewBandobast from "./pages/NewBandobast";
import BandobastDetail from "./pages/BandobastDetail";
import PrintIDCard from "./pages/PrintIDCard";
import PrintDutyPass from "./pages/PrintDutyPass";
import PrintGoshwara from "./pages/PrintGoshwara";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Print routes (no layout) */}
          <Route path="/print/id-card/:staffId" element={<PrintIDCard />} />
          <Route path="/print/duty-pass/:bid/:pid/:sid" element={<PrintDutyPass />} />
          <Route path="/print/goshwara/:id" element={<PrintGoshwara />} />

          {/* App routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="bandobast/new" element={<NewBandobast />} />
            <Route path="bandobast/edit/:id" element={<NewBandobast />} />
            <Route path="bandobast/:id" element={<BandobastDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
