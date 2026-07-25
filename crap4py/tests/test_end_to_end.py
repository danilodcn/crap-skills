import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample_project"
SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "crap_py.py"


def test_report_ranks_the_untested_complex_function_first(tmp_path):
    project = tmp_path / "sample_project"
    shutil.copytree(FIXTURE, project)

    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=project,
        capture_output=True,
        text=True,
        env={**os.environ, "PYTHONPATH": str(SCRIPT.parent)},
    )

    assert result.returncode == 0, result.stderr
    document = json.loads((project / "target" / "crap" / "report.json").read_text())
    worst = document["entries"][0]
    assert worst["name"] == "process"
    assert worst["complexity"] == 5
    assert worst["coverage"] == 0.0
    assert worst["crap"] == 30.0
    assert document["summary"]["crappy"] == 1
    assert "process" in result.stdout
