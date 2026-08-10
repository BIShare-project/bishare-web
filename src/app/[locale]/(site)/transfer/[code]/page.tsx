import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getTransferStatus } from "@/lib/api";
import { bumpStat } from "@/lib/stats-bump";
import { formatFileSize } from "@/lib/format";
import { AppPromo } from "@/components/app-promo";
import { FileTypeTile } from "@/components/file-icon";
import { FlowShell, FlowStatusCard } from "@/components/flow-shell";
import { FadeUp } from "@/components/site/motion";
import { TagBadge } from "@/components/site/status-pill";
import { VButton } from "@/components/site/vbutton";
import { CheckCircle2, CloudOff, FileX, Flame, Hourglass } from "lucide-react";
import { DownloadTransferButton, ExpiryCountdown } from "./transfer-actions";

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

/** Ephemeral deep links must never be indexed (review #20). */
const NOINDEX = { robots: { index: false, follow: false } } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const tr = await getTranslations({ locale, namespace: "flows" });
  const res = await getTransferStatus(code);

  if (!res.success || !res.data) {
    return { title: tr("transfer.metaNotFoundTitle"), ...NOINDEX };
  }

  const t = res.data;
  if (t.oneTime && t.isDownloaded) {
    return { title: tr("transfer.metaAlreadyDownloadedTitle"), ...NOINDEX };
  }
  const size = formatFileSize(t.fileSize, locale);
  const description = t.senderAlias
    ? tr("transfer.metaDescFrom", { size, sender: t.senderAlias })
    : tr("transfer.metaDesc", { size });
  return {
    title: t.fileName,
    description,
    openGraph: {
      title: t.fileName,
      description: tr("transfer.ogDesc", { size }),
      type: "website",
      siteName: "BIShare",
    },
    ...NOINDEX,
  };
}

export default async function TransferPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const tr = await getTranslations("flows");
  const res = await getTransferStatus(code);

  if (!res.success || !res.data) {
    const errorCode = res.error?.code;
    const isServerIssue = errorCode === "SERVER_ERROR" || errorCode === "NETWORK_ERROR";
    const isRateLimited = errorCode === "RATE_LIMITED";

    return (
      <FlowShell>
        {isRateLimited ? (
          <FlowStatusCard
            icon={Hourglass}
            title={tr("transfer.rateLimit.title")}
            message={tr("transfer.rateLimit.message")}
            tone="primary"
          >
            <VButton href={`/transfer/${code}`} variant="secondary" size="md">
              {tr("transfer.rateLimit.action")}
            </VButton>
          </FlowStatusCard>
        ) : isServerIssue ? (
          <FlowStatusCard
            icon={CloudOff}
            title={tr("transfer.server.title")}
            message={tr("transfer.server.message")}
          >
            <VButton href={`/transfer/${code}`} variant="secondary" size="md">
              {tr("transfer.server.action")}
            </VButton>
          </FlowStatusCard>
        ) : (
          <FlowStatusCard
            icon={FileX}
            title={tr("transfer.notFound.title")}
            message={tr("transfer.notFound.message")}
          >
            <VButton href="/transfer" variant="secondary" size="md">
              {tr("transfer.notFound.action")}
            </VButton>
          </FlowStatusCard>
        )}
        <AppPromo />
      </FlowShell>
    );
  }

  const t = res.data;

  // Receive-loop: a recipient is viewing a live transfer — the highest-intent,
  // free brand impression. Count it (best-effort) to measure the loop.
  bumpStat("receive_views");

  // A consumed one-time transfer still returns SUCCESS from the status
  // endpoint — render the terminal state instead of a dead download button.
  if (t.oneTime && t.isDownloaded) {
    return (
      <FlowShell>
        <FlowStatusCard
          icon={CheckCircle2}
          title={tr("transfer.alreadyDownloaded.title")}
          message={tr("transfer.alreadyDownloaded.message")}
        >
          <VButton href="/transfer" variant="secondary" size="md">
            {tr("transfer.alreadyDownloaded.action")}
          </VButton>
        </FlowStatusCard>
        <AppPromo />
      </FlowShell>
    );
  }

  return (
    <FlowShell>
      <FadeUp>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <FileTypeTile mimeType={t.mimeType} />

          <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em] break-all">
            {t.fileName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatFileSize(t.fileSize, locale)}
            {t.senderAlias && (
              <> · {tr("transfer.from", { sender: t.senderAlias })}</>
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <ExpiryCountdown expiresAt={t.expiresAt} />
            {t.oneTime && <TagBadge>{tr("transfer.oneTime")}</TagBadge>}
          </div>

          <div className="mt-6">
            <DownloadTransferButton
              code={t.code}
              oneTime={t.oneTime}
              fileName={t.fileName}
              fileSize={t.fileSize}
            />
          </div>

          {t.oneTime && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-muted-foreground" />
              {tr("transfer.oneTimeNote")}
            </p>
          )}
        </div>
      </FadeUp>
      <AppPromo />
    </FlowShell>
  );
}
