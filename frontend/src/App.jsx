import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertsProvider } from './context/AlertsContext';
import { SampleDataProvider } from './context/SampleDataContext';
import Layout from './components/Layout';
import Home from './pages/Home'; // t
import Transactions from './pages/Transaction';
import FraudNetwork from './pages/FraudNetwork'; 
import Alerts from './pages/Alerts';
import Models from './pages/Models';
import AIBot from './pages/AIBot';
import Reports from './pages/Reports';
import Settings from './pages/Settings';



function App() {
  return (
    <AlertsProvider>
      <SampleDataProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} /> {/*  Updated route */}
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/network" element={<FraudNetwork />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/models" element={<Models />} />
              <Route path="/ai-bot" element={<AIBot />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </SampleDataProvider>
    </AlertsProvider>
  );
}

export default App;