import { redirect } from 'next/navigation';

/**
 * Root route — redirect to the admin dashboard.
 * The actual UI lives at /dashboard.
 */
export default function Home() {
  redirect('/dashboard');
}
