import React, { useState } from 'react';
import { ArrowRight, Zap, Brain, Search, Download, Edit3, TrendingUp, Sparkles, Globe, MessageCircle, BarChart3, Building, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileSidebar } from '@/components/ProfileSidebar';

const SentiXLanding = () => {
  const { user, isGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const handleServiceRedirect = () => {
    if (user || isGuest) {
      window.location.href = '/service';
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignupFromGuest = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Static Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
      
      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SentiX.AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="#stats" className="text-gray-300 hover:text-white transition-colors">Stats</a>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            <button 
              onClick={handleServiceRedirect}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
            {(user || isGuest) ? (
              <button
                onClick={() => setShowProfileSidebar(true)}
                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleAuthClick('login')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-gray-800/40 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-gray-700/50">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-300">AI-Powered Sentiment Insights</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                Turn Discussions
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Into Powerful
                </span>
                <br />
                Sentiment Insights
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-4xl mx-auto leading-relaxed">
                Choose a company, let AI analyze public opinions from social media, news, and the web, 
                and receive a ready-to-use sentiment report with actionable insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={handleServiceRedirect}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 rounded-2xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-2xl"
                >
                  <Zap className="w-6 h-6" />
                  <span>Start Analyzing</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-gray-600 px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:border-gray-500">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Hero Visual Dashboard */}
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"></div>
                <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div className="ml-4 text-sm text-gray-400">SentiX.AI Dashboard</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/30 hover:bg-gray-800/80 transition-colors">
                      <Building className="w-8 h-8 text-blue-400 mb-4" />
                      <h3 className="font-bold mb-2 text-white">Company Selection</h3>
                      <p className="text-sm text-gray-400">Choose from top companies or search custom</p>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 bg-blue-500/30 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full w-3/4"></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/30 hover:bg-gray-800/80 transition-colors">
                      <Brain className="w-8 h-8 text-purple-400 mb-4" />
                      <h3 className="font-bold mb-2 text-white">AI Analysis</h3>
                      <p className="text-sm text-gray-400">Smart sentiment processing & insights</p>
                      <div className="mt-4 flex justify-center">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700/30 hover:bg-gray-800/80 transition-colors">
                      <Download className="w-8 h-8 text-pink-400 mb-4" />
                      <h3 className="font-bold mb-2 text-white">Instant Reports</h3>
                      <p className="text-sm text-gray-400">Ready-to-use PDF sentiment reports</p>
                      <div className="mt-4 flex space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                How <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SentiX.AI</span> Works
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Five simple steps to get comprehensive sentiment analysis for any company
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Timeline Line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 to-pink-500 transform md:-translate-x-1/2"></div>

              {/* Steps */}
              {[
                {
                  number: "01",
                  title: "Choose Company",
                  description: "Pick from 6 featured companies or search for any company you want to analyze. Our system recognizes thousands of businesses worldwide.",
                  icon: Building,
                  color: "from-blue-500 to-purple-500"
                },
                {
                  number: "02", 
                  title: "Fetch Public Data",
                  description: "Pull real-time data from social media mentions, reviews, and public discussions across multiple platforms for comprehensive coverage.",
                  icon: Globe,
                  color: "from-purple-500 to-pink-500"
                },
                {
                  number: "03",
                  title: "Web Search Analysis", 
                  description: "Gather live web search results, news articles, and recent content to understand current public perception and trending topics.",
                  icon: Search,
                  color: "from-pink-500 to-orange-500"
                },
                {
                  number: "04",
                  title: "AI Processing",
                  description: "Advanced AI analyzes sentiment, identifies trends, extracts key insights, and processes emotional patterns from all collected data.",
                  icon: Brain,
                  color: "from-orange-500 to-red-500"
                },
                {
                  number: "05",
                  title: "Generate PDF Report",
                  description: "Download a comprehensive, visual sentiment report with charts, insights, and actionable recommendations ready to share with your team.",
                  icon: Download,
                  color: "from-red-500 to-purple-500"
                }
              ].map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={index} className={`relative flex flex-col md:flex-row items-center mb-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Timeline Dot */}
                    <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform md:-translate-x-1/2 z-10"></div>
                    
                    {/* Content */}
                    <div className={`w-full md:w-5/12 ml-20 md:ml-0 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}>
                      <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 group">
                        <div className="flex items-center mb-6">
                          <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-300`}>
                            <StepIcon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-500 mb-1">STEP {step.number}</div>
                            <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-400 leading-relaxed">{step.description}</p>
                      </div>
                    </div>

                    {/* Visual Element */}
                    <div className={`hidden md:block w-5/12 ${index % 2 === 0 ? 'pl-16' : 'pr-16'}`}>
                      <div className={`bg-gradient-to-br ${step.color} p-0.5 rounded-3xl hover:scale-105 transition-transform duration-300`}>
                        <div className="bg-gray-900 rounded-3xl p-8">
                          <div className="flex items-center justify-center">
                            <StepIcon className="w-24 h-24 text-gray-300 opacity-50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Powerful <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Features</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Everything you need to understand public sentiment about any company
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: BarChart3, 
                  title: "Company Sentiment Tracking", 
                  desc: "Monitor real-time sentiment trends and track how public opinion changes over time",
                  gradient: "from-green-500 to-blue-500"
                },
                { 
                  icon: Brain, 
                  title: "AI-Powered Insights", 
                  desc: "Advanced AI algorithms analyze context, emotion, and meaning behind every mention",
                  gradient: "from-purple-500 to-pink-500"
                },
                { 
                  icon: Globe, 
                  title: "Social Media + Web Monitoring", 
                  desc: "Comprehensive coverage across social platforms, news sites, and web discussions",
                  gradient: "from-pink-500 to-red-500"
                },
                { 
                  icon: Download, 
                  title: "Instant PDF Reports", 
                  desc: "Professional, shareable reports with visual charts and actionable recommendations",
                  gradient: "from-blue-500 to-purple-500"
                },
                { 
                  icon: TrendingUp, 
                  title: "Comparative Analysis", 
                  desc: "Compare sentiment across different time periods and benchmark against competitors",
                  gradient: "from-orange-500 to-red-500"
                },
                { 
                  icon: MessageCircle, 
                  title: "24/7 Monitoring", 
                  desc: "Continuous sentiment tracking with alerts for significant changes in public perception",
                  gradient: "from-cyan-500 to-blue-500"
                }
              ].map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={index} className="group bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:bg-gray-800/30 hover:scale-105">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                      <FeatureIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-3xl"></div>
              <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-3xl p-12 border border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-white mb-4">Trusted by Business Analysts</h3>
                  <p className="text-gray-400">Join thousands who are already understanding market sentiment</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { number: "10K+", label: "Companies Analyzed" },
                    { number: "95%", label: "Accuracy Rate" },
                    { number: "24/7", label: "Live Monitoring" },
                    { number: "1M+", label: "Data Points Daily" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center group">
                      <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                        {stat.number}
                      </div>
                      <div className="text-gray-400 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl p-16 border border-gray-800/50 hover:bg-gray-900/60 transition-colors">
                <h2 className="text-5xl md:text-6xl font-bold mb-8">
                  Ready to Understand
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Public Sentiment?</span>
                </h2>
                <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Discover how the world feels about your company with AI-powered sentiment analysis. 
                  Get actionable insights that drive better business decisions.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button 
                    onClick={handleServiceRedirect}
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 px-12 py-6 rounded-2xl text-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 shadow-2xl"
                  >
                    <Zap className="w-7 h-7" />
                    <span>Get Sentiment Report Now</span>
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="border-2 border-gray-600 px-12 py-6 rounded-2xl text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:border-gray-500">
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                SentiX.AI
                </span>
              </div>
              <p className="text-gray-400 max-w-2xl mx-auto">
                AI-powered sentiment insights for companies in real-time. 
                Understand public perception and make data-driven decisions.
              </p>
            </div>
            <div className="text-center text-gray-500 text-sm">
              2025 SentiX.AI. All rights reserved. Built with for business intelligence.
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        onSignupClick={handleSignupFromGuest}
      />
    </div>
  );
};

export default SentiXLanding;