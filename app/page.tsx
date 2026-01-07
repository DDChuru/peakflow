'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: BanknotesIcon,
    title: "Direct Bank to Ledger Import",
    description: "Perfect for SMEs without formal invoicing. Import bank statements directly into your general ledger with intelligent categorization.",
    highlight: "SME-Focused",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: BoltIcon,
    title: "Smart Bank Reconciliation",
    description: "AI-powered matching system with 95% accuracy. Automatically reconcile transactions and identify discrepancies.",
    highlight: "95% Accuracy",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: DocumentTextIcon,
    title: "Complete Billing Suite",
    description: "From quotes to invoices with automatic general ledger posting. Streamline your entire billing workflow.",
    highlight: "End-to-End",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: ShieldCheckIcon,
    title: "Multi-tenant Architecture",
    description: "Enterprise-grade security with complete company isolation. Your data is protected with bank-level encryption.",
    highlight: "Enterprise Security",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: ChartBarIcon,
    title: "Real-time Financial Dashboard",
    description: "Get instant insights with KPIs and metrics at a glance. Make informed decisions with live financial data.",
    highlight: "Real-time",
    color: "from-cyan-500 to-blue-600"
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "CFO, TechStart Inc",
    content: "PeakFlow transformed our financial operations. What used to take hours now takes minutes.",
    avatar: "SJ",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Finance Director, GrowthCo",
    content: "The bank reconciliation feature alone saved us 10 hours per week. Incredible accuracy.",
    avatar: "MC",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Accountant, SmallBiz Ltd",
    content: "Finally, a system that understands SME needs. The direct bank import is a game-changer.",
    avatar: "ER",
    rating: 5
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "49",
    description: "Perfect for small businesses",
    features: [
      "Up to 1,000 transactions/month",
      "Basic bank reconciliation",
      "Standard support",
      "1 company account"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "149",
    description: "Ideal for growing companies",
    features: [
      "Up to 10,000 transactions/month",
      "AI-powered reconciliation",
      "Priority support",
      "5 company accounts",
      "Custom reporting"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Unlimited transactions",
      "White-label options",
      "Dedicated support",
      "Unlimited companies",
      "API access",
      "Custom integrations"
    ],
    popular: false
  }
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate between solid and particle images
  useEffect(() => {
    const interval = setInterval(() => {
      setShowParticles(prev => !prev);
    }, 4000); // Toggle every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/peakflow-logo.png"
                alt="PeakFlow Accounting Software logo"
                width={180}
                height={120}
                priority
                className={`hidden h-10 w-auto sm:block transition-all ${isScrolled ? '' : 'brightness-110'}`}
              />
              <span className={`text-xl font-bold sm:hidden ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                PeakFlow
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-slate-300 hover:text-white'}`}>Features</a>
              <a href="#testimonials" className={`transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-slate-300 hover:text-white'}`}>Testimonials</a>
              <a href="#pricing" className={`transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-slate-300 hover:text-white'}`}>Pricing</a>
              <Link href="/login">
                <Button variant="outline" className={`mr-2 ${isScrolled ? '' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white'}`}>Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-blue-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-24">
            {/* Left Content */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/peakflow-logo.png"
                  alt="PeakFlow Accounting Software logo"
                  width={180}
                  height={120}
                  priority
                  className="h-12 w-auto brightness-110"
                />
              </div>

              <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 backdrop-blur-sm">
                AI-Powered Financial Management
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Financial Flow
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                Streamline accounting with AI-powered reconciliation, direct ledger imports, and real-time insights.
                <span className="text-white font-medium"> Built for modern SMEs.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    Start Free Trial
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 text-lg rounded-xl bg-slate-800/50 backdrop-blur-sm"
                >
                  <PlayIcon className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-cyan-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-cyan-400" />
                  14-day trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-cyan-400" />
                  5 min setup
                </span>
              </div>
            </motion.div>

            {/* Right - Animated 3D Peak */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="relative w-full max-w-lg aspect-square">
                {/* Glow Effect Behind Image */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-full blur-[60px] scale-75"></div>

                {/* Solid Peak Image */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: showParticles ? 0 : 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <Image
                    src="/hero-peak-solid.png"
                    alt="Crystal peak visualization"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>

                {/* Particle Peak Image */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: showParticles ? 1 : 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <Image
                    src="/hero-peak-particles.png"
                    alt="Peak dissolving into data particles"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>

                {/* Floating Stats Cards */}
                <motion.div
                  className="absolute -left-4 top-1/4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-xs text-slate-400">Accuracy</div>
                  <div className="text-xl font-bold text-cyan-400">95%</div>
                </motion.div>

                <motion.div
                  className="absolute -right-4 top-1/3 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="text-xs text-slate-400">Time Saved</div>
                  <div className="text-xl font-bold text-purple-400">10h/wk</div>
                </motion.div>

                <motion.div
                  className="absolute left-1/4 -bottom-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="text-xs text-slate-400">Transactions</div>
                  <div className="text-xl font-bold text-blue-400">10K+/day</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-blue-100 text-blue-800 mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                Financial Excellence
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of tools is designed specifically for modern businesses
              who need powerful, yet simple financial management.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs font-medium">
                          {feature.highlight}
                        </Badge>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-purple-100 text-purple-800 mb-4">Benefits</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose
                <span className="block text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                  PeakFlow?
                </span>
              </h2>

              <div className="space-y-6">
                {[
                  { title: "Save 10+ Hours Weekly", description: "Automate tedious reconciliation and data entry tasks" },
                  { title: "95% Accuracy Guarantee", description: "AI-powered matching reduces errors and improves reliability" },
                  { title: "Seamless Integrations", description: "Connect with your existing banking and accounting systems" },
                  { title: "Enterprise Security", description: "Bank-level encryption and compliance standards" }
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    className="flex items-start space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">10,000+</div>
                    <div className="text-gray-600">Transactions Processed Daily</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/70 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 mb-1">95%</div>
                      <div className="text-sm text-gray-600">Accuracy Rate</div>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
                      <div className="text-sm text-gray-600">Support</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-green-100 text-green-800 mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Finance
              <span className="block text-transparent bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text">
                Professionals
              </span>
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={testimonial.name} variants={fadeInUp}>
                <Card className="p-6 h-full bg-white/80 backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>

                    <p className="text-gray-700 italic">"{testimonial.content}"</p>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-orange-100 text-orange-800 mb-4">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent
              <span className="block text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div key={plan.name} variants={fadeInUp}>
                <Card className={`p-8 h-full relative ${
                  plan.popular
                    ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50'
                    : 'bg-white border border-gray-200'
                }`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                      Most Popular
                    </Badge>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-gray-600 ml-2">/month</span>}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                    >
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Transform Your
              <span className="block">Financial Operations?</span>
            </h2>

            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of businesses who have streamlined their accounting with PeakFlow.
              Start your free trial today and see the difference.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg rounded-xl"
              >
                Schedule Demo
              </Button>
            </div>

            <div className="text-blue-100 text-sm">
              ✨ 14-day free trial • No credit card required • Cancel anytime
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/peakflow-logo.png"
                  alt="PeakFlow Accounting Software logo"
                  width={180}
                  height={120}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-gray-400">
                Simplifying financial operations for modern businesses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PeakFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}