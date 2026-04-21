"""Fibonacci anyon fusion category: F, R, fusion rules.

Classical simulation only. No quantum SDK imports.
See tests/test_no_qiskit.py for the enforcing guard.

Fusion rule:  tau x tau = 1 + tau
Quantum dim:  d_tau = phi = (1 + sqrt(5)) / 2
F matrix:     2x2 unitary on the (1, tau) fusion basis
R matrix:     diagonal (R_1, R_tau) for tau-tau exchange

References:
    Preskill, "Topological Quantum Computation" (2004), ch. 9
    Bonderson, PhD thesis (2007), ch. 2
    Kitaev, "Anyons in an exactly solved model and beyond" (2006)
"""
from __future__ import annotations

import cmath
import math
from typing import Literal

Charge = Literal["vacuum", "tau"]

PHI: float = (1.0 + math.sqrt(5.0)) / 2.0


def fusion(a: Charge, b: Charge) -> list[Charge]:
    if a == "vacuum":
        return [b]
    if b == "vacuum":
        return [a]
    return ["vacuum", "tau"]


def f_matrix() -> tuple[tuple[complex, complex], tuple[complex, complex]]:
    """F^{tau,tau,tau}_{tau} acting on the (1, tau) internal-channel basis."""
    inv_phi = 1.0 / PHI
    inv_sqrt_phi = 1.0 / math.sqrt(PHI)
    return (
        (complex(inv_phi), complex(inv_sqrt_phi)),
        (complex(inv_sqrt_phi), complex(-inv_phi)),
    )


def r_matrix() -> tuple[complex, complex]:
    """R-matrix diagonal (R_1, R_tau) for tau-tau exchange."""
    return (
        cmath.exp(complex(0, -4.0 * math.pi / 5.0)),
        cmath.exp(complex(0,  3.0 * math.pi / 5.0)),
    )
