import React from 'react';
import {
  HelpCircle,
  MessageCircle,
  BookOpen,
  Mail,
  Phone,
  ChevronRight,
  Search
} from 'lucide-react';

const FaqItem = ({ question, answer }) => (
  <div className="border-b border-slate-100 py-6">
    <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center justify-between group cursor-pointer">
      {question}
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:rotate-90" />
    </h3>
    <p className="text-slate-600 leading-relaxed text-sm">
      {answer}
    </p>
  </div>
);

// eslint-disable-next-line no-unused-vars
const SupportCard = ({ icon: Icon, title, description, actionText, actionLink }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{description}</p>
    <a href={actionLink} className="text-blue-600 font-semibold text-sm flex items-center gap-2 hover:underline">
      {actionText} <ChevronRight className="w-4 h-4" />
    </a>
  </div>
);

export default function Help() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-slate-900 py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">How can we help you?</h1>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Find answers to frequently asked questions, detailed guides, or get in touch with our support team.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for articles, guides..."
              className="w-full bg-slate-800 border-none rounded-full py-4 pl-12 pr-6 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 px-4 -mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <SupportCard
            icon={BookOpen}
            title="Documentation"
            description="Detailed guides on how to set up and use every feature of the YVO platform."
            actionText="Browse Docs"
            actionLink="#"
          />
          <SupportCard
            icon={MessageCircle}
            title="Community Forum"
            description="Discuss with other YVO users, share tips, and learn best practices."
            actionText="Join Community"
            actionLink="#"
          />
          <SupportCard
            icon={HelpCircle}
            title="Video Tutorials"
            description="Watch step-by-step videos to master the platform in no time."
            actionText="Watch Videos"
            actionLink="#"
          />
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <FaqItem
              question="How do I get started with YVO?"
              answer="Getting started is easy! Just sign up for an account, and our onboarding wizard will guide you through setting up your company profile and adding your first employees."
            />
            <FaqItem
              question="Can I use YVO on multiple devices?"
              answer="Yes! YVO is a cloud-based platform accessible via any modern web browser. We also offer a desktop application for a more integrated experience."
            />
            <FaqItem
              question="Is my data secure?"
              answer="Security is our top priority. We use enterprise-grade encryption for all data and follow industry best practices to ensure your information is safe."
            />
            <FaqItem
              question="Do you offer a free trial?"
              answer="Absolutely. Every new company starts with a 14-day free trial of our Pro features, with no credit card required."
            />
            <FaqItem
              question="What kind of support do you provide?"
              answer="We provide 24/7 email support for all users, and priority chat/phone support for our Pro and Enterprise plan customers."
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Still have questions?</h2>
          <p className="text-slate-600 mb-12">If you couldn't find the answer you're looking for, please don't hesitate to contact us.</p>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="flex items-center gap-4 px-8 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-semibold uppercase">Email Us</p>
                <p className="text-slate-900 font-bold">support@yvo.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-8 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-semibold uppercase">Call Us</p>
                <p className="text-slate-900 font-bold">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}