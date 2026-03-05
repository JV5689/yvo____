import React from 'react';
import { Check, Zap, Shield, Cloud } from 'lucide-react';

export default function Platform() {
  const features = ["Employees", "Calendar", "Reminder", "Finance", "Invoice", "Inventory", "Report", "Analytics"];

  return (
    <div className="py-16">
      <section className="max-w-7xl mx-auto px-6 text-center mb-20">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">YVO Platform</h1>
        <div className="flex justify-center gap-4 text-xs font-bold uppercase text-blue-600 mb-8">
          <span>AI Powered</span> • <span>Secure</span> • <span>Cloud Based</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(item => (
            <div key={item} className="p-8 border border-slate-100 rounded-2xl hover:shadow-lg transition">
              <div className="text-blue-600 mb-4">★</div>
              <h3 className="font-bold text-lg">{item}</h3>
              <p className="text-slate-400 text-xs mt-2">Manage your {item.toLowerCase()} efficiently.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20 px-6">
        <h2 className="text-center text-3xl font-bold mb-12">Pricing Plans</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <PriceCard title="Basic Plan" price="₹19" features={['Core Analytics', '5 Users']} />
          <PriceCard title="Pro Plan" price="₹49" features={['AI Analytics', 'Unlimited Users']} popular />
          <PriceCard title="Enterprise" price="Custom" features={['Dedicated Manager', 'SLA Guarantee']} />
        </div>
      </section>
    </div>
  );
}

const PriceCard = ({ title, price, features, popular }) => (
  <div className={`p-8 bg-white rounded-3xl border ${popular ? 'border-blue-600 ring-2 ring-blue-600' : 'border-slate-200'}`}>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-4xl font-black text-blue-600 my-6">{price}</p>
    <ul className="space-y-4 mb-8">
      {features.map(f => <li key={f} className="text-slate-500 text-sm flex gap-2"><Check size={16} className="text-blue-600" /> {f}</li>)}
    </ul>
    <button className={`w-full py-3 rounded-xl font-bold ${popular ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Get Started</button>
  </div>
);