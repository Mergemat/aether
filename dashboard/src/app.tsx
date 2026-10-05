import { Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Mappings } from "./components/mappings";
import { Stage } from "./components/stage";
import { TitleBar } from "./components/title-bar";
import { useWebcam } from "./hooks/use-webcam";
import { visionReady } from "./vision/engine";

function Workspace() {
  use(visionReady);
  const { videoRef, error } = useWebcam();

  if (error) {
    return (
      <Notice title="Camera access is off">
        Allow camera access for Aether in your system privacy settings (on
        macOS: System Settings → Privacy & Security → Camera), then reopen
        Aether.
      </Notice>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-1 pb-8 sm:px-6">
      <Stage videoRef={videoRef} />
      <Mappings />
    </main>
  );
}

export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <TitleBar />
      <ErrorBoundary
        fallbackRender={({ error }) => <VisionError error={error} />}
      >
        <Suspense fallback={<VisionLoader />}>
          <Workspace />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 pb-12">
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="font-medium text-print">{title}</h1>
        <div className="text-print-dim text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export const VisionLoader = () => (
  <div className="flex flex-1 items-center justify-center pb-12">
    <p className="silkscreen text-print-dim">Loading hand tracking…</p>
  </div>
);

export const VisionError = ({ error }: { error: unknown }) => (
  <Notice title="Hand tracking couldn't start">
    <p>Restart Aether to try again.</p>
    <p className="mt-3 border border-line px-3 py-2 font-mono text-print/80 text-xs">
      {error instanceof Error ? error.message : String(error)}
    </p>
  </Notice>
);
