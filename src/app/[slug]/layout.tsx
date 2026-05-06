import type { Metadata } from "next";
import { getAdminFirebase } from "@/lib/firebase/admin";

interface Props {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { db } = getAdminFirebase();
    const snap = await db
      .collection("tenants")
      .where("slug", "==", params.slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return { title: "Business Not Found" };
    }

    const tenant = snap.docs[0].data();
    return {
      title: tenant.businessName,
      description: `Book ${tenant.businessName} services online.`,
    };
  } catch {
    return { title: "Bookly" };
  }
}

export default function SlugLayout({ children }: Props) {
  return <>{children}</>;
}
