import { GeneralRCEWorker } from "./core/workers/general_worker";

async function main() {
    const codeRunner = await GeneralRCEWorker.init("run_code")
    await codeRunner.start()
}

main()