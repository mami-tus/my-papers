import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FieldDetail from '@/pages/FieldDetail';

// React Queryのクライアント作成
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fields/:id" element={<FieldDetail />} />
          {/* 後で追加する他のルート */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
