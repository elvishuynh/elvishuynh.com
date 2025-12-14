import type { Config } from "tailwindcss";
import fluid, { extract, screens, fontSize } from 'fluid-tailwind';

const config: Config = {
    content: {
        files: [
            "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
            "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
            "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        ],
        extract
    } as any,
    theme: {
        screens,
        fontSize,
        extend: {
            colors: {
                background: "#e8e6df",
                foreground: "#1d252d",
                grey: "#b1b3b3",
                highlight: {
                    orange: "#ff5f15",
                    yellow: "#ffa300",
                },
            },
            fontFamily: {
                sans: ["var(--font-satoshi)"],
                serif: ["var(--font-erode)"],
            },
        },
    },
    plugins: [
        fluid
    ],
};
export default config;
