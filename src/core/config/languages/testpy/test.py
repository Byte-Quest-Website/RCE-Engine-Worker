from json import load
from os.path import join, dirname
from typing import Callable, TypedDict, Any

import pytest

import code


class JSONData(TypedDict):
    time_limit: int
    function_name: str
    tests: list[tuple[list[Any], Any]]


PATH = join(dirname(__file__), "data.json")

with open(PATH) as f:
    data: JSONData = load(f)


@pytest.mark.parametrize("testcase, expected", data["tests"])
def test_function(testcase: list[Any], expected: Any) -> None:
    func: Callable[..., Any] = getattr(code, data["function_name"])
    value_from_code = func(*testcase)

    assert (
        value_from_code == expected
    ), f"Expected {repr(expected)}, but got {repr(value_from_code)}"
