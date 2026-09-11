import { Logo } from "@/components/brand/logo";
import { CheckCircle2 } from "lucide-react";

const HIGHLIGHTS = [
  "Real-time inventory with low-stock & expiry alerts",
  "A fast POS with barcode scanning built in",
  "Professional invoices, printable in one click",
  "Sales, purchases, and profit reports that stay in sync",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]"
        />
        <Logo className="relative text-white" href="/" />
        <div className="relative space-y-8">
          <blockquote className="space-y-3">
            <p className="text-2xl leading-snug font-medium text-balance">
              &ldquo;Everything your pharmacy needs, in one place.&rdquo;
            </p>
            <p className="text-sm text-teal-100">
              Built for independent pharmacy owners who want their inventory, billing and reporting to
              finally live in one modern, secure system.
            </p>
          </blockquote>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-teal-50">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-teal-200/70">© {new Date().getFullYear()} PharmaFlow. All rights reserved.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo href="/" />
          </div>
          {children}
        </div>
        <p className="mx-auto mt-8 max-w-sm text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} PharmaFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}

