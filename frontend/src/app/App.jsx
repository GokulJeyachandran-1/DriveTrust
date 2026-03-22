import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from '../auth/auth';
import AppRoutes from './routes';

const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
  `}</style>
);

function App() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </>
  );
}

export default App;
