from typing import Any
from json import dump, load
from os.path import join, dirname

import pytest
from pytest_jsonreport.plugin import JSONReport

PATH = join(dirname(__file__), "test.py")
RESULT_PATH = join(dirname(__file__), "result.json")
TEST_CONFIG_PATH = join(dirname(__file__), "data.json")

with open(TEST_CONFIG_PATH) as f:
    test_config = load(f)

TEST_CASES = test_config["tests"]
TIME_LIMIT = test_config["time_limit"]

plugin = JSONReport()
pytest.main(
    [
        "-x",
        "-v",
        "-rx",
        "--lf",
        "--tb=long",
        f"--timeout={TIME_LIMIT}",
        "--json-report-file=none",
        PATH,
    ],
    plugins=[plugin],
)


def write_result(data: Any):
    with open(RESULT_PATH, "w") as f:
        dump(data, f)


def main() -> None:
    data = {}

    if plugin.report is None:
        data["success"] = False
        return write_result(data)

    data["success"] = True
    data["report"] = plugin.report

    tests = plugin.report["tests"]
    for idx, test in enumerate(tests, start=1):
        if test["outcome"] != "failed":
            continue
        reason = test["call"]["crash"]["message"]
        if test["call"]["traceback"][0]["message"] == "AssertionError":
            reason = "AssertionError"

        data["outcome"] = "fail"
        data["reason"] = reason
        data["fail_number"] = idx
        data["total_cases"] = len(TEST_CASES)

        break
    else:
        data["outcome"] = "pass"

    return write_result(data)


if __name__ == "__main__":
    main()
