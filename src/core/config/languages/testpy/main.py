from json import dump
from typing import Any
from os.path import join, dirname

import pytest
from pytest_jsonreport.plugin import JSONReport

PATH = join(dirname(__file__), "test.py")
RESULT_PATH = join(dirname(__file__), "result.json")

plugin = JSONReport()
pytest.main(
    ["-v", "-rx", "--lf", "--tb=long", "--timeout=1", "--json-report-file=none", PATH],
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
        break
    else:
        data["outcome"] = "pass"

    return write_result(data)


if __name__ == "__main__":
    main()
