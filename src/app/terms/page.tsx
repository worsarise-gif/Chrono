import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PlanetLogo } from '../../components/PlanetLogo';

export default function TermsOfUsePage() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0a0a0a] text-white font-sans font-extralight overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 w-full shrink-0 border-b border-white/10">
        <Link href="/" className="flex items-center group">
          <ArrowLeft size={20} className="mr-3 text-gray-400 group-hover:text-white transition-colors" />
          <PlanetLogo className="!text-white" />
        </Link>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:px-8 md:px-12">
        <h1 className="text-3xl sm:text-4xl font-normal mb-8 text-white">Terms of Use</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-medium text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Chrono, you accept and agree to be bound by the terms and provision of this agreement.
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              Any participation in this service will constitute acceptance of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">2. Description of Service</h2>
            <p>
              Chrono provides users with access to a rich collection of resources, including various AI communications tools, search services, and personalized content.
              You understand and agree that the Service is provided "AS-IS" and that Chrono assumes no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">3. User Conduct</h2>
            <p>
              You agree to use the Service only for lawful purposes. You agree not to take any action that might compromise the security of the Service, render the Service inaccessible to others, or otherwise cause damage to the Service or the Content.
              You agree not to add to, subtract from, or otherwise modify the Content, or to attempt to access any Content that is not intended for you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">4. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Chrono and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-[13px] text-gray-500 shrink-0 border-t border-white/10 mt-auto">
        &copy; {new Date().getFullYear()} Chrono. All rights reserved.
      </div>
    </div>
  );
}
