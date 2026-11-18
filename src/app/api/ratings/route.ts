import { NextResponse } from "next/server";
import {
  loadOverridesFromStore,
  mergeOverrides,
  ratingsPersistenceMode,
  ratingsWriteAuthorized,
  saveOverridesToStore,
} from "@/lib/ratings-store";
import type { RnOverrides } from "@/lib/ratings-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overrides = await loadOverridesFromStore();
    return NextResponse.json({
      overrides,
      mode: ratingsPersistenceMode(),
      writeKeyRequired: Boolean(process.env.RATINGS_WRITE_KEY?.trim()),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load ratings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  if (!ratingsWriteAuthorized(req)) {
    return NextResponse.json(
      { error: "Write key required", writeKeyRequired: true },
      { status: 401 }
    );
  }
  try {
    const body = (await req.json()) as {
      overrides?: RnOverrides;
      merge?: RnOverrides;
    };
    let next: RnOverrides;
    if (body.merge && typeof body.merge === "object") {
      const current = await loadOverridesFromStore();
      next = mergeOverrides(current, body.merge);
    } else if (body.overrides && typeof body.overrides === "object") {
      next = body.overrides;
    } else {
      return NextResponse.json(
        { error: "Provide overrides or merge object" },
        { status: 400 }
      );
    }
    const result = await saveOverridesToStore(next);
    if (!result.persisted) {
      return NextResponse.json(
        {
          error:
            "Could not persist ratings. Set RATINGS_GITHUB_TOKEN on the host (Vercel env) so ratings sync across devices.",
          overrides: next,
          ...result,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ overrides: next, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save ratings" },
      { status: 500 }
    );
  }
}
