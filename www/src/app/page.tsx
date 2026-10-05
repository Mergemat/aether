import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { DownloadClient } from "@/components/DownloadClient";

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 md:px-12">{children}</div>
  );
}

export default function Home() {
  return (
    <div
      id="top"
      className="relative min-h-screen bg-background text-foreground selection:bg-primary/20"
    >
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <a
              href="#top"
              className="flex items-center gap-3 transition hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center">
                <Image
                  src="/icon.svg"
                  alt="Aether Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <div className="font-semibold text-lg tracking-tight">Aether</div>
            </a>

            <div className="flex items-center gap-4">
              <a
                className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:text-foreground text-muted-foreground"
                href="https://github.com/Mergemat/aether"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <section className="pt-20 pb-32 lg:pt-32">
          <Container>
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Open Source & Free
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl lg:leading-[1.1]">
                    Control your DAW with{" "}
                    <span className="text-primary">gestures</span>
                  </h1>

                  <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                    Turn gestures into OSC messages. Control faders, macros, and
                    effects in your DAW.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row" id="download">
                  <Suspense
                    fallback={
                      <DownloadClient options={[]}>
                        <Loader2 className="animate-spin" />
                      </DownloadClient>
                    }
                  >
                    <DownloadButton />
                  </Suspense>
                </div>
              </div>

              <Image
                src="/main.png"
                alt="Aether controls: a fader, knob, trigger and switch, each driven by a hand gesture"
                width={1644}
                height={560}
                priority
                className="w-full rounded-lg border border-border"
              />
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
