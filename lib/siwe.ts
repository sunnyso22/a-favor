import { configureServerSideSIWE } from "connectkit-next-siwe";

import { ckChains, ckTransports } from "@/config/wagmi-config";

export const siweServer = configureServerSideSIWE({
    config: {
        chains: ckChains,
        transports: ckTransports,
    },
    session: {
        cookieName: "connectkit-next-siwe",
        password: process.env.BETTER_AUTH_SECRET,
        // cookieOptions: {
        //     secure: process.env.NODE_ENV === "production",
        // },
    },
});
