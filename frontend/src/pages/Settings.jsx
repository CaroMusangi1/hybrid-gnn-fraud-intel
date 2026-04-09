import { useState } from 'react';
import { User, Bell, Shield, Database, Mail, Key, Copy, RefreshCw, Lock } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [thresholds, setThresholds] = useState({ high: 70, medium: 40 });
  const [toggles, setToggles] = useState({
    highRisk: true,
    daily: true,
    system: false
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [dataRetention, setDataRetention] = useState(7);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production API Key', key: 'sk_live_51ABCD...', created: '2026-03-15', lastUsed: '2026-04-09' },
    { id: 2, name: 'Development API Key', key: 'sk_test_51EFGH...', created: '2026-04-01', lastUsed: '2026-04-08' }
  ]);

  const menuItems = [
    { name: 'Profile', icon: User },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'Data & Privacy', icon: Database },
    { name: 'Email Preferences', icon: Mail },
    { name: 'API Keys', icon: Key },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your fraud detection system</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT INTERNAL SIDEBAR */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                    isActive 
                    ? 'bg-indigo-50 text-brandPrimary' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} /> {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 space-y-6">
          
          {/* PROFILE TAB */}
          {activeTab === 'Profile' && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" defaultValue="Imbeka" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" defaultValue="Musa" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" defaultValue="analyst@fraudguard.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input type="text" defaultValue="Senior Fraud Analyst" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandPrimary outline-none text-gray-900" />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="bg-brandPrimary hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Save Changes
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                {/* Toggle 1 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">High-risk transaction alerts</p>
                    <p className="text-sm text-gray-500">Get notified when high-risk transactions are detected</p>
                  </div>
                  <button 
                    onClick={() => setToggles({...toggles, highRisk: !toggles.highRisk})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.highRisk ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.highRisk ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Daily summary reports</p>
                    <p className="text-sm text-gray-500">Receive daily fraud detection summaries</p>
                  </div>
                  <button 
                    onClick={() => setToggles({...toggles, daily: !toggles.daily})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.daily ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.daily ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">System status updates</p>
                    <p className="text-sm text-gray-500">Get notified about system maintenance and updates</p>
                  </div>
                  <button 
                    onClick={() => setToggles({...toggles, system: !toggles.system})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${toggles.system ? 'bg-brandPrimary' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${toggles.system ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'Security' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield size={20} className="text-brandPrimary" /> Security Settings
              </h2>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-gray-600 mb-4">Tier 3 Fraud Analysts require 2FA to access highly sensitive financial data containing PII. This prevents unauthorized dashboard access.</p>
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className={twoFAEnabled ? 'text-green-600' : 'text-gray-400'} />
                      <span className="font-medium text-gray-900">{twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <button 
                      onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                      className={`w-14 h-7 rounded-full transition-colors relative ${twoFAEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${twoFAEnabled ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Password</h3>
                  <p className="text-sm text-gray-600 mb-4">Change your account password. Use at least 12 characters with uppercase, numbers, and symbols.</p>
                  <button className="bg-indigo-100 hover:bg-indigo-200 text-brandPrimary px-6 py-2 rounded-lg font-medium transition-colors">
                    Change Password
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Active Sessions</h3>
                  <p className="text-sm text-gray-600 mb-4">Current browser session active since 2026-04-10 14:30</p>
                  <button className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg font-medium transition-colors">
                    Sign Out All Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATA & PRIVACY TAB */}
          {activeTab === 'Data & Privacy' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database size={20} className="text-brandPrimary" /> Data & Privacy
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-700"><strong>Kenya Data Protection Act (2019):</strong> Financial institutions cannot retain personal data indefinitely. This system enforces automatic deletion policies for regulatory compliance.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Data Retention Policy</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="1" max="10" 
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brandPrimary"
                    />
                    <span className="font-bold text-gray-900 min-w-20">{dataRetention} years</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Automatically delete transaction logs after {dataRetention} years of inactivity.</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-2">Privacy Controls</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Request your data (GDPR-style export)</li>
                    <li>✓ Delete your profile and associated records</li>
                    <li>✓ Opt-out of analytics collection</li>
                  </ul>
                  <button className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm">
                    Download My Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL PREFERENCES TAB */}
          {activeTab === 'Email Preferences' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Mail size={20} className="text-brandPrimary" /> Email Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">High-Risk Transaction Alerts</p>
                    <p className="text-sm text-gray-500">Email sent immediately</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-brandPrimary" />
                </div>

                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Daily Summary Report</p>
                    <p className="text-sm text-gray-500">Sent at 06:00 AM daily</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-brandPrimary" />
                </div>

                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Compliance Report</p>
                    <p className="text-sm text-gray-500">Sent on Monday mornings</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-brandPrimary" />
                </div>

                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">System Maintenance Notifications</p>
                    <p className="text-sm text-gray-500">Sent 24 hours before maintenance</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-brandPrimary" />
                </div>
              </div>
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === 'API Keys' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Key size={20} className="text-brandPrimary" /> API Keys
              </h2>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700"><strong>How It Works:</strong> The Hybrid-GNN is the ML engine. External apps (like the M-Pesa mobile app) use API keys to securely send transaction data to your FastAPI backend for fraud scoring in real-time.</p>
                </div>

                {apiKeys.map(key => (
                  <div key={key.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{key.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Created: {key.created} | Last used: {key.lastUsed}</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                        Delete
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded family-mono text-xs text-gray-700">
                      <code className="flex-1 truncate">{key.key}</code>
                      <Copy size={16} className="cursor-pointer hover:text-brandPrimary transition-colors text-gray-500" />
                    </div>
                  </div>
                ))}

                <button className="w-full bg-brandPrimary hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mt-6 flex items-center justify-center gap-2">
                  <RefreshCw size={18} /> Generate New API Key
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}