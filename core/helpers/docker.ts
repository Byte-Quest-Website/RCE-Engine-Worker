import { join } from "path"
import { exec } from 'child_process';
import { CONFIG_DIR } from './constants';

export async function imageExists(imageName: string): Promise<boolean> {
    return new Promise(function (resolve, reject) {
        exec(`docker images -q ${imageName} 2> /dev/null`, (error, stdout) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(!(stdout == ""));
        });
    })
}

export async function buildImage(imageName: string, language: string): Promise<void> {
    const buildScript = join(CONFIG_DIR, "build.sh")
    const filePath = join(CONFIG_DIR, language)

    return new Promise(function (resolve, reject) {
        exec(`bash ${buildScript} ${imageName} ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(console.log(error, stdout, stderr));
        })
    })
}