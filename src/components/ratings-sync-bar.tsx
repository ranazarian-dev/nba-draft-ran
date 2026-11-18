"use client";

import { useState } from "react";
import { useData } from "@/components/data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RatingsSyncBar() {
  const {
    ratingsSyncStatus,
    ratingsSyncMessage,
    writeKeyRequired,
    setRatingsWriteKey,
    retryRatingsSave,
  } = useData();
  const [keyDraft, setKeyDraft] = useState("");

  const tone =
    ratingsSyncStatus === "error" || ratingsSyncStatus === "needs-key"
      ? "border-amber-500/40 bg-amber-50 text-amber-950"
      : ratingsSyncStatus === "saving"
        ? "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-soft)]"
        : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-soft)]";

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {ratingsSyncStatus === "loading" && "Loading shared ratings…"}
          {ratingsSyncStatus === "saving" && "Saving ratings…"}
          {ratingsSyncStatus === "synced" &&
            (ratingsSyncMessage || "Ratings synced across devices.")}
          {ratingsSyncStatus === "needs-key" &&
            (ratingsSyncMessage || "Write key required to save.")}
          {ratingsSyncStatus === "error" &&
            (ratingsSyncMessage || "Could not sync ratings.")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {(writeKeyRequired || ratingsSyncStatus === "needs-key") && (
            <>
              <Input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="Ratings write key"
                className="h-8 w-44"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRatingsWriteKey(keyDraft)}
              >
                Unlock save
              </Button>
            </>
          )}
          {(ratingsSyncStatus === "error" ||
            ratingsSyncStatus === "needs-key") && (
            <Button size="sm" variant="outline" onClick={retryRatingsSave}>
              Retry save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
