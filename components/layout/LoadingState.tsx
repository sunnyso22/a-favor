type LoadingStateProps = {
    message?: string;
};

export const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl items-center justify-center px-4">
        <div className="text-center text-sm text-gray-400">{message}</div>
    </main>
);
