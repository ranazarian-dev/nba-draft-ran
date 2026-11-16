import { TeamDetail } from "@/components/team-detail";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TeamDetail code={code} />;
}
