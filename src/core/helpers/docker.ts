import { join } from "path";
import { exec, spawn } from "child_process";
import { CONFIG_DIR, LANGUAGE_DIR } from "./constants";

import {
    RunCodeInfo,
    ContainerResponse,
    AsyncExecPromise,
    TestCodeInfo,
} from "./types";

async function asyncExecCode(command: string): Promise<AsyncExecPromise> {
    return new Promise(function (resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }

            resolve({ error, stdout, stderr });
        });
    });
}

async function getMemoryKilled(containerName: string): Promise<boolean> {
    return (
        (
            await asyncExecCode(
                `docker container inspect --format='{{.State.OOMKilled}}' ${containerName}`
            )
        ).stdout.trim() === "true"
    );
}

async function getExecutionTime(containerName: string): Promise<number> {
    let startTime = (
        await asyncExecCode(
            `docker container inspect --format='{{.State.StartedAt}}' ${containerName}`
        )
    ).stdout.trim();
    let endTime = (
        await asyncExecCode(
            `docker container inspect --format='{{.State.FinishedAt}}' ${containerName}`
        )
    ).stdout.trim();

    return new Date(endTime).getTime() - new Date(startTime).getTime();
}

export async function imageExists(imageName: string): Promise<boolean> {
    return (
        (await asyncExecCode(`docker images -q ${imageName} 2> /dev/null`))
            .stdout != ""
    );
}

export async function buildImage(
    imageName: string,
    language: string
): Promise<AsyncExecPromise> {
    const buildScript = join(CONFIG_DIR, "build.sh");
    const filePath = join(LANGUAGE_DIR, language);

    return await asyncExecCode(`bash ${buildScript} ${imageName} ${filePath}`);
}

export async function runCodeInContainer(
    data: RunCodeInfo
): Promise<ContainerResponse> {
    const TIME_LIMIT = 5;
    const MEMORY_LIMIT = "25mb";

    const runScript = join(CONFIG_DIR, "run.sh");
    await asyncExecCode(`chmod 644 ${data.codeFileSrc}`);

    const volume1 = `${data.codeFileSrc}:${data.codeFileDes}`;
    const volume2 = `${data.runFileSrc}:${data.runFileDes}`;
    const volume3 = `${data.envFileSrc}:${data.envFileDes}`;

    const command = `bash ${runScript} ${TIME_LIMIT} ${MEMORY_LIMIT} ${volume1} ${volume2} ${volume3} ${data.containerName} ${data.imageName} ${data.inputFileSrc}`;

    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, { shell: true });

        let stdout = "";
        let stderr = "";

        childProcess.stdout.on("data", (data) => (stdout += data));
        childProcess.stderr.on("data", (data) => (stderr += data));

        childProcess.on("error", (error) => reject({ error, stderr }));

        childProcess.on("close", async (code) => {
            const executionTime = await getExecutionTime(data.containerName);
            const outOfMemory = await getMemoryKilled(data.containerName);
            const exitCode = code ?? 0;
            const timedOut =
                stderr.includes("sudo timeout -s SIGKILL") &&
                exitCode == 137 &&
                !outOfMemory;

            resolve({
                stdout: stdout,
                stderr: stderr,
                exitCode,
                executionTime,
                outOfMemory,
                timedOut,
            });
        });
    });
}

export async function TestCodeInContainer(
    data: TestCodeInfo,
    time_limit: number,
    memory_limit: string
): Promise<ContainerResponse> {
    const runScript = join(CONFIG_DIR, "test.sh");
    await asyncExecCode(`chmod 644 ${data.codeFileSrc}`);

    const volume1 = `${data.codeFileSrc}:/tmp/code.py`;
    const volume2 = `${data.dataFileSrc}:/tmp/data.json`;

    const command = `bash ${runScript} ${time_limit} ${memory_limit} ${volume1} ${volume2} ${data.containerName}`;

    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, { shell: true });

        let stdout = "";
        let stderr = "";

        childProcess.stdout.on("data", (data) => (stdout += data));
        childProcess.stderr.on("data", (data) => (stderr += data));

        childProcess.on("error", (error) => reject({ error, stderr }));

        childProcess.on("close", async (code) => {
            const executionTime = await getExecutionTime(data.containerName);
            const outOfMemory = await getMemoryKilled(data.containerName);
            const exitCode = code ?? 0;
            const timedOut =
                stderr.includes("sudo timeout -s SIGKILL") &&
                exitCode == 137 &&
                !outOfMemory;

            resolve({
                stdout: stdout,
                stderr: stderr,
                exitCode,
                executionTime,
                outOfMemory,
                timedOut,
            });
        });
    });
}

export async function cleanup(containerName: string): Promise<void> {
    const cleanupScript = join(CONFIG_DIR, "cleanup.sh");

    return new Promise(function (resolve, reject) {
        exec(`bash ${cleanupScript} ${containerName}`, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
