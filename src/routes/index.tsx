import { createFileRoute } from "@tanstack/react-router";
import { DecoderPanel } from "@/components/av/DecoderPanel";
import { EncoderPanel } from "@/components/av/EncoderPanel";
import { EventLog } from "@/components/av/EventLog";
import { NetworkMap } from "@/components/av/NetworkMap";
import { DECODERS } from "@/lib/av-sim";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AV-over-IP Multicast Signage Simulation" },
      {
        name: "description",
        content:
          "Simulated encoder, managed switch and three decoders streaming identical digital signage to Canning, Padang and Collyer Rooms.",
      },
      { property: "og:title", content: "AV-over-IP Multicast Signage Dashboard" },
      {
        property: "og:description",
        content: "One source, one multicast stream, three identical displays — an interactive classroom simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="grid h-full gap-3 p-3 lg:grid-cols-[minmax(300px,25%)_1fr_minmax(340px,27%)]">
      <div className="min-h-0 lg:overflow-y-auto">
        <EncoderPanel />
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <section className="panel relative flex min-h-[360px] flex-1 flex-col p-3">
          <div className="flex items-center justify-between">
            <span className="panel-label">Network · Multicast distribution</span>
            <span className="font-mono text-[0.6rem] text-muted-foreground/70">Example addressing · simulated</span>
          </div>
          <div className="min-h-0 flex-1">
            <NetworkMap />
          </div>
        </section>
        <EventLog className="h-36 shrink-0" />
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <span className="panel-label px-1">Endpoints · Decoders &amp; displays</span>
        {DECODERS.map((d) => (
          <DecoderPanel key={d.id} decoder={d} />
        ))}
      </div>
    </div>
  );
}
