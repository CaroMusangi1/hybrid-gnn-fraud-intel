import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home'; // t
import Transactions from './pages/Transaction';
import FraudNetwork from './pages/FraudNetwork'; 

const Alerts = () => <div><h1 className="text-2xl font-bold mb-4">Review Queue</h1></div>;

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} /> {/* <-- Updated route */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/network" element={<FraudNetwork />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="*" element={<div>Page under construction</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;