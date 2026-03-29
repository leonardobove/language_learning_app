import { Routes, Route, Navigate } from "react-router-dom";
import ProfilePicker from "./pages/ProfilePicker.jsx";
import LanguagePicker from "./pages/LanguagePicker.jsx";
import Session from "./pages/Session.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfilePicker />} />
      <Route path="/language/:userId" element={<LanguagePicker />} />
      <Route path="/session/:sessionId" element={<Session />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
