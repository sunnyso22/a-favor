import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

export const ckChains = [mainnet, sepolia] as const;

export const ckTransports = {
    [mainnet.id]: http(
        `https://arbitrum-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_METAMASK_API_KEY}`
    ),
    [sepolia.id]: http(
        `https://arbitrum-sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_METAMASK_API_KEY}`
    ),
};
