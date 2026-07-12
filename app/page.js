import { auth } from "@/lib/auth";
import { HomeLanding } from "@/components/home/home-landing";

export default async function HomePage() {
  const session = await auth();

  return <HomeLanding isSignedIn={Boolean(session?.user?.id)} />;
}
