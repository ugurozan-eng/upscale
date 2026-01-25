import { User, CreditCard, Bell, Shield, LogOut } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account</p>
      </div>

      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold">T</div>
            <div>
              <h3 className="text-xl font-semibold text-white">Test User</h3>
              <p className="text-dark-400">test@test.com</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: User, label: 'Edit Profile' },
              { icon: CreditCard, label: 'Billing & Credits' },
              { icon: Bell, label: 'Notifications' },
              { icon: Shield, label: 'Privacy & Security' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="w-full flex items-center space-x-3 p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors text-left">
                <Icon className="w-5 h-5 text-dark-400" />
                <span className="flex-1">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card border-red-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Danger Zone</h3>
          <button className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
