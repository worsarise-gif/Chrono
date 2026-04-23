import React from 'react';
import Link from 'next/link';
import StarryBackground from '../../components/StarryBackground';
import { ArrowLeft } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] w-full relative bg-background text-foreground overflow-y-auto">
      <StarryBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="bg-surface/80 backdrop-blur-md border border-border/50 p-8 md:p-12 rounded-[32px] shadow-2xl">
          <div className="mb-10 text-center">
            <PlanetLogo className="text-foreground justify-center mb-6 transform scale-125" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: April 2024</p>
          </div>

          <div className="space-y-8 text-foreground/80 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>When you use Chrono, we collect information necessary to provide you with our services. This includes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Account Information:</strong> We collect basic profile data (name, email address, profile picture) through Google Authentication.</li>
                <li><strong>Chat Data:</strong> We store your conversation history, including user inputs and AI model responses, within Google Cloud Firestore.</li>
                <li><strong>Uploaded Media:</strong> Images you upload for visual analysis are temporarily processed and stored securely via Firebase Storage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to operate, maintain, and improve the Chrono AI Assistant. Your chat history is saved solely to provide you with continuous conversational context. We do not sell your personal information or chat data to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Third-Party AI Providers</h2>
              <p>To generate responses, your queries may be transmitted to our third-party AI partners (such as Google, Groq, Cerebras, and Cloudflare). These providers process your input strictly for the purpose of generating the requested output and are subject to their own data privacy regulations.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Security</h2>
              <p>We implement robust security measures to protect your personal information. Your data is secured using Firebase's built-in authentication and Firestore security rules, ensuring that only you (and authorized system administrators) can access your private chat histories.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention and Deletion</h2>
              <p>You retain full control over your chat data. You can delete individual messages, clear entire chat sessions, or request complete account deletion at any time from within the application interface.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
