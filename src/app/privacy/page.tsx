import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0a0a0a] text-foreground font-sans font-extralight overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 w-full shrink-0 border-b border-border">
        <Link href="/" className="flex items-center group">
          <ArrowLeft size={20} className="mr-3 text-foreground-muted group-hover:text-foreground transition-colors" />
          <PlanetLogo className="!text-foreground" />
        </Link>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:px-8 md:px-12">
        <h1 className="text-3xl sm:text-4xl font-normal mb-8 text-foreground">Privacy Policy</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">1. Information We Collect</h2>
            <p>
              We collect information to provide better services to all our users. The types of information we collect include:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Information you create or provide to us, including authentication details via Google Accounts.</li>
              <li>Information we collect as you use our services, such as chat prompts, voice audio for transcription, image generation prompts, and web search queries.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">2. How We Use Information</h2>
            <p>
              We use the information we collect from all our services for the following purposes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide our services.</li>
              <li>Maintain and improve our services.</li>
              <li>Develop new services.</li>
              <li>Measure performance and communicate with you.</li>
              <li>Protect Chrono, our users, and the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">3. Data Security</h2>
            <p>
              We work hard to protect Chrono and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
              In particular, we encrypt many of our services using SSL and review our information collection, storage, and processing practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">4. Sharing Your Information</h2>
            <p>
              We do not share personal information with companies, organizations, or individuals outside of Chrono except in the following cases:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>With your consent.</li>
              <li>For external processing by third-party API providers, including Groq, Cerebras, Google GenAI, Cloudflare, and Tavily, which are used to process user inputs. Web search queries are temporarily cached in Firebase/Firestore for up to 72 hours.</li>
              <li>For legal reasons if we have a good-faith belief that access, use, preservation, or disclosure of the information is reasonably necessary to meet any applicable law, regulation, legal process, or enforceable governmental request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">5. Changes to This Policy</h2>
            <p>
              We change this Privacy Policy from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent.
              We always indicate the date the last changes were published and we offer access to archived versions for your review.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-[13px] text-foreground-subtle shrink-0 border-t border-border mt-auto">
        &copy; {new Date().getFullYear()} Chrono. All rights reserved.
      </div>
    </div>
  );
}
