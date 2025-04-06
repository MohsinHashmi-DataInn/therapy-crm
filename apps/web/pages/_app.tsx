import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/auth-provider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
