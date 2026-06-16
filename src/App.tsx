import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/Layout/AppLayout";
import FieldLedger from "@/pages/FieldLedger";
import PlantingSchedule from "@/pages/PlantingSchedule";
import PostHarvest from "@/pages/PostHarvest";
import Orders from "@/pages/Orders";
import Logistics from "@/pages/Logistics";
import Customers from "@/pages/Customers";
import Statistics from "@/pages/Statistics";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<FieldLedger />} />
          <Route path="planting-schedule" element={<PlantingSchedule />} />
          <Route path="post-harvest" element={<PostHarvest />} />
          <Route path="orders" element={<Orders />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="customers" element={<Customers />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
