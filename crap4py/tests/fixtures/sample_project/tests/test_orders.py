import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from orders import describe


def test_describe():
    assert describe(2) == "order of 2"
