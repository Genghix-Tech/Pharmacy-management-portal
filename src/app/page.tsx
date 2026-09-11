import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  Printer,
  Receipt,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "PharmaFlow — Everything your pharmacy needs, in one place.",
};

const FEATURES = [
  {
    icon: Boxes,
    title: "Inventory Management",
    description: "Track every medicine's stock, batch, pricing and expiry in one organized catalogue — with automatic low-stock and expiry alerts.",
  },
  {
    icon: ShoppingCart,
    title: "POS & Billing",
    description: "A fast checkout built for the counter — barcode scanning, discounts, tax, and professional invoices generated instantly.",
  },
  {
    icon: Receipt,
    title: "Sales Tracking",
    description: "Every sale is logged with items, payment method and profit — searchable, filterable, and ready to refund when needed.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Sales, profit, inventory, purchase and expense reports for any date range — printable and ready to share.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Keep customer contacts and purchase history on hand to speed up checkout and build lasting relationships.",
  },
  {
    icon: Truck,
    title: "Supplier Management",
    description: "Track suppliers, restock purchases, and outstanding balances so nothing falls through the cracks.",
  },
];

const BENEFITS = [
  { icon: ShieldCheck, title: "Secure by design", description: "Every pharmacy's data is isolated with row-level security — your data is never visible to anyone else." },
  { icon: Zap, title: "Built for speed", description: "A POS that keeps up with a busy counter, with barcode scanning and instant search." },
  { icon: Printer, title: "Professional invoices", description: "Print or download A4 and receipt-style invoices your customers will trust." },
  { icon: Smartphone, title: "Works everywhere", description: "A responsive design that works beautifully on desktop, tablet and mobile." },
];

const WORKFLOW = [
  { icon: ScanLine, title: "Scan or search", description: "Find any medicine instantly by name, SKU or barcode at the POS." },
  { icon: ShoppingCart, title: "Check out", description: "Apply discounts and tax, pick a payment method, and complete the sale." },
  { icon: Bell, title: "Stay ahead", description: "Get notified the moment stock runs low or a batch is about to expire." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-teal-50/60 to-background dark:from-teal-950/20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              Modern pharmacy management, built for owners
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Everything your pharmacy needs, <span className="text-primary">in one place.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              PharmaFlow brings inventory, billing, sales, customers, suppliers and reporting into one secure,
              modern platform — so you can spend less time on paperwork and more time on your patients.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/signup" />}>
                Start Managing Your Pharmacy <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/login" />}>
                Sign in
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">No credit card required — set up your pharmacy workspace in minutes.</p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Every part of your pharmacy, connected</h2>
          <p className="mt-3 text-muted-foreground">One system for the whole operation — no more juggling spreadsheets and paper ledgers.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">A checkout counter that keeps up with you</h2>
            <p className="mt-3 text-muted-foreground">From search to sale to receipt, in seconds.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {WORKFLOW.map((w, i) => (
              <div key={w.title} className="relative text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <w.icon className="size-6" />
                </div>
                <p className="mb-1 text-xs font-semibold text-primary">STEP {i + 1}</p>
                <h3 className="mb-1.5 font-semibold">{w.title}</h3>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground">{w.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight">Why pharmacy owners choose PharmaFlow</h2>
            <p className="mb-8 text-muted-foreground">
              Built from the ground up as a real, secure multi-tenant platform — not a spreadsheet with a nicer coat of paint.
            </p>
            <div className="space-y-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="mb-4 font-semibold">Everything included</h3>
            <ul className="space-y-3 text-sm">
              {[
                "Unlimited medicines, categories & suppliers",
                "POS with barcode scanning",
                "Professional printable invoices",
                "Low stock & expiry alerts",
                "Sales, profit & inventory reports",
                "Role-based staff access",
                "Light & dark mode",
                "Works on any device",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to modernize your pharmacy?</h2>
          <p className="mx-auto mt-3 max-w-xl text-teal-100">
            Join pharmacy owners who&apos;ve replaced spreadsheets and paper ledgers with one secure, modern system.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" render={<Link href="/signup" />}>
              Start Managing Your Pharmacy <ArrowRight />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
          <Logo href="/" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PharmaFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
