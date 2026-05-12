import Image from "next/image";
import Link from "next/link";

const quickStats = [
  { value: "24/7", label: "Request access" },
  { value: "3 steps", label: "Average borrow flow" },
  { value: "Live", label: "Inventory visibility" },
];

const features = [
  {
    eyebrow: "Browse",
    title: "Available Equipment",
    desc: "See what is ready, reserved, or out on loan before you request it.",
  },
  {
    eyebrow: "Track",
    title: "Return Tracking",
    desc: "Keep return dates and checklist status visible for every borrower.",
  },
  {
    eyebrow: "Manage",
    title: "Admin Controls",
    desc: "Approve requests, update stock, and monitor circulation from one place.",
  },
];

const steps = [
  "Login or Register",
  "Choose Equipment",
  "Submit Request",
  "Wait for Approval",
  "Borrow & Return",
];

const equipment = [
  {
    name: "Rackets",
    img: "/images/equipment/badminton-racket.svg",
    note: "Best for badminton and tennis sessions",
  },
  {
    name: "Balls",
    img: "/images/equipment/basketball.svg",
    note: "Popular items with fast turnover",
  },
  {
    name: "Fitness Equipment",
    img: "/images/equipment/yoga-mat.svg",
    note: "Great for warmups, stretching, and training",
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(29,78,216,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_26%,rgba(7,17,31,0.28)_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="fade-up flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/6 px-5 py-3 shadow-[0_20px_55px_rgba(3,10,26,0.25)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/25">
              SB
            </span>
            <div>
              <div className="font-display text-lg tracking-tight text-white">SportBorrow</div>
              <div className="text-xs text-slate-300">Equipment borrowing made clear</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link href="/equipment" className="rounded-full px-4 py-2 text-slate-200 transition hover:bg-white/8 hover:text-white">
              Equipment
            </Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2 text-slate-200 transition hover:bg-white/8 hover:text-white">
              Dashboard
            </Link>
            <Link href="/login" className="rounded-full px-4 py-2 text-slate-200 transition hover:bg-white/8 hover:text-white">
              Login
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
          <div className="fade-up space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Fast access for students, staff, and admins
            </div>

            <div className="max-w-3xl space-y-5">
              <h1 className="font-display text-5xl leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Borrow sports equipment with less friction and more visibility.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                A focused system for requesting, tracking, and returning equipment without the usual spreadsheet chaos.
                See what is available, submit a request, and keep every handoff visible from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/equipment" className="app-btn-primary rounded-full px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5 sm:text-base">
                Browse equipment
              </Link>
              <Link href="/register" className="app-btn-secondary rounded-full px-6 py-3 text-sm font-semibold text-white/90 sm:px-7 sm:py-3.5 sm:text-base">
                Create account
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_40px_rgba(3,10,26,0.2)] backdrop-blur">
                  <div className="text-2xl font-display font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-up relative">
            <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="absolute -bottom-6 right-2 h-28 w-28 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_30px_80px_rgba(3,10,26,0.4)] backdrop-blur-xl sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.95),rgba(9,20,36,0.82))] p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>Live overview</span>
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] tracking-[0.2em] text-emerald-200">Updated</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <div className="text-sm text-slate-300">Ready for borrowing</div>
                      <div className="mt-1 text-2xl font-display text-white">Basketballs, rackets, mats</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <div className="text-sm text-slate-300">Request flow</div>
                      <div className="mt-1 text-2xl font-display text-white">Submit, approve, release</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                    <div className="text-sm text-slate-300">Borrowing checklist</div>
                    <div className="mt-3 space-y-3">
                      {steps.map((step, index) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/15 text-sm font-semibold text-cyan-100">
                            {index + 1}
                          </div>
                          <div className="text-sm text-slate-200">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-cyan-300/18 via-white/6 to-blue-500/18 p-5">
                    <div className="text-sm text-slate-300">Best for</div>
                    <div className="mt-2 font-display text-2xl text-white">Schools, clubs, and athletic departments</div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Keep equipment circulating efficiently while reducing missed returns and manual follow-up.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <section className="fade-up space-y-6 pb-10 pt-4 sm:pb-14">
          <SectionHeading
            eyebrow="Why it works"
            title="Clearer workflows for every role"
            description="The landing page now mirrors the product's purpose more directly: fast discovery for borrowers, cleaner tracking for staff, and simple control for admins."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[1.6rem] border border-white/10 bg-white/6 p-6 shadow-[0_20px_60px_rgba(3,10,26,0.18)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/8"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{feature.eyebrow}</div>
                <h3 className="mt-4 font-display text-2xl text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up space-y-6 pb-12 sm:pb-16">
          <SectionHeading
            eyebrow="Inventory"
            title="A quick glance at common equipment"
            description="Use the equipment catalog for the live state of stock, but keep the homepage focused on the items users expect to find first."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {equipment.map((item) => (
              <div
                key={item.name}
                className="group overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(3,10,26,0.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={item.img}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                    Available
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-2xl text-white">{item.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-cyan-300/15 bg-cyan-300/10 px-6 py-7 text-center shadow-[0_18px_50px_rgba(3,10,26,0.2)] sm:px-10">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Ready to start</div>
            <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Browse the catalog, create an account, or jump straight into the dashboard once you are signed in.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/equipment" className="app-btn-primary rounded-full px-6 py-3 text-sm font-semibold">
                View equipment
              </Link>
              <Link href="/login" className="app-btn-secondary rounded-full px-6 py-3 text-sm font-semibold text-white/90">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t border-white/10 py-6 text-sm text-slate-400">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="font-semibold text-slate-200">SportBorrow</div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link href="/equipment" className="transition hover:text-white">
                Equipment
              </Link>
              <Link href="/dashboard" className="transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/login" className="transition hover:text-white">
                Login
              </Link>
              <Link href="/register" className="transition hover:text-white">
                Register
              </Link>
            </div>
            <div>&copy; {new Date().getFullYear()} Sport Equipment Borrowing System</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
