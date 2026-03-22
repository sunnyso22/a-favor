"use client";

import { useDisconnect } from "wagmi";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignInButton } from "@/components/SignInButton";
import { Logo } from "@/components/layout/Logo";

import { authClient } from "@/lib/auth-client";
import { shortenDisplayName } from "@/lib/helper";

const nav = [
    { href: "/forum", label: "Forum" },
    { href: "/studio", label: "Studio" },
    { href: "/marketplace", label: "Marketplace" },
];

const Header = () => {
    const pathname = usePathname();
    const disconnect = useDisconnect();
    const { data: session } = authClient.useSession();
    const sessionLabel = session?.user
        ? shortenDisplayName(session.user.name)
        : null;

    return (
        <header className="border-border bg-surface/90 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                <Link href="/" className="flex flex-col">
                    <Logo />
                </Link>

                <nav className="flex items-center gap-10">
                    {nav.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`text-xs tracking-[0.08em] transition ${
                                pathname?.startsWith(href)
                                    ? "text-clay"
                                    : "text-ink-muted hover:text-ink"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-5">
                    {session?.user && sessionLabel ? (
                        <>
                            <span
                                className={`text-ink-muted text-sm ${sessionLabel.mono ? "font-mono" : ""}`}
                            >
                                {sessionLabel.text}
                            </span>
                            <button
                                type="button"
                                onClick={async () => {
                                    await authClient.signOut();
                                    disconnect.mutate();
                                }}
                                className="text-ink-muted hover:text-ink text-sm"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <SignInButton
                            callbackURL={pathname || "/"}
                            label="Connect Wallet"
                            className="btn-dream btn-dream-primary cursor-pointer px-4 py-2 text-xs"
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
