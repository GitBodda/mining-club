import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";
import { GlassCard } from "@/components/GlassCard";
import { IOSStatusBar, IOSHomeIndicator } from "@/components/IOSStatusBar";
import { Button } from "@/components/ui/button";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <IOSStatusBar />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-16 pb-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-6"
        >
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="liquid-glass"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl liquid-glass flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last Updated: December 2024</p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <GlassCard delay={0.15} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Welcome to Mining Club ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cryptocurrency hashpower mining application and related services. By using Mining Club, you consent to the data practices described in this policy.
            </p>
          </GlassCard>

          <GlassCard delay={0.2} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">Personal Information:</strong> When you create an account, we collect your email address, name, and authentication credentials. If you use social login (Google or Apple), we receive basic profile information from those providers.</p>
              <p><strong className="text-foreground">Wallet Information:</strong> We collect cryptocurrency wallet addresses you provide for receiving mining rewards. We do not store private keys or seed phrases.</p>
              <p><strong className="text-foreground">Transaction Data:</strong> We maintain records of your hashpower purchases, mining contracts, payouts, and transaction history within the platform.</p>
              <p><strong className="text-foreground">Device Information:</strong> We automatically collect device type, operating system, unique device identifiers, and IP address for security and analytics purposes.</p>
              <p><strong className="text-foreground">Usage Data:</strong> We track how you interact with our app, including features used, pages visited, and time spent on the platform.</p>
            </div>
          </GlassCard>

          <GlassCard delay={0.25} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide, operate, and maintain our mining services</li>
                <li>Process hashpower purchases and distribute mining rewards</li>
                <li>Send transaction confirmations and payout notifications</li>
                <li>Respond to customer support inquiries</li>
                <li>Detect and prevent fraud, unauthorized access, and security threats</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Improve our services and develop new features</li>
                <li>Send promotional communications (with your consent)</li>
              </ul>
            </div>
          </GlassCard>

          <GlassCard delay={0.3} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing And Disclosure</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>We may share your information with:</p>
              <p><strong className="text-foreground">Service Providers:</strong> Third-party companies that help us operate our platform, including payment processors, cloud hosting providers, and analytics services.</p>
              <p><strong className="text-foreground">Mining Pool Partners:</strong> When you select a mining pool, relevant technical data may be shared to facilitate mining operations.</p>
              <p><strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation, or to protect our rights and the safety of our users.</p>
              <p><strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
            </div>
          </GlassCard>

          <GlassCard delay={0.35} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including encryption, secure socket layer (SSL) technology, and regular security audits. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </GlassCard>

          <GlassCard delay={0.4} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights And Choices</h2>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Data portability where applicable</li>
              </ul>
              <p className="mt-3">To exercise these rights, please contact us at privacy@miningclub.pro</p>
            </div>
          </GlassCard>

          <GlassCard delay={0.45} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies And Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and remember your preferences. You can control cookie settings through your browser, but disabling cookies may affect certain features of our application.
            </p>
          </GlassCard>

          <GlassCard delay={0.5} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. Transaction records may be retained for longer periods to comply with legal, accounting, and regulatory requirements. When data is no longer needed, we securely delete or anonymize it.
            </p>
          </GlassCard>

          <GlassCard delay={0.55} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">9. International Data Transfers</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws, including standard contractual clauses where required.
            </p>
          </GlassCard>

          <GlassCard delay={0.6} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Children's Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mining Club is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal information, please contact us immediately and we will take steps to delete such information.
            </p>
          </GlassCard>

          <GlassCard delay={0.65} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes To This Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically for any changes.
            </p>
          </GlassCard>

          <GlassCard delay={0.7} className="p-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact Us</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <p><strong className="text-foreground">Mining Club</strong></p>
              <p>Operated by Hardisk UAE Mining Farms</p>
              <p>Email: privacy@miningclub.pro</p>
              <p>Website: miningclub.pro</p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="mt-8 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">Mining Club App By Hardisk UAE Mining Farms</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
              ©
            </span>
          </div>
        </motion.footer>
      </main>
      
      <IOSHomeIndicator />
    </div>
  );
}
