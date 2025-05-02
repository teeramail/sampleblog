import type { AppProps } from "next/app";
import { TRPCReactProvider } from "~/trpc/react";
import "~/styles/globals.css";

// This is the Pages Router entry point
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TRPCReactProvider>
      <Component {...pageProps} />
    </TRPCReactProvider>
  );
}
