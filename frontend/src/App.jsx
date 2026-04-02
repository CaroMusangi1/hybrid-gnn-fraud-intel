import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Transactions from "./pages/Transaction";

// Placeholder Pages (We will build these out in the next steps)
const Dashboard = () => <div><h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1><p>KPIs and Charts will go here.</p></div>;

const NetworkGraph = () => <div><h1 className="text-2xl font-bold mb-4">Fraud Network Visualization</h1><p>The Neo4j web will go here.</p></div>;
const Alerts = () => <div><h1 className="text-2xl font-bold mb-4">Review Queue</h1></div>;

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/network" element={<NetworkGraph />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="*" element={<div>Page under construction</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;