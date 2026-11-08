import { redirect } from 'next/navigation';

export default async function SearchRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  if (params?.q) {
    redirect(`/inquiry?q=${encodeURIComponent(params.q)}`);
  }
  redirect('/inquiry');
}
