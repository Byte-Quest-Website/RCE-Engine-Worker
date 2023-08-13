import { GeneralRCEWorker } from "./core/workers/general_worker";
import { TestCodeWorker } from "./core/workers/tester_worker";

async function main() {
    const codeRunner = await GeneralRCEWorker.init<GeneralRCEWorker>(
        "run_code"
    );
    await codeRunner.start();

    const codeTester = await TestCodeWorker.init<TestCodeWorker>("test_code");
    await codeTester.start();
}

main();
