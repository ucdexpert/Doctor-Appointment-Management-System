"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Shield, 
  Heart, 
  Users, 
  ArrowRight,
  Star,
  CheckCircle2,
  Zap
} from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  const features = [
    {
      icon: <Calendar className="w-7 h-7" />,
      title: "Instant Booking",
      description: "Book appointments 24/7 with just a few clicks. No waiting, no hassle.",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Expert Doctors",
      description: "Verified and experienced doctors across all specializations.",
      color: "from-indigo-500 to-purple-500",
      gradient: "bg-gradient-to-br from-indigo-500/10 to-purple-500/10",
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: "Zero Waiting Time",
      description: "Get confirmed time slots. Visit the doctor at your scheduled time.",
      color: "from-orange-500 to-red-500",
      gradient: "bg-gradient-to-br from-orange-500/10 to-red-500/10",
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Secure & Private",
      description: "Your medical data is encrypted and completely secure with us.",
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/10",
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: "AI Health Assistant",
      description: "Get instant health advice and doctor recommendations from our AI.",
      color: "from-pink-500 to-rose-500",
      gradient: "bg-gradient-to-br from-pink-500/10 to-rose-500/10",
    },
    {
      icon: <Stethoscope className="w-7 h-7" />,
      title: "Digital Prescriptions",
      description: "Access your prescriptions and medical records anytime, anywhere.",
      color: "from-violet-500 to-purple-500",
      gradient: "bg-gradient-to-br from-violet-500/10 to-purple-500/10",
    },
  ];

  const stats = [
    { value: "10K+", label: "Happy Patients", icon: Users },
    { value: "500+", label: "Expert Doctors", icon: Stethoscope },
    { value: "50+", label: "Specializations", icon: Heart },
    { value: "24/7", label: "Support", icon: Zap },
  ];

  const steps = [
    {
      number: "01",
      title: "Search Doctor",
      description: "Find the right doctor by specialization, location, or availability",
      icon: <Users className="w-8 h-8" />,
    },
    {
      number: "02",
      title: "Choose Time Slot",
      description: "Select your preferred date and time from available slots",
      icon: <Calendar className="w-8 h-8" />,
    },
    {
      number: "03",
      title: "Get Confirmed",
      description: "Receive instant confirmation and visit the doctor at scheduled time",
      icon: <CheckCircle2 className="w-8 h-8" />,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Ahmed",
      role: "Patient",
      content: "Amazing experience! Booked an appointment in 2 minutes. No more waiting in long queues.",
      rating: 5,
      avatar: "SA",
    },
    {
      name: "Dr. Ali Khan",
      role: "Cardiologist",
      content: "This platform has transformed how I connect with my patients. Highly recommended!",
      rating: 5,
      avatar: "AK",
    },
    {
      name: "Fatima Noor",
      role: "Patient",
      content: "The AI health assistant is incredible. Got instant advice and found the perfect doctor.",
      rating: 5,
      avatar: "FN",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <main className="container mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="py-16 md:py-24"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm hover:shadow-md transition-shadow">
              <Shield className="w-4 h-4" />
              Trusted by 10,000+ patients across Pakistan
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 mb-8 leading-[1.1]"
            >
              Your Health,{" "}
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Our Priority
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Book appointments with top-rated doctors instantly.
              <br className="hidden md:block" />
              No waiting, no hassle. Quality healthcare at your fingertips.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link
                href="/patient/doctors"
                className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Book an Appointment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/register?role=doctor"
                className="px-10 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-semibold text-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all transform hover:-translate-y-1"
              >
                Become a Doctor
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-12 border-t border-gray-200"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3 group-hover:bg-blue-200 transition-colors">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4"
            >
              <Star className="w-4 h-4" />
              Features
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose HealthCare+?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make healthcare accessible, convenient, and affordable for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group p-8 ${feature.gradient} rounded-3xl border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simple Process
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Book your appointment in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center group"
                whileHover={{ scale: 1.05 }}
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-2/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300" />
                )}
                
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-6 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-shadow">
                  <span className="text-3xl font-bold text-white">{step.number}</span>
                  <div className="absolute -inset-2 bg-blue-400/20 rounded-full animate-ping opacity-75" />
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-4"
            >
              <Star className="w-4 h-4" />
              Testimonials
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real experiences from real people
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 mb-16"
        >
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] px-8 md:px-16 py-20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6"
              >
                <Heart className="w-4 h-4" />
                Join Our Community
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of patients who trust HealthCare+ for their healthcare needs. 
                Create your free account today!
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all transform hover:-translate-y-1"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
