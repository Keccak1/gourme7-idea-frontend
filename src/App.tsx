import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { WelcomePage, ChatPage, WalletsPage, SchedulesPage } from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="agents/:agentId/sessions/:sessionId" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
