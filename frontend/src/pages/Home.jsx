import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Calendar, CheckCircle, CreditCard, FileText, Package, Users, Video, Database } from 'lucide-react';
import heroImage from '../assets/hero-showcase.png';
import api from '../services/api';

export default function Home() {
  const [clients, setClients] = React.useState([]);

  React.useEffect(() => {
    api.get('/public/clients')
      .then(res => setClients(res.data))
      .catch(err => console.error(err));
  }, []);

  const features = [
    {
      title: 'Digital Finance Ledger',
      description: 'Manage your accounts with an Excel-style digital book designed to store and track all your financial data.',
      icon: <Database className="text-brand" />,
    },
    {
      title: 'Finance Management',
      description: 'Track income, expenses, and generate financial reports effortlessly.',
      icon: <CreditCard className="text-brand" />,
    },
    {
      title: 'Invoice Automation',
      description: 'Create professional invoices, send reminders, and manage payments with ease.',
      icon: <FileText className="text-brand" />,
    },
    {
      title: 'Inventory Control',
      description: 'Monitor stock levels, manage suppliers, and optimize your inventory in real-time.',
      icon: <Package className="text-brand" />,
    },
    {
      title: 'Employee Management',
      description: 'Handle HR tasks, payroll, and team performance with integrated tools.',
      icon: <Users className="text-brand" />,
    },
    {
      title: 'Reminders & Calendar',
      description: 'Stay organized with smart reminders and a centralized calendar for all tasks.',
      icon: <Calendar className="text-brand" />,
    },
    {
      title: 'Advanced Analytics',
      description: 'Gain deep insights into your business performance with customizable dashboards.',
      icon: <BarChart3 className="text-brand" />,
    },
  ];

  const plans = [
    {
      name: 'Growth',
      price: '₹79',
      description: 'per month, billed annually',
      features: ['Advanced Finance Reporting', 'Unlimited Invoices', 'Up to 5 User Accounts', 'Priority Support', 'Basic Inventory'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '₹199',
      description: 'per month, billed annually',
      features: [
        'Comprehensive Financial Suite',
        'Unlimited Invoices & Clients',
        'Unlimited User Accounts',
        'Dedicated Account Manager',
        'Advanced Inventory & HR',
        'Customizable Analytics',
      ],
      cta: 'Explore Pro',
      highlighted: true,
    },
  ];

  return (
    <div className="pt-24 overflow-x-hidden">
      {/* Redesigned Hero Section per Reference Image */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center relative">
        <div className="relative z-10 space-y-10">
          <h1 className="text-5xl md:text-8xl font-normal tracking-tight text-slate-900 font-hand leading-tight drop-shadow-sm">
            All your business on <span className="highlight-brush inline-block px-4">one platform.</span>
          </h1>

          <div className="relative inline-block float-slow">
            <h2 className="text-3xl md:text-5xl font-hand text-slate-700 italic opacity-90">
              Simple, efficient, yet <span className="underline-brush">affordable!</span>
            </h2>
          </div>

          <div className="flex justify-center pt-6">
            <Link
              to="/signup"
              className="btn-brush text-2xl"
            >
              Start now
            </Link>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Merged Desktop App Showcase Section */}
      <section className="w-full relative overflow-hidden min-h-screen flex items-center mb-32 group">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
          <img
            alt="Dashboard preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            src={heroImage}
          />
        </div>

        {/* Overlaid Content */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 w-full text-center text-white">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Get the YVO Desktop App</h2>
            <p className="text-lg text-slate-100/90 leading-relaxed">
              Enhance your productivity with the YVO desktop application. Enjoy seamless offline access, improved performance, and
              native system integration for an unparalleled experience.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/download" className="bg-brand text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-600 transition shadow-xl shadow-blue-600/20 transform hover:-translate-y-1">
                Download for Windows
              </Link>
              <Link to="/download" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition transform hover:-translate-y-1">
                Download for macOS
              </Link>
              <Link to="/download" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition transform hover:-translate-y-1">
                Download for Linux
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 relative">
            <h2 className="text-6xl md:text-7xl font-hand text-slate-800 mb-6 transform -rotate-2 inline-block relative z-10">
              Our Clients
            </h2>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-48 h-3 bg-blue-500/80 -rotate-1 rounded-full blur-[1px] opacity-80 z-0"></div>
          </div>

          {clients.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {clients.map((client) => (
                <div
                  key={client._id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center h-32 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    title={client.name}
                    className="max-h-14 w-auto object-contain transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No clients added yet.</p>
              <Link to="/super-admin-login" className="text-blue-600 font-bold text-sm hover:underline mt-2 inline-block">
                Add clients from Super Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Powerful Features Designed for <br />
            <span className="highlight-brush px-4 inline-block mt-2 transform -rotate-1">Your Success</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Discover how YVO's comprehensive modules can simplify your daily operations, streamline workflows, and boost your business productivity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-brand transition-colors duration-300 flex items-center justify-center mb-6">
                {React.cloneElement(feature.icon, {
                  className: "w-7 h-7 text-brand group-hover:text-white transition-colors duration-300"
                })}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand transition-colors">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>



      <section className="bg-slate-50 py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Flexible Plans for Every Business Size</h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">Choose the perfect YVO plan that scales with your needs, from startups to large enterprises.</p>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border ${plan.highlighted
                  ? 'border-brand shadow-blue-900/5 ring-4 ring-blue-500/10'
                  : 'border-slate-100 hover:border-blue-200'
                  }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.8rem]">
                    POPULAR
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-sm font-semibold text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{plan.description}</p>
                </div>

                <hr className="border-slate-100" />

                <ul className="space-y-3 flex-1">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                      <CheckCircle size={18} className="text-brand flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/pricing?plan=${plan.name.toLowerCase()}`}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all text-center shadow-lg ${plan.highlighted
                    ? 'bg-brand text-white hover:bg-blue-600 shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-slate-200/50'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="max-w-4xl mx-auto px-6 pb-32 pt-16 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
          Ready to Transform <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Your Business?
          </span>
        </h2>
        <div className="flex justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white transition-all duration-200 bg-brand rounded-full hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
