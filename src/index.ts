import "dotenv/config";

import { GeneralRCEWorker } from "./core/workers/general_worker";
import { TestCodeWorker } from "./core/workers/tester_worker";

async function main() {
    const runGeneralWorker = process.env.RUN_CODE === "true";
    const runTestWorker = process.env.TEST_CODE === "true";

    if (runGeneralWorker) {
        const codeRunner = await GeneralRCEWorker.init<GeneralRCEWorker>(
            "run_code"
        );
        await codeRunner.start();
    }

    if (runTestWorker) {
        const codeTester = await TestCodeWorker.init<TestCodeWorker>(
            "test_code"
        );
        await codeTester.start();
    }

    if (!runGeneralWorker && !runTestWorker) {
        console.log("Not Running Anything");
        process.exit(0);
    }
}

main();
