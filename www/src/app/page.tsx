
function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl rounded-xl border border-zinc-200 bg-zinc-50 p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-zinc-900 shadow-inner relative">
        <svg
          className="h-full w-full opacity-50"
          viewBox="0 0 800 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-labelledby="app-preview-title"
          role="img"
        >
          <title id="app-preview-title">Aether Application Interface Preview</title>
          <rect width="800" height="450" fill="#18181b" />
          <circle cx="400" cy="225" r="80" stroke="#52525b" strokeWidth="2" />
          <path d="M350 225H450" stroke="#52525b" strokeWidth="2" />
          <path d="M400 175V275" stroke="#52525b" strokeWidth="2" />
          {/* Mock UI elements */}
          <rect x="50" y="50" width="100" height="350" rx="8" fill="#27272a" />
          <rect x="650" y="50" width="100" height="350" rx="8" fill="#27272a" />
          <rect x="200" y="350" width="400" height="50" rx="8" fill="#27272a" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-zinc-500 font-mono text-sm">App Interface Preview</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <div className="text-xl font-bold tracking-tighter">Aether</div>
        <nav className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Features</a>
          <a href="#download" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Download</a>
          <a href="https://github.com/bagautdin/aether" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">GitHub</a>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center">
        {/* Hero Section */}
        <section className="flex w-full max-w-5xl flex-col items-center px-6 py-24 text-center md:py-32">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Control your DAW <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-zinc-500 to-zinc-900 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-500">
              with gestures.
            </span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Aether redefines music production workflow. Use intuitive hand gestures to control faders, automation, and effects in real-time.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row" id="download">
            <a
              href="#download-mac"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Download for Mac
            </a>
            <a
              href="#download-win"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-transparent px-8 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Download for Windows
            </a>
          </div>
        </section>

        {/* Preview Section */}
        <section className="w-full px-6 pb-24">
          <AppPreview />
        </section>

        {/* Features Section */}
        <section id="features" className="grid w-full max-w-5xl grid-cols-1 gap-12 px-6 py-24 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <svg className="h-5 w-5 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Gesture Control</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Map hand movements to any MIDI or OSC parameter in your DAW.</p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <svg className="h-5 w-5 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Fast & Responsive</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Built with Rust and Electron for low-latency performance essential for live use.</p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <svg className="h-5 w-5 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Customizable</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Create your own gesture presets and share them with the community.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Aether. Open Source.
          </p>
        </div>
      </footer>
    </div>
  );
}
