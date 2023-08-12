import { join } from "path";

export const CONFIG_DIR = join(__dirname, "..", "config");
export const LANGUAGE_DIR = join(CONFIG_DIR, "languages");

export const Languages = {
    python: {
        path: join(LANGUAGE_DIR, "python"),
        imageName: "pyexe",
        fileName: "/tmp/main.py",
        runScript: "/tmp/run.sh",
    },
    ricklang: {
        path: join(LANGUAGE_DIR, "ricklang"),
        imageName: "rrexe",
        fileName: "/code.rickroll",
        runScript: "/run.sh",
    },
    node: {
        path: join(LANGUAGE_DIR, "node"),
        imageName: "nodeexe",
        fileName: "/tmp/code.js",
        runScript: "/tmp/run.sh",
    },
    c: {
        path: join(LANGUAGE_DIR, "c"),
        imageName: "cexe",
        fileName: "/tmp/main.c",
        runScript: "/tmp/run.sh",
    }
} as const;
