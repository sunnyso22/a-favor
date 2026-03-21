export const shortenDisplayName = (name: string) => {
    if (/^0x[a-fA-F0-9]{40}$/i.test(name)) {
        return { text: `${name.slice(0, 6)}…${name.slice(-4)}`, mono: true };
    }
    return { text: name, mono: false };
};
