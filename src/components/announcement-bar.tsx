import { TruckIcon } from "@/components/icons";

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="border-b border-line bg-paper-dim">
      <div className="mw-container flex h-9 items-center justify-center gap-2">
        <TruckIcon size={15} className="shrink-0 text-ink-soft" />
        <p className="text-[11px] font-medium tracking-[0.01em] text-ink-soft">{text}</p>
      </div>
    </div>
  );
}
