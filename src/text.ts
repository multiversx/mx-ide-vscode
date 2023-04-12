export function withEndingPeriod(text: string) {
    return text.endsWith(".") ? text : text + ".";
}

export function withoutEndingPeriod(text: string) {
    return text.endsWith(".") ? text.slice(0, -1) : text;
}
