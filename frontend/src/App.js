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
import PrintBulkIDCards from "./pages/PrintBulkIDCards";
import PrintBulkDutyPasses from "./pages/PrintBulkDutyPasses";
import Login from "./pages/Login";
import LoadingScreen from "./pages/LoadingScreen";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/loading" element={<RequireAuth><LoadingScreen /></RequireAuth>} />

          {/* Print routes (no layout) */}
          <Route path="/print/id-card/:staffId" element={<PrintIDCard />} />
          <Route path="/print/duty-pass/:bid/:pid/:sid" element={<PrintDutyPass />} />
          <Route path="/print/goshwara/:id" element={<PrintGoshwara />} />
          <Route path="/print/bulk/id-cards/:bid" element={<PrintBulkIDCards />} />
          <Route path="/print/bulk/duty-passes/:bid" element={<PrintBulkDutyPasses />} />

          {/* Protected app routes */}
          <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
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
