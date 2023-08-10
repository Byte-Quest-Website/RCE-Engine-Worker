import { join } from "path";

export const CONFIG_DIR = join(__dirname, "..", "config");

export const Languages = {
    python: {
        path: join(CONFIG_DIR, "python"),
        imageName: "pyexe",
        fileName: "/tmp/main.py",
        runScript: "/tmp/run.sh",
    },
} as const;
