import { redirect } from "next/navigation";

/**
 * Auth is email and password, so there is no separate verification step. The
 * spec reserved this route for OTP entry; it stays as a redirect so any link
 * already in the wild lands on the sign-in form rather than a 404.
 */
export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/market/signin`);
}
