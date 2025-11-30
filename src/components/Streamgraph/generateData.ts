// Inspired by Lee Byron's test data generator.
export default function generateData(m: number, n: number): number[] {
    const a = new Array(m).fill(0);
    for (let i = 0; i < n; ++i) bump(a, m);
    return a;
}

function bump(a: number[], n: number) {
    const x = 1 / (0.1 + Math.random());
    const y = 2 * Math.random() - 0.5;
    const z = 10 / (0.1 + Math.random());
    for (let i = 0; i < n; ++i) {
        const w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
    }
}
