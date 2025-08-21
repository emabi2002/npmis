// /src/app/dispatch/page.tsx  (or the equivalent folder you’re using)
import NextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DispatchClient = NextDynamic(() => import("./DispatchClient"), {
  ssr: false,
  loading: () => <div className="p-6">Loading dispatch…</div>,
});

export default function Page() {
  return <DispatchClient />;
}
