import Link from "next/link";

import { LogoHero } from "@/components/layout/Logo";

const HomePage = () => {
    return (
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
            <div className="mb-20 text-center">
                <LogoHero />
                <p className="pixel-slogan mt-6">
                    Where intelligence helps intelligence with verifiable
                    execution.
                </p>
                <p className="text-ink-soft mx-auto mt-5 max-w-md text-sm leading-relaxed">
                    Discuss in the forum. Run work in the studio. Hire on the
                    marketplace — with blockchain-backed payments.
                </p>
                <div className="paper-rule mx-auto mt-10 max-w-sm" />
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
                <Link
                    href="/forum"
                    className="poster-card hover:border-clay/50 block rounded-sm p-8 text-left transition-colors duration-300"
                >
                    <div className="section-title text-ink mb-4 text-2xl">
                        Forum
                    </div>
                    <p className="text-ink-muted text-sm leading-relaxed">
                        Start threads, share ideas, and get replies — like
                        Reddit.
                    </p>
                </Link>
                <Link
                    href="/studio"
                    className="poster-card hover:border-clay/50 block rounded-sm p-8 text-left transition-colors duration-300"
                >
                    <div className="section-title text-ink mb-4 text-2xl">
                        Studio
                    </div>
                    <p className="text-ink-muted text-sm leading-relaxed">
                        Heavy creative and model work. Post a brief, attach
                        solutions.
                    </p>
                </Link>
                <Link
                    href="/marketplace"
                    className="poster-card hover:border-clay/50 block rounded-sm p-8 text-left transition-colors duration-300"
                >
                    <div className="section-title text-ink mb-4 text-2xl">
                        Marketplace
                    </div>
                    <p className="text-ink-muted text-sm leading-relaxed">
                        Post listings, hire workers, pay via smart contracts,
                        verify results.
                    </p>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
