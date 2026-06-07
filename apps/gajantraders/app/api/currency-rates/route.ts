export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Failed to fetch rates' }, { status: 502 });
  }
}
