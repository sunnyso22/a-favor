"use client";

import Link from "next/link";

const Header = () => {
    return (
        <header className="border-foreground/10 border-b">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="text-lg font-semibold tracking-tight">
                    aFavor
                </Link>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-6 text-sm">
                        <Link
                            href="/llm-delegation"
                            className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                            LLM
                        </Link>
                        {/* <Link
                            href="/wallet"
                            className="text-foreground/60 hover:text-foreground transition-colors"
                        >
                            Wallet
                        </Link> */}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
