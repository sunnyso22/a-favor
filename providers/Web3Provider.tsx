"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig } from "wagmi";

import { ckChains, ckTransports } from "@/config/wagmi-config";

import { siweClient } from "@/lib/siwe-client";

export const ckConfig = createConfig(
    getDefaultConfig({
        chains: ckChains,
        transports: ckTransports,
        walletConnectProjectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
        appName: "aFavor",
        // Optional App Info
        // appDescription: "Your App Description",
        // appUrl: "https://family.co", // your app's url
        // appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
        enableFamily: false,
    })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiProvider config={ckConfig}>
            <QueryClientProvider client={queryClient}>
                <siweClient.Provider>
                    <ConnectKitProvider
                        mode="light"
                        customTheme={{
                            "--ck-accent-color": "#00D54B",
                            "--ck-accent-text-color": "#ffffff",
                        }}
                    >
                        {children}
                    </ConnectKitProvider>
                </siweClient.Provider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
