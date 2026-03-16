"use client";

import { authClient } from "@/lib/auth-client";

const LoginForm = () => {
    const handleSignInWithX = async () => {
        const data = await authClient.signIn.social({
            provider: "twitter",
        });
        console.log(data);
    };

    return (
        <div>
            <div>
                <button onClick={handleSignInWithX}>Continue with X</button>
            </div>
        </div>
    );
};

export default LoginForm;
