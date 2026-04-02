import Link from "next/link";
import { Stethoscope, Calendar, Clock, Shield, Heart, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HealthCare+
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Trusted by 10,000+ patients
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Health, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Our Priority
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Book appointments with top-rated doctors instantly. 
              No waiting, no hassle. Quality healthcare at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
              >
                Book an Appointment
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                Become a Doctor
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-gray-100">
              <div>
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-gray-500 mt-1 text-sm">Happy Patients</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">500+</div>
                <div className="text-gray-500 mt-1 text-sm">Expert Doctors</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">50+</div>
                <div className="text-gray-500 mt-1 text-sm">Specializations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-gray-500 mt-1 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Choose HealthCare+?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make healthcare accessible, convenient, and affordable for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Instant Booking"
              description="Book appointments 24/7 with just a few clicks. No phone calls, no waiting."
              color="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Expert Doctors"
              description="Verified and experienced doctors across all specializations."
              color="from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Zero Waiting Time"
              description="Get confirmed time slots. Visit the doctor at your scheduled time."
              color="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure & Private"
              description="Your medical data is encrypted and completely secure with us."
              color="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="AI Health Assistant"
              description="Get instant health advice and doctor recommendations from our AI."
              color="from-pink-500 to-rose-500"
            />
            <FeatureCard
              icon={<Stethoscope className="w-8 h-8" />}
              title="Digital Prescriptions"
              description="Access your prescriptions and medical records anytime, anywhere."
              color="from-violet-500 to-purple-500"
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl px-8 md:px-16 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              How It Works
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Book your appointment in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Search Doctor"
              description="Find the right doctor by specialization, location, or availability"
            />
            <StepCard
              number="02"
              title="Choose Time Slot"
              description="Select your preferred date and time from available slots"
            />
            <StepCard
              number="03"
              title="Get Confirmed"
              description="Receive instant confirmation and visit the doctor at scheduled time"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of patients who trust HealthCare+ for their healthcare needs
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
          >
            Create Free Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">HealthCare+</span>
            </div>
            <p className="text-sm">
              © 2025 HealthCare+. Built with ❤️ for better healthcare.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl font-bold text-white">{number}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-blue-100 leading-relaxed">{description}</p>
    </div>
  );
}
