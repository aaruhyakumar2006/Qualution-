import pytest
from unittest.mock import MagicMock, patch
from app.backends.qbraid_backend import QBraidBackend
from app.schemas.circuit import CircuitRequest, GateRequest

def test_qbraid_unconfigured_metadata():
    backend = QBraidBackend(api_key="", default_device=None)
    meta = backend.get_metadata()
    assert meta.name == "qbraid"
    assert meta.framework == "qbraid"
    assert meta.provider == "qbraid"
    assert meta.status == "NOT_CONFIGURED"
    assert meta.available is False
    assert meta.capabilities.shots is True
    assert meta.capabilities.statevector is False
    assert meta.capabilities.hardware is True
    assert meta.capabilities.local_simulator is False
    assert meta.capabilities.remote_provider is True

def test_qbraid_key_without_device_metadata():
    backend = QBraidBackend(api_key="test_mock_api_key", default_device="")
    meta = backend.get_metadata()
    assert meta.status == "UNAVAILABLE"
    assert meta.available is False

def test_qbraid_fully_configured_metadata():
    backend = QBraidBackend(api_key="test_mock_api_key", default_device="test_device_target")
    meta = backend.get_metadata()
    assert meta.status == "AVAILABLE"
    assert meta.available is True

def test_qbraid_unconfigured_simulate_raises_structured_error():
    backend = QBraidBackend(api_key="", default_device="")
    circ = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="h", targets=[0])], measure=True)
    with pytest.raises(ValueError, match="qBraid backend is not configured"):
        backend.simulate(circ)

def test_qbraid_missing_device_simulate_raises_structured_error():
    backend = QBraidBackend(api_key="mock_key", default_device="")
    circ = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="h", targets=[0])], measure=True)
    with pytest.raises(ValueError, match="target execution device is not configured"):
        backend.simulate(circ)

def test_qbraid_unconfigured_statevector_raises_structured_error():
    backend = QBraidBackend(api_key="", default_device=None)
    circ = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="h", targets=[0])], measure=False)
    with pytest.raises(ValueError, match="qBraid backend is not configured"):
        backend.statevector(circ)

def test_qbraid_statevector_unsupported_when_configured():
    backend = QBraidBackend(api_key="mock_key", default_device="mock_device")
    circ = CircuitRequest(qubits=2, classical_bits=2, gates=[GateRequest(gate="h", targets=[0])], measure=False)
    with pytest.raises(ValueError, match="do not support direct local statevector extraction"):
        backend.statevector(circ)

def test_qbraid_mock_provider_execution():
    backend = QBraidBackend(api_key="mock_key", default_device="mock_device")
    circ = CircuitRequest(
        qubits=2,
        classical_bits=2,
        gates=[
            GateRequest(gate="h", targets=[0]),
            GateRequest(gate="cx", targets=[0, 1]),
        ],
        measure=True,
        shots=100
    )

    mock_result = MagicMock()
    mock_result.measurement_counts.return_value = {"00": 52, "11": 48}

    mock_job = MagicMock()
    mock_job.result.return_value = mock_result

    mock_device = MagicMock()
    mock_device.run.return_value = mock_job

    mock_provider = MagicMock()
    mock_provider.get_device.return_value = mock_device

    with patch("qbraid.runtime.QbraidProvider", return_value=mock_provider):
        res = backend.simulate(circ)
        assert res.backend == "qbraid"
        assert res.shots == 100
        assert res.counts == {"00": 52, "11": 48}
        assert res.probabilities["00"] == 0.52
        assert res.probabilities["11"] == 0.48
        assert res.execution_time_ms >= 0

def test_qbraid_api_key_never_leaked_in_errors_or_repr():
    secret_key = "sk_secret_token_never_leak_999888"
    backend = QBraidBackend(api_key=secret_key, default_device="faulty_device")
    
    # 1. repr check
    repr_str = repr(backend)
    assert secret_key not in repr_str

    # 2. Error message sanitization check
    circ = CircuitRequest(qubits=1, classical_bits=1, gates=[GateRequest(gate="x", targets=[0])], measure=True)
    with patch("qbraid.runtime.QbraidProvider", side_effect=Exception(f"Connection failed with token: {secret_key}")):
        with pytest.raises(ValueError) as exc:
            backend.simulate(circ)
        assert secret_key not in str(exc.value)
        assert "[REDACTED_API_KEY]" in str(exc.value)
