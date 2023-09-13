import sqlite3
import humanize
from typing import Any
from json import dump, load
from os.path import join, dirname

import pytest
from pytest_jsonreport.plugin import JSONReport

PATH = join(dirname(__file__), "test.py")
PYMON_PATH = join(dirname(__file__), ".pymon")
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

        assertion_reason = None
        reason = test["call"]["crash"]["message"]
        if test["call"]["traceback"][0]["message"] == "AssertionError":
            error_message = test["call"]["crash"]["message"]
            assertion_reason = str(error_message).removeprefix("AssertionError: ")
            reason = "AssertionError"

        data["outcome"] = "fail"
        data["reason"] = reason
        data["fail_number"] = idx
        data["total_cases"] = len(TEST_CASES)
        data["assertion_reason"] = assertion_reason

        return write_result(data)

    data["outcome"] = "pass"

    connection = sqlite3.connect(PYMON_PATH)
    cursor = connection.cursor()

    cursor.execute("SELECT MEM_USAGE FROM TEST_METRICS")
    memory_usage_data = cursor.fetchall()[-len(TEST_CASES) :]
    average_memory_used = sum(map(lambda x: abs(x[0] * 1e6), memory_usage_data)) / len(
        memory_usage_data
    )

    cursor.execute("SELECT TOTAL_TIME FROM TEST_METRICS")
    time_usage_data = cursor.fetchall()[-len(TEST_CASES) :]
    average_time_spent = sum(map(lambda x: x[0], time_usage_data)) / len(
        time_usage_data
    )

    data["average_time"] = average_time_spent
    data["memory_used"] = int(average_memory_used)
    data["memory_used_fmt"] = humanize.naturalsize(average_memory_used)

    connection.close()

    return write_result(data)


if __name__ == "__main__":
    main()
