import React from 'react';
import {
  Sparkles,
  User,
  Zap,
  Target,
  Eye,
  LayoutGrid,
  Settings,
  Bell,
  BarChart3,
  Lock,
  Monitor,
  Package,
  Handshake,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
const Card = ({ icon: Icon, title, description, centerText = true }) => (
  <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col ${centerText ? 'items-center text-center' : 'items-start text-left'} hover:shadow-md transition-shadow duration-300 h-full`}>
    <div className="mb-4">
      <Icon className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const SectionHeader = ({ title }) => (
  <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{title}</h2>
);

export default function About() {
  return (
    <div className="font-sans antialiased text-gray-900">

      {/* 1. Hero Section */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Built to Simplify <br /> Business Operations
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            YVO empowers MSMEs, startups, and freelancers with intelligent, reliable,
            and easy-to-use AI solutions that improve productivity and decision-making.
          </p>
        </div>
      </section>

      {/* 2. Our Story Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title="Our Story" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              icon={Sparkles}
              title="The Beginning"
              description="Frustrated by complex and disjointed business tools, we envisioned a unified platform for all operational needs."
            />
            <Card
              icon={User}
              title="Focused on You"
              description="Our focus is on MSMEs, startups, and freelancers, providing them with the tools to thrive without the overhead."
            />
            <Card
              icon={Zap}
              title="The YVO Solution"
              description="YVO was born to solve these challenges, offering an intuitive, AI-powered system that simplifies everything."
            />
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision Section */}
      <section className="bg-sky-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader title="Our Mission & Vision" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              icon={Target}
              title="Our Mission"
              description="To simplify finance, operations, and decision-making for businesses of all sizes, enabling them to focus on growth and innovation."
              centerText={false}
            />
            <Card
              icon={Eye}
              title="Our Vision"
              description="To become the leading all-in-one intelligent business operating system, revolutionizing how companies manage their entire ecosystem."
              centerText={false}
            />
          </div>
        </div>
      </section>

      {/* 4. What We Do Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="What We Do" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              icon={LayoutGrid}
              title="Invoicing & Finance Management"
              description="Effortlessly manage invoices, track expenses, and monitor cash flow."
            />
            <Card
              icon={Settings}
              title="Operations & Employee Management"
              description="Streamline daily operations, manage tasks, and optimize team productivity."
            />
            <Card
              icon={Bell}
              title="Reminders, Planning & Productivity"
              description="Stay organized with smart reminders, planning tools, and productivity features."
            />
            <Card
              icon={BarChart3}
              title="Analytics & AI Insights"
              description="Gain actionable insights with powerful analytics and AI-driven recommendations."
            />
          </div>
        </div>
      </section>

      {/* 5. Why Choose YVO Section */}
      <section className="bg-sky-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Why Choose YVO?" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              icon={Lock}
              title="Secure & Scalable"
              description="Your data is protected with enterprise-grade security, designed to grow with you."
            />
            <Card
              icon={Settings}
              title="Feature-Controlled Platform"
              description="Customize features to fit your unique business needs, giving you full control."
            />
            <Card
              icon={Monitor}
              title="Web + Desktop App Support"
              description="Access YVO seamlessly from your browser or dedicated desktop application."
            />
            <Card
              icon={Package}
              title="Designed for Growing Businesses"
              description="From startups to established enterprises, YVO adapts to your evolving demands."
            />
          </div>
        </div>
      </section>

      {/* 6. Values & Principles Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title="Values & Principles" />

          {/* Top Row (3 items) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card
              icon={Sparkles}
              title="Simplicity"
              description="We believe powerful tools should be easy to use, without unnecessary complexity."
            />
            <Card
              icon={Handshake}
              title="Transparency"
              description="Open communication and clear processes build trust with our users."
            />
            <Card
              icon={ShieldCheck}
              title="Security"
              description="Protecting your data is our top priority with robust security measures."
            />
          </div>

          {/* Bottom Row (2 items centered) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:w-2/3 mx-auto">
            <Card
              icon={Lightbulb}
              title="Innovation"
              description="Continuously evolving with cutting-edge technology to offer the best solutions."
            />
            <Card
              icon={User}
              title="Customer-first"
              description="Your success is our success; we are dedicated to providing exceptional support."
            />
          </div>
        </div>
      </section>

      {/* 7. Future-Ready Platform Section */}
      <section className="bg-sky-50 py-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">A Future-Ready Platform</h2>
          <p className="text-gray-600 leading-relaxed mb-12">
            YVO is designed with the future in mind. Our roadmap includes advanced AI capabilities,
            deeper automation, and sophisticated analytics to ensure your business stays ahead. We
            are committed to long-term growth and adaptability, constantly innovating to meet the
            evolving demands of the modern business landscape.
          </p>

          {/* Decorative bar to mimic the image's gradient strip */}
          <div className="h-2 w-full max-w-2xl mx-auto rounded-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shadow-sm opacity-60"></div>
        </div>
      </section>

      {/* 8. CTA Section */}
      <section className="bg-blue-600 py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of businesses simplifying their operations with YVO. Experience the power <br className="hidden md:block" />
            of intelligent business management today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              View Demo
            </button>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Get Started with YVO
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}