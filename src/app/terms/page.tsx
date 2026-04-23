import React from 'react';
import Link from 'next/link';
import StarryBackground from '../../components/StarryBackground';
import { ArrowLeft } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';

export default function TermsOfService() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: April 2024</p>
          </div>

          <div className="space-y-8 text-foreground/80 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the Chrono AI Assistant platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>Chrono is an AI-powered conversational assistant that allows users to interact with large language models, generate images, and search the web. The service is provided "as is" and we reserve the right to modify, suspend, or discontinue any part of the service at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Conduct and Responsibilities</h2>
              <p>You agree to use Chrono for lawful purposes only. You are solely responsible for all content you submit to the platform. You agree not to use the service to generate illegal, harmful, threatening, abusive, or explicitly offensive content.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Intellectual Property</h2>
              <p>All AI-generated content produced through Chrono remains yours, subject to the licensing terms of the underlying AI models (such as Google Gemini, Llama, or Cloudflare SDXL). The application's source code, design, and branding are the intellectual property of the Chrono developers.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Disclaimer of Warranties</h2>
              <p>Chrono makes no warranties about the accuracy, reliability, or correctness of the AI-generated responses. The AI can make mistakes, and you should always verify critical information. We disclaim all warranties, express or implied.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
              <p>In no event shall Chrono or its developers be liable for any indirect, incidental, special, consequential or punitive damages arising out of or relating to your use of the service.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
