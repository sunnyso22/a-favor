"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig } from "wagmi";

import { ckChains, ckTransports } from "@/config/wagmi-config";

export const ckConfig = createConfig(
    getDefaultConfig({
        chains: ckChains,
        transports: ckTransports,
        walletConnectProjectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
        appName: "Trexe",
        enableFamily: false,
    })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiProvider config={ckConfig}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider
                    mode="light"
                    customTheme={{
                        "--ck-accent-color": "#00D54B",
                        "--ck-accent-text-color": "#ffffff",
                    }}
                >
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
