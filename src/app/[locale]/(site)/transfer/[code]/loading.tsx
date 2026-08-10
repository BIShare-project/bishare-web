import { FlowShell, FlowSkeletonCard } from "@/components/flow-shell";

export default function LoadingTransfer() {
  return (
    <FlowShell>
      <FlowSkeletonCard rows={2} />
    </FlowShell>
  );
}
