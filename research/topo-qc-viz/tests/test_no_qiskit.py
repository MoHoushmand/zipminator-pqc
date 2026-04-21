"""Guard: physics_core must not import any quantum SDK at load time.

Fibonacci anyon visualization is fully classical (F/R matrices, tensor
networks, Blender rendering). A stray qiskit import would silently pull
the pipeline into IBM Quantum billing. This test fails if any module in
physics_core transitively loads qiskit, pennylane, cirq, qbraid, or braket.
"""
from __future__ import annotations

import importlib
import pkgutil
import sys

import pytest

BANNED_ROOTS: frozenset[str] = frozenset({
    "qiskit",
    "qiskit_aer",
    "qiskit_ibm_runtime",
    "qiskit_ibm_provider",
    "pennylane",
    "cirq",
    "qbraid",
    "braket",
    "amazon_braket_sdk",
})


def _physics_core_modules() -> list[str]:
    import physics_core

    names = [
        name
        for _, name, _ in pkgutil.walk_packages(
            physics_core.__path__, prefix="physics_core."
        )
    ]
    return ["physics_core", *names]


@pytest.mark.parametrize("module_name", _physics_core_modules())
def test_no_quantum_sdk_imports(module_name: str) -> None:
    before = set(sys.modules)
    importlib.import_module(module_name)
    after = set(sys.modules)
    leaked = {m for m in after - before if m.split(".")[0] in BANNED_ROOTS}
    assert not leaked, (
        f"{module_name} pulled quantum SDK modules at import: {leaked}. "
        f"physics_core must stay fully classical."
    )


def test_fibonacci_matrices_are_unitary() -> None:
    """Sanity smoke test: F is unitary, R is unit-modulus. Not the guard; just wiring."""
    from physics_core.fibonacci import f_matrix, r_matrix

    f = f_matrix()
    # F F^dagger == I for the 2x2 block
    fft = [
        [sum(f[i][k] * f[j][k].conjugate() for k in (0, 1)) for j in (0, 1)]
        for i in (0, 1)
    ]
    for i in (0, 1):
        for j in (0, 1):
            expected = 1.0 if i == j else 0.0
            assert abs(fft[i][j] - expected) < 1e-12

    for r in r_matrix():
        assert abs(abs(r) - 1.0) < 1e-12
