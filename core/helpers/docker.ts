import { join } from "path"
import { CONFIG_DIR } from './constants';
import { exec, spawn } from 'child_process';

import { RunCodeInfo, RunCodeContainerResponse, AsyncExecPromise } from "./types";

async function asyncExecCode(command: string): Promise<AsyncExecPromise> {
    return new Promise(function (resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }

            resolve({ error, stdout, stderr });
        });
    })
}

async function getMemoryKilled(containerName: string): Promise<boolean> {
    return (await asyncExecCode(`docker container inspect --format='{{.State.OOMKilled}}' ${containerName}`)).stdout.trim() === "true"
}

async function getExecutionTime(containerName: string): Promise<number> {

    let startTime = (await asyncExecCode(`docker container inspect --format='{{.State.StartedAt}}' ${containerName}`)).stdout.trim()
    let endTime = (await asyncExecCode(`docker container inspect --format='{{.State.FinishedAt}}' ${containerName}`)).stdout.trim()

    return new Date(endTime).getTime() - new Date(startTime).getTime()
}

export async function imageExists(imageName: string): Promise<boolean> {
    return (await asyncExecCode(`docker images -q ${imageName} 2> /dev/null`)).stdout != ""
}

export async function buildImage(imageName: string, language: string): Promise<AsyncExecPromise> {
    const buildScript = join(CONFIG_DIR, "build.sh")
    const filePath = join(CONFIG_DIR, language)

    return await asyncExecCode(`bash ${buildScript} ${imageName} ${filePath}`)

}

export async function runCodeInContainer(data: RunCodeInfo): Promise<RunCodeContainerResponse> {
    const runScript = join(CONFIG_DIR, "run.sh")

    await asyncExecCode(`chown 644 ${data.codeFileSrc}`)
    await asyncExecCode(`chown 644 ${data.runFileSrc}`)

    const volume1 = `${data.codeFileSrc}:${data.codeFileDes}`
    const volume2 = `${data.runFileSrc}:${data.runFileDes}`

    const command = `bash ${runScript} ${volume1} ${volume2} ${data.containerName} ${data.imageName} ${data.inputFileSrc}`

    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, { shell: true });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', data => stdout += data);
        childProcess.stderr.on('data', data => stderr += data);

        childProcess.on('error', error => reject({ error, stderr }));

        childProcess.on('close', async code => {
            const executionTime = await getExecutionTime(data.containerName)
            const memoryKilled = await getMemoryKilled(data.containerName)
            resolve(
                { stdout: stdout, stderr: stderr, exitCode: code ?? 0, executionTime, memoryKilled }
            )
        });
    });
}

export async function cleanup(containerName: string): Promise<void> {
    const cleanupScript = join(CONFIG_DIR, "cleanup.sh")

    return new Promise(function (resolve, reject) {
        exec(`bash ${cleanupScript} ${containerName}`, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve()
        })
    })
}