export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden text-[color:var(--ink)]">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(28,110,90,0.25),_transparent_60%)] blur-2xl" />
      <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(240,162,2,0.25),_transparent_60%)] blur-2xl float-slow" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(207,232,243,0.6),_transparent_60%)] blur-2xl float-slower" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-24 pt-10 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--sea)] text-white shadow-lg">
              OP
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight">
                OptiPic
              </div>
              <div className="text-sm text-[color:var(--muted)]">
                Image spa for the web
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition hover:border-black/20 hover:bg-white/70 sm:inline-flex">
              See Demo
            </button>
            <button className="rounded-full bg-[color:var(--ink)] px-5 py-2 text-sm font-medium text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black">
              Launch App
            </button>
          </div>
        </header>

        <main className="mt-16 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--sea)] shadow-sm">
              Spa-level image polish
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Convert, compress, and soothe your images into a flawless finish.
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--muted)]">
              OptiPic is a single-page studio for effortless image conversion
              and compression. Drop in your files, choose a style, and walk away
              with lighter, sharper, web-ready assets.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full bg-[color:var(--sea)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#195a4b]">
                Start Converting
              </button>
              <button className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-black/20 hover:bg-white">
                Explore Presets
              </button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-[color:var(--muted)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:var(--sea)]" />
                Batch friendly workflows
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:var(--sun)]" />
                Intuitive format switching
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:var(--ink)]" />
                Private by design
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="glass rise-in rounded-[28px] border border-white/60 p-6">
              <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                <span>Session</span>
                <span className="rounded-full bg-[color:var(--sky)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                  Live Preview
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">
                    Before
                  </div>
                  <div className="mt-3 h-40 rounded-xl bg-[linear-gradient(135deg,_#f0a202,_#f6d79b)]" />
                  <div className="mt-4 text-sm text-[color:var(--muted)]">
                    Original upload
                  </div>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">
                    After
                  </div>
                  <div className="mt-3 h-40 rounded-xl bg-[linear-gradient(135deg,_#1c6e5a,_#9fe3ce)]" />
                  <div className="mt-4 text-sm text-[color:var(--muted)]">
                    Optimized delivery
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 rounded-2xl border border-black/5 bg-white/80 p-4 text-sm text-[color:var(--muted)] sm:grid-cols-3">
                <div>
                  <div className="font-semibold text-[color:var(--ink)]">
                    Format
                  </div>
                  Web-ready exports
                </div>
                <div>
                  <div className="font-semibold text-[color:var(--ink)]">
                    Compression
                  </div>
                  Balanced quality controls
                </div>
                <div>
                  <div className="font-semibold text-[color:var(--ink)]">
                    Delivery
                  </div>
                  Download or share
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -top-6 hidden rounded-2xl bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--sea)] shadow-md sm:block">
              Effortless
            </div>
          </section>
        </main>

        <section className="mt-20 grid gap-6 lg:grid-cols-4">
          {[
            {
              title: "Smart Compression",
              body: "Dial quality with clarity and get small files without the crunch.",
            },
            {
              title: "Format Playground",
              body: "Switch formats with instant previews that show what changes.",
            },
            {
              title: "Batch Magic",
              body: "Process stacks of images in one calm, organized flow.",
            },
            {
              title: "Privacy First",
              body: "Your assets stay yours with clean, minimal handling.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass rounded-2xl border border-white/70 p-5 text-sm text-[color:var(--muted)]"
            >
              <div className="font-display text-lg font-semibold text-[color:var(--ink)]">
                {item.title}
              </div>
              <p className="mt-3">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <div className="font-display text-3xl font-semibold">
              A soothing flow from upload to export
            </div>
            <p className="text-[color:var(--muted)]">
              OptiPic keeps every step visible. You can prep, compare, and
              export without leaving the page.
            </p>
            <div className="grid gap-4">
              {[
                {
                  title: "1. Drop in your images",
                  body: "Drag, paste, or import from your library.",
                },
                {
                  title: "2. Choose your finish",
                  body: "Select a format and compression preset.",
                },
                {
                  title: "3. Export and share",
                  body: "Download instantly or send to teammates.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-black/5 bg-white/70 p-4 text-sm"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-[color:var(--sea)]" />
                  <div>
                    <div className="font-semibold text-[color:var(--ink)]">
                      {step.title}
                    </div>
                    <p className="mt-1 text-[color:var(--muted)]">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="glass rounded-2xl border border-white/60 p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Preset Library
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Clean JPG",
                  "Ultra WebP",
                  "Soft PNG",
                  "Hero AVIF",
                  "Social Pack",
                ].map((preset) => (
                  <span
                    key={preset}
                    className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] shadow-sm"
                  >
                    {preset}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-white/80 p-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">
                  Compression level
                </div>
                <div className="mt-3 h-2 rounded-full bg-[color:var(--sky)]">
                  <div className="h-2 w-2/3 rounded-full bg-[color:var(--sea)]" />
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  Balanced for clarity
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">
                  Format output
                </div>
                <div className="mt-3 flex gap-2 text-xs font-semibold text-[color:var(--muted)]">
                  <span className="rounded-full bg-white px-3 py-1 text-[color:var(--ink)] shadow-sm">
                    JPG
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1">
                    PNG
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1">
                    WebP
                  </span>
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  Tap to switch
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[32px] bg-[color:var(--ink)] px-8 py-12 text-white shadow-2xl sm:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Ready to polish?
              </div>
              <div className="mt-3 font-display text-3xl font-semibold">
                Give your images the glow-up they deserve.
              </div>
              <p className="mt-4 max-w-lg text-white/70">
                Launch OptiPic and enjoy a calm, focused workspace that gets
                files converted and compressed without the fuss.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5">
                Start Free
              </button>
              <button className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60">
                Talk to Us
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 text-sm text-[color:var(--muted)] sm:flex-row">
          <div>© 2026 OptiPic. All rights reserved.</div>
          <div className="flex gap-6">
            <button className="hover:text-[color:var(--ink)]">Privacy</button>
            <button className="hover:text-[color:var(--ink)]">Terms</button>
            <button className="hover:text-[color:var(--ink)]">Support</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
