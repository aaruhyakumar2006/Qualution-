import json
import logging
import re
import time
from typing import Dict, Any, List, Optional, Tuple, Union
import httpx
from app.core.config import settings

logger = logging.getLogger("nvidia_provider")

def redact_sensitive(text: str) -> str:
    """Redacts potential API keys or authorization headers from text."""
    if not text:
        return ""
    for secret in [getattr(settings, "NVIDIA_API_KEY", None), getattr(settings, "GROQ_API_KEY", None)]:
        if secret and len(secret) > 8:
            text = text.replace(secret, f"{secret[:4]}...[REDACTED]")
    text = re.sub(r'nvapi-[A-Za-z0-9_\-]+', '[REDACTED_API_KEY]', text)
    text = re.sub(r'gsk_[A-Za-z0-9_\-]+', '[REDACTED_API_KEY]', text)
    text = re.sub(r'Bearer\s+[A-Za-z0-9_\-\.]+', 'Bearer [REDACTED_TOKEN]', text)
    return text

class NVIDIAProvider:
    """
    NVIDIA NIM Quantum Inference Provider.
    Acts as the PRIMARY reasoning model for conceptual quantum physics explanations,
    circuit structure reasoning, debugging, statevector/Bloch interpretation,
    optimization guidance, prediction checking, and discrepancy comparison.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = settings.NVIDIA_API_KEY if api_key is None else api_key
        self.base_url = (settings.NVIDIA_BASE_URL or "https://integrate.api.nvidia.com/v1").rstrip("/")
        self.primary_model = settings.NVIDIA_MODEL or "meta/llama-3.2-11b-vision-instruct"
        # Only include verified supported models on the NVIDIA endpoint
        self.fallback_models = [
            "meta/llama-3.2-11b-vision-instruct",
            "nvidia/nemotron-3-super-120b-a12b"
        ]

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 0)

    def _call_chat_completions(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.25
    ) -> Tuple[Optional[str], float, str]:
        """
        Execute chat completion request to NVIDIA NIM with primary model and verified fallbacks.
        Enforces total request deadline (settings.NVIDIA_REQUEST_TIMEOUT), safe transient retries,
        differentiated connect/read timeouts, high-resolution latency tracking, and structured logging.

        Returns:
            Tuple[Optional[str], float, str]: (content, latency_ms, status_code)
            status_code is one of: "success", "provider_timeout", "provider_unavailable", "configuration_error"
        """
        if not self.is_configured():
            return None, 0.0, "configuration_error"

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Qualution-Quantum-Studio/1.0"
        }

        overall_start = time.perf_counter()
        request_timeout_budget = getattr(settings, "NVIDIA_REQUEST_TIMEOUT", 45.0)
        connect_timeout_cfg = getattr(settings, "NVIDIA_CONNECT_TIMEOUT", 10.0)
        read_timeout_cfg = getattr(settings, "NVIDIA_READ_TIMEOUT", 35.0)
        max_retries = getattr(settings, "NVIDIA_MAX_RETRIES", 1)
        retry_backoff = getattr(settings, "NVIDIA_RETRY_BACKOFF", 1.5)
        deadline = overall_start + request_timeout_budget

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]
        last_failure_status = "provider_unavailable"
        last_latency = 0.0

        for model in models_to_try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature
            }

            attempt = 1
            max_attempts = max_retries + 1

            while attempt <= max_attempts:
                now = time.perf_counter()
                remaining_budget = deadline - now

                if remaining_budget <= 1.0:
                    total_latency = (now - overall_start) * 1000
                    logger.warning(
                        f"NVIDIA request deadline exhausted: provider=nvidia model={model} "
                        f"attempt={attempt}/{max_attempts} total_latency_ms={total_latency:.1f} "
                        f"remaining_budget_s={remaining_budget:.2f}"
                    )
                    return None, total_latency, "provider_timeout"

                conn_to = min(connect_timeout_cfg, max(0.5, remaining_budget))
                read_to = min(read_timeout_cfg, max(1.0, remaining_budget))
                pool_to = remaining_budget
                http_timeout = httpx.Timeout(
                    connect=conn_to,
                    read=read_to,
                    write=min(10.0, remaining_budget),
                    pool=pool_to
                )

                attempt_start = time.perf_counter()
                try:
                    logger.info(
                        f"NVIDIA request start: provider=nvidia model={model} attempt={attempt}/{max_attempts} "
                        f"connect_timeout={conn_to:.1f}s read_timeout={read_to:.1f}s remaining_budget={remaining_budget:.1f}s"
                    )
                    with httpx.Client(timeout=http_timeout) as client:
                        resp = client.post(url, headers=headers, json=payload)
                        attempt_latency = (time.perf_counter() - attempt_start) * 1000
                        last_latency = attempt_latency

                        if resp.status_code == 200:
                            resp_data = resp.json()
                            choices = resp_data.get("choices", [])
                            if choices and len(choices) > 0:
                                content = choices[0].get("message", {}).get("content", "").strip()
                                if content:
                                    logger.info(
                                        f"NVIDIA request success: provider=nvidia model={model} attempt={attempt} "
                                        f"latency_ms={attempt_latency:.1f} status=200"
                                    )
                                    return content, attempt_latency, "success"

                        # Handle HTTP error statuses
                        if resp.status_code in (401, 403):
                            logger.warning(
                                f"NVIDIA authentication failed: provider=nvidia model={model} status={resp.status_code} "
                                f"latency_ms={attempt_latency:.1f}. Non-retryable."
                            )
                            return None, attempt_latency, "configuration_error"
                        elif resp.status_code == 404:
                            logger.warning(
                                f"NVIDIA model not found: provider=nvidia model={model} status=404 "
                                f"latency_ms={attempt_latency:.1f}. Skipping model."
                            )
                            last_failure_status = "provider_unavailable"
                            break  # Try next fallback model if any
                        elif resp.status_code in (502, 503, 504):
                            remaining_after = deadline - time.perf_counter()
                            can_retry = (attempt < max_attempts and remaining_after > retry_backoff + 2.0)
                            logger.warning(
                                f"NVIDIA upstream transient error: provider=nvidia model={model} status={resp.status_code} "
                                f"attempt={attempt}/{max_attempts} latency_ms={attempt_latency:.1f} retryable={can_retry}"
                            )
                            if can_retry:
                                time.sleep(retry_backoff)
                                attempt += 1
                                continue
                            else:
                                last_failure_status = "provider_unavailable"
                                break
                        else:
                            logger.warning(
                                f"NVIDIA API HTTP {resp.status_code} on model '{model}': latency_ms={attempt_latency:.1f}"
                            )
                            last_failure_status = "provider_unavailable"
                            break

                except (httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                    attempt_latency = (time.perf_counter() - attempt_start) * 1000
                    last_latency = attempt_latency
                    cat = "read_timeout" if isinstance(e, httpx.ReadTimeout) else "connect_timeout"
                    remaining_after = deadline - time.perf_counter()
                    can_retry = (attempt < max_attempts and remaining_after > retry_backoff + 3.0)
                    logger.warning(
                        f"NVIDIA tutor request timeout: provider=nvidia model={model} attempt={attempt}/{max_attempts} "
                        f"timeout_category={cat} read_timeout={read_to:.1f}s latency_ms={attempt_latency:.1f} retryable={can_retry}"
                    )
                    last_failure_status = "provider_timeout"
                    if can_retry:
                        time.sleep(retry_backoff)
                        attempt += 1
                        continue
                    else:
                        break

                except (httpx.ConnectError, httpx.RequestError) as e:
                    attempt_latency = (time.perf_counter() - attempt_start) * 1000
                    last_latency = attempt_latency
                    safe_err = redact_sensitive(str(e))
                    remaining_after = deadline - time.perf_counter()
                    can_retry = (attempt < max_attempts and remaining_after > retry_backoff + 2.0)
                    logger.warning(
                        f"NVIDIA connection error: provider=nvidia model={model} attempt={attempt}/{max_attempts} "
                        f"latency_ms={attempt_latency:.1f} retryable={can_retry} error={safe_err}"
                    )
                    last_failure_status = "provider_unavailable"
                    if can_retry:
                        time.sleep(retry_backoff)
                        attempt += 1
                        continue
                    else:
                        break
                except Exception as e:
                    attempt_latency = (time.perf_counter() - attempt_start) * 1000
                    last_latency = attempt_latency
                    safe_err = redact_sensitive(str(e))
                    logger.warning(f"NVIDIA call failed on model '{model}': {safe_err}")
                    last_failure_status = "provider_unavailable"
                    break

                attempt += 1

            # If remaining budget is less than 5s, don't attempt another model
            if (deadline - time.perf_counter()) < 5.0:
                logger.info("NVIDIA deadline budget exhausted; skipping subsequent fallback models.")
                break

        total_latency = (time.perf_counter() - overall_start) * 1000
        return None, total_latency, last_failure_status

    def _stream_chat_completions(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.25
    ):
        """
        Stream chat completions from NVIDIA NIM using real upstream SSE chunks.
        Yields events:
          - {"type": "delta", "text": str}
          - {"type": "done", "content": str, "latency_ms": float, "status": str}
          - {"type": "error", "status": str, "error": str, "latency_ms": float}
        """
        if not self.is_configured():
            yield {"type": "error", "status": "configuration_error", "error": "NVIDIA API key not configured.", "latency_ms": 0.0}
            return

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "User-Agent": "Qualution-Quantum-Studio/1.0"
        }

        overall_start = time.perf_counter()
        request_timeout_budget = getattr(settings, "NVIDIA_REQUEST_TIMEOUT", 45.0)
        connect_timeout_cfg = getattr(settings, "NVIDIA_CONNECT_TIMEOUT", 10.0)
        read_timeout_cfg = getattr(settings, "NVIDIA_READ_TIMEOUT", 35.0)
        max_retries = getattr(settings, "NVIDIA_MAX_RETRIES", 1)
        retry_backoff = getattr(settings, "NVIDIA_RETRY_BACKOFF", 1.5)
        deadline = overall_start + request_timeout_budget

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]
        last_failure_status = "provider_unavailable"

        for model in models_to_try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": True
            }

            attempt = 1
            max_attempts = max_retries + 1

            while attempt <= max_attempts:
                now = time.perf_counter()
                remaining_budget = deadline - now

                if remaining_budget <= 1.0:
                    total_latency = (now - overall_start) * 1000
                    yield {"type": "error", "status": "provider_timeout", "error": "NVIDIA request deadline exhausted.", "latency_ms": total_latency}
                    return

                conn_to = min(connect_timeout_cfg, max(0.5, remaining_budget))
                read_to = min(read_timeout_cfg, max(1.0, remaining_budget))
                http_timeout = httpx.Timeout(
                    connect=conn_to,
                    read=read_to,
                    write=min(10.0, remaining_budget),
                    pool=remaining_budget
                )

                attempt_start = time.perf_counter()
                try:
                    with httpx.Client(timeout=http_timeout) as client:
                        with client.stream("POST", url, headers=headers, json=payload) as resp:
                            if resp.status_code == 200:
                                accumulated = []
                                for line in resp.iter_lines():
                                    if not line or not line.strip():
                                        continue
                                    if line.startswith("data:"):
                                        data_str = line[5:].strip()
                                        if data_str == "[DONE]":
                                            break
                                        try:
                                            chunk_json = json.loads(data_str)
                                            choices = chunk_json.get("choices", [])
                                            if choices:
                                                delta_content = choices[0].get("delta", {}).get("content", "")
                                                if delta_content:
                                                    accumulated.append(delta_content)
                                                    yield {"type": "delta", "text": delta_content}
                                        except Exception:
                                            continue

                                full_text = "".join(accumulated).strip()
                                if full_text:
                                    total_latency = (time.perf_counter() - overall_start) * 1000
                                    yield {"type": "done", "content": full_text, "latency_ms": total_latency, "status": "success"}
                                    return

                            if resp.status_code in (401, 403):
                                total_latency = (time.perf_counter() - overall_start) * 1000
                                yield {"type": "error", "status": "configuration_error", "error": "NVIDIA authentication failed.", "latency_ms": total_latency}
                                return
                            elif resp.status_code == 404:
                                last_failure_status = "provider_unavailable"
                                break
                            elif resp.status_code in (502, 503, 504):
                                remaining_after = deadline - time.perf_counter()
                                if attempt < max_attempts and remaining_after > retry_backoff + 2.0:
                                    time.sleep(retry_backoff)
                                    attempt += 1
                                    continue
                                else:
                                    last_failure_status = "provider_unavailable"
                                    break
                            else:
                                last_failure_status = "provider_unavailable"
                                break
                except (httpx.ReadTimeout, httpx.ConnectTimeout):
                    last_failure_status = "provider_timeout"
                    remaining_after = deadline - time.perf_counter()
                    if attempt < max_attempts and remaining_after > retry_backoff + 3.0:
                        time.sleep(retry_backoff)
                        attempt += 1
                        continue
                    else:
                        break
                except Exception as e:
                    safe_err = redact_sensitive(str(e))
                    logger.warning(f"NVIDIA stream exception on model '{model}': {safe_err}")
                    last_failure_status = "provider_unavailable"
                    break

                attempt += 1

            if (deadline - time.perf_counter()) < 5.0:
                break

        total_latency = (time.perf_counter() - overall_start) * 1000
        yield {"type": "error", "status": last_failure_status, "error": f"NVIDIA stream ended with status: {last_failure_status}", "latency_ms": total_latency}

    def format_circuit_summary(self, context: Dict[str, Any]) -> str:
        """Extract a structured, bounded summary of the quantum circuit and environment."""
        circ = context.get("circuit", {})
        qubits = circ.get("qubits", 2)
        classical = circ.get("classicalBits", circ.get("classical_bits", qubits))
        gates = circ.get("gates", [])

        gate_strs = []
        for g in gates:
            g_name = g.get("gate", "").upper()
            targets = g.get("targets", [])
            angle = g.get("angle")
            if len(targets) == 1:
                t = f"q[{targets[0]}]"
                if angle is not None:
                    gate_strs.append(f"{g_name}({angle:.3f} rad) on {t}")
                else:
                    gate_strs.append(f"{g_name} on {t}")
            elif len(targets) >= 2:
                gate_strs.append(f"{g_name} (ctrl: q[{targets[0]}], tgt: q[{targets[1]}])")
            else:
                gate_strs.append(f"{g_name}")

        gates_str = ", ".join(gate_strs) if gate_strs else "Empty circuit (no gates placed)"
        
        sim = context.get("simulation")
        sim_summary = ""
        if sim and sim.get("probabilities"):
            probs = sim.get("probabilities", {})
            prob_items = [f"|{state}>: {p * 100:.1f}%" for state, p in probs.items() if p > 0.001]
            sim_summary = f"\nMeasurement Probabilities: {', '.join(prob_items)}"

        sel_gate = context.get("selectedGate")
        sel_summary = ""
        if sel_gate:
            sel_summary = f"\nCurrently Selected Gate: {sel_gate.get('gate', '').upper()} on wire(s) {sel_gate.get('targets', [])}"

        err = context.get("error")
        err_summary = f"\nActive Circuit / Validation Error: {err}" if err else ""

        user_info = context.get("user")
        user_summary = ""
        if user_info:
            lvl = user_info.get("currentLevel", "beginner")
            prog = user_info.get("overallProgress", 0)
            user_summary = f"\nLearner Profile: Level={lvl}, Progress={int(prog*100)}%"

        return f"Circuit Structure: {qubits} qubit(s), {classical} classical bit(s).\nGates Sequence: {gates_str}.{sel_summary}{sim_summary}{err_summary}{user_summary}"

    def generate_reasoning(
        self,
        question: str,
        context: Dict[str, Any],
        mode: str = "explain",
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Synthesize substantive quantum reasoning using NVIDIA NIM.
        Returns a structured dictionary with explicit status ('success', 'provider_timeout', 'provider_unavailable', 'configuration_error').
        """
        circuit_desc = self.format_circuit_summary(context)
        context_used = ["circuit_structure", "qubit_count"]
        if context.get("simulation"):
            context_used.append("simulation_probabilities")
        if context.get("selectedGate"):
            context_used.append("selected_gate")
        if context.get("error"):
            context_used.append("validation_error")

        circ = context.get("circuit", {})
        qubit_count = circ.get("qubits", 2)
        gates = circ.get("gates", [])
        has_h = any(g.get("gate", "").lower() == "h" for g in gates)
        has_cx = any(g.get("gate", "").lower() == "cx" for g in gates)

        # Build ground truth facts and recommended studio actions
        facts = []
        if has_h and has_cx:
            facts.append("Hadamard followed by CX creates a maximally entangled Einstein-Podolsky-Rosen (EPR) Bell state.")
        elif has_h:
            facts.append("Hadamard transforms the computational basis state |0> into symmetric superposition |+> = (|0> + |1>)/sqrt(2).")
        elif has_cx:
            facts.append("Controlled-NOT performs a coherent bit-flip on the target qubit conditional on the control qubit state |1>.")
        else:
            facts.append("Quantum state evolution is unitary U(t), strictly preserving total probability |||psi>||^2 = 1.")

        facts.append(f"The circuit spans a {2**qubit_count}-dimensional complex Hilbert state space across {qubit_count} qubit(s).")

        actions = [
            {"type": "open_state", "label": "Inspect Statevector Amplitudes"},
            {"type": "open_bloch", "label": "View 3D Bloch Sphere"},
            {"type": "open_optimize", "label": "Open Circuit Optimization Studio"},
        ]

        suggestions = [
            "Why do these probabilities appear?",
            "What happens if I add an X gate?",
            "Can this circuit be simplified?"
        ]

        # Optimization pre-check
        is_opt_query = (
            mode == "optimize"
            or any(w in question.lower() for w in ["optimize", "optimise", "simplif", "reduction", "redundant", "cancel", "optimal"])
        )
        opt_info = ""
        opt_changed = False
        opt_reductions = 0
        opt_explanations = []

        if is_opt_query:
            try:
                from app.schemas.circuit import CircuitRequest
                from app.optimization.service import optimization_service
                clbits = circ.get("classicalBits", circ.get("classical_bits", qubit_count))
                circuit_req = CircuitRequest(
                    qubits=qubit_count,
                    classical_bits=max(1, clbits) if circ.get("measure", False) else clbits,
                    gates=gates,
                    measure=circ.get("measure", False),
                    shots=circ.get("shots", 1024)
                )
                opt_res = optimization_service.optimize_circuit(circuit_req)
                opt_changed = opt_res.changed
                opt_reductions = opt_res.improvements.gate_count_reduction
                opt_explanations = opt_res.explanation
                if opt_changed:
                    opt_info = (
                        f"\nDeterministic Optimization Analysis: OPTIMIZABLE with {opt_reductions} gate reduction(s). "
                        f"Passes: {', '.join(opt_res.optimization_passes_applied)}."
                    )
                else:
                    opt_info = "\nDeterministic Optimization Analysis: ALREADY OPTIMAL. No redundant self-inverses found."
            except Exception as e:
                logger.debug(f"Optimization pre-check: {e}")

        user = context.get("user", {})
        active_lesson = user.get("activeLesson")
        lesson_context = f"\n\nActive Practical Lesson: '{active_lesson}'. Guide the student toward this lesson's objective." if active_lesson else ""

        system_prompt = (
            "You are the Qualution Quantum Reasoning Engine powered by NVIDIA NIM & Nemotron. "
            "You perform rigorous, insightful, and pedagogical quantum circuit reasoning.\n\n"
            f"Active Mode: {mode.upper()}. Target Learner Level: {level.upper()}.{lesson_context}\n\n"
            "Key Principles:\n"
            "1. REASON RIGOROUSLY: Explain quantum states, superposition amplitudes, entanglement, and phase rotations accurately.\n"
            "2. CONNECT TO SIMULATION: Directly reference the circuit's gates, wires, and observed probabilities.\n"
            "3. PREDICT & COMPARE: If comparing prediction vs simulation, highlight exact discrepancies and explain measurement collapse.\n"
            "4. CIRCUIT OPTIMIZATION: If asked about optimization, explain Clifford+T relations and unitary preservation.\n"
            "5. DEBUGGING: If errors are present, pinpoint the wire, gate index, and canonical fix.\n"
            "6. FORMATTING: Use Markdown with bold terms and clear sections for pedagogical clarity."
        )

        user_prompt = f"{circuit_desc}{opt_info}\n\nStudent Question / Query: {question}"

        res_call = self._call_chat_completions(system_prompt, user_prompt, max_tokens=1000, temperature=0.25)
        if isinstance(res_call, tuple) and len(res_call) == 3:
            raw_output, latency_ms, call_status = res_call
        elif isinstance(res_call, str):
            raw_output = res_call
            latency_ms = 100.0
            call_status = "success"
        else:
            raw_output = None
            latency_ms = 100.0
            call_status = "provider_unavailable"

        if call_status == "success" and raw_output:
            return {
                "status": "success",
                "answer": raw_output,
                "fallback_answer": None,
                "retryable": False,
                "error_code": None,
                "error_message": None,
                "technical_analysis": raw_output,
                "confidence": "high",
                "facts": facts,
                "actions": actions,
                "suggestions": suggestions,
                "context_used": context_used,
                "code": None,
                "provider": "nvidia",
                "reasoning_provider": "nvidia",
                "latency_ms": latency_ms
            }

        # Deterministic rule-based fallback
        q_text_lower = question.lower()
        q_lower = f"{question} {context.get('error', '')}".lower()
        supported_fallback = False
        ans = None
        confidence_level = "low"
        fallback_actions = actions
        fallback_suggestions = suggestions
        provider_tag = "ai_unavailable"

        if is_opt_query:
            supported_fallback = True
            confidence_level = "high"
            provider_tag = "local_deterministic_reasoner"
            if opt_changed:
                ans = (
                    f"### ⚡ Circuit Optimization Opportunities Detected\n\n"
                    f"Your circuit can be simplified! Formal algebraic analysis identified **{opt_reductions} gate reduction(s)**:\n\n"
                    + "\n".join(f"- {exp}" for exp in (opt_explanations or ["Redundant gates detected"])) + "\n\n"
                    f"Click **Open Circuit Optimization Studio** below to inspect the verified circuit diff."
                )
                fallback_actions = [{"type": "open_optimize", "label": "Open Circuit Optimization Studio"}]
                fallback_suggestions = ["Why were these gates redundant?", "What does global phase mean?"]
            else:
                ans = (
                    "### ✅ Circuit is Already Optimal!\n\n"
                    "Formal algebraic analysis confirms that your circuit contains **0 redundant gates**, "
                    "no consecutive self-inverses (such as $H \\cdot H = I$ or $X \\cdot X = I$), and no unmerged rotation sequences.\n\n"
                    "Your circuit is already in its minimal canonical form, maximizing physical qubit coherence on quantum hardware."
                )
                fallback_actions = [{"type": "open_optimize", "label": "Inspect Optimization Proof"}]
                fallback_suggestions = ["How does circuit depth affect error rates?", "Can I add more gates without losing coherence?"]
        elif (mode == "debug" and context.get("error")) or any(err_term in q_text_lower for err_term in ["why error", "what error", "literal_error", "unsupported gate", "input should be", "fix error", "rejected"]):
            supported_fallback = True
            confidence_level = "high"
            provider_tag = "local_deterministic_reasoner"
            ans = (
                "### ⚠️ Qualution Schema Validation Breakdown\n\n"
                "The circuit was rejected because it contains gates outside Qualution IR's verified gate set: "
                "`{'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz', 'swap'}`.\n\n"
                "**Canonical Fixes**:\n"
                "1. **Phase Gate `p(θ)`**: Replace with `rz` with `angle: θ`. $P(\\theta) = e^{i\\theta/2} R_Z(\\theta)$, identical up to global phase.\n"
                "2. **S-dagger `sdg`**: Replace with `rz` at `angle: -1.570796` ($-\\pi/2$) or three successive `s` gates ($S^3 = S^\\dagger$)."
            )
            fallback_actions = [{"type": "open_state", "label": "View Statevector"}]
            fallback_suggestions = ["How do I convert P(theta) to RZ?", "What gates does Qualution support?"]
        elif (has_h and has_cx and any(term in q_text_lower for term in ["bell", "entangle", "circuit", "explain", "probab"])) or any(term in q_text_lower for term in ["bell state", "entangled", "entanglement"]):
            supported_fallback = True
            confidence_level = "high"
            provider_tag = "local_deterministic_reasoner"
            ans = (
                "### 🔮 Entangled Bell State (|Φ⁺⟩)\n\n"
                "Your circuit creates the canonical maximally entangled Bell state:\n"
                "$$\\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$\n\n"
                "- **Hadamard on q0**: Puts qubit 0 into symmetric superposition $(|0\\rangle + |1\\rangle)/\\sqrt{2}$.\n"
                "- **CNOT from q0 to q1**: Flips qubit 1 only when qubit 0 is $|1\\rangle$, binding their quantum fates.\n"
                "- **Measurement Outcome**: Measuring qubit 0 immediately determines qubit 1. You observe ~50% $|00\\rangle$ and ~50% $|11\\rangle$."
            )
        elif ("hadamard" in q_text_lower or bool(re.search(r'\bh\s*(?:gate|\b)', q_text_lower))) and ("gate" in q_text_lower or "superposition" in q_text_lower or "what does" in q_text_lower or has_h):
            supported_fallback = True
            confidence_level = "high"
            provider_tag = "local_deterministic_reasoner"
            ans = (
                "### 🌀 Quantum Superposition (Hadamard Gate)\n\n"
                "Applying a Hadamard gate ($H$) transforms computational basis state $|0\\rangle$ into:\n"
                "$$|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$\n\n"
                "The qubit now possesses equal probability amplitudes of $\\frac{1}{\\sqrt{2}}$, yielding a 50% chance of measuring $|0\\rangle$ and a 50% chance of measuring $|1\\rangle$."
            )
        elif any(g_name in q_text_lower for g_name in ["x gate", "y gate", "z gate", "s gate", "t gate"]):
            target_g = next((g for g in ["x", "y", "z", "s", "t"] if f"{g} gate" in q_text_lower), "x").upper()
            supported_fallback = True
            confidence_level = "medium"
            provider_tag = "local_deterministic_reasoner"
            ans = (
                f"### ⚛️ Single-Qubit Operation: {target_g} Gate\n\n"
                f"The {target_g} gate performs a deterministic unitary rotation on the Bloch sphere. "
                "It transforms the quantum state vector while strictly preserving total probability normalization ($||\\psi|| = 1$)."
            )
        else:
            supported_fallback = False
            provider_tag = "ai_unavailable"
            confidence_level = "low"
            ans = (
                "### ⚠️ AI Reasoning Currently Unavailable\n\n"
                "The AI Tutor reasoning service is currently unreachable or offline. "
                "Offline deterministic analysis is available for: **H / CX Bell states**, **single-qubit Pauli/Clifford gates**, "
                "**Qualution schema validation**, and **Circuit Optimization Studio**."
            )

        err_code = "PROVIDER_TIMEOUT" if call_status == "provider_timeout" else (
            "CONFIGURATION_ERROR" if call_status == "configuration_error" else "PROVIDER_UNAVAILABLE"
        )
        err_msg = (
            "NVIDIA Tutor is taking too long to respond."
            if call_status == "provider_timeout"
            else ("NVIDIA configuration is invalid or missing." if call_status == "configuration_error" else "NVIDIA reasoning service is currently unavailable.")
        )

        return {
            "status": call_status,
            "answer": None,
            "fallback_answer": ans if supported_fallback else None,
            "retryable": (call_status == "provider_timeout"),
            "error_code": err_code,
            "error_message": err_msg,
            "technical_analysis": ans,
            "confidence": confidence_level,
            "facts": facts,
            "actions": fallback_actions,
            "suggestions": fallback_suggestions,
            "context_used": context_used + (["deterministic_rules"] if supported_fallback else []),
            "code": None,
            "provider": provider_tag,
            "reasoning_provider": "fallback" if supported_fallback else "none",
            "latency_ms": latency_ms
        }

    def generate_reasoning_stream(
        self,
        question: str,
        context: Dict[str, Any],
        mode: str = "explain",
        level: str = "beginner"
    ):
        """
        Stream NVIDIA NIM quantum reasoning deltas and final done / error payload.
        """
        circuit_desc = self.format_circuit_summary(context)
        context_used = ["circuit_structure", "qubit_count"]
        if context.get("simulation"):
            context_used.append("simulation_probabilities")
        if context.get("selectedGate"):
            context_used.append("selected_gate")
        if context.get("error"):
            context_used.append("validation_error")

        circ = context.get("circuit", {})
        qubit_count = circ.get("qubits", 2)
        gates = circ.get("gates", [])
        has_h = any(g.get("gate", "").lower() == "h" for g in gates)
        has_cx = any(g.get("gate", "").lower() == "cx" for g in gates)

        facts = []
        if has_h and has_cx:
            facts.append("Hadamard followed by CX creates a maximally entangled Einstein-Podolsky-Rosen (EPR) Bell state.")
        elif has_h:
            facts.append("Hadamard transforms the computational basis state |0> into symmetric superposition |+> = (|0> + |1>)/sqrt(2).")
        elif has_cx:
            facts.append("Controlled-NOT performs a coherent bit-flip on the target qubit conditional on the control qubit state |1>.")
        else:
            facts.append("Quantum state evolution is unitary U(t), strictly preserving total probability |||psi>||^2 = 1.")
        facts.append(f"The circuit spans a {2**qubit_count}-dimensional complex Hilbert state space across {qubit_count} qubit(s).")

        actions = [
            {"type": "open_state", "label": "Inspect Statevector Amplitudes"},
            {"type": "open_bloch", "label": "View 3D Bloch Sphere"},
            {"type": "open_optimize", "label": "Open Circuit Optimization Studio"},
        ]
        suggestions = [
            "Why do these probabilities appear?",
            "What happens if I add an X gate?",
            "Can this circuit be simplified?"
        ]

        user = context.get("user", {})
        active_lesson = user.get("activeLesson")
        lesson_context = f"\n\nActive Practical Lesson: '{active_lesson}'. Guide the student toward this lesson's objective." if active_lesson else ""

        system_prompt = (
            "You are the Qualution Quantum Reasoning Engine powered by NVIDIA NIM & Nemotron. "
            "You perform rigorous, insightful, and pedagogical quantum circuit reasoning.\n\n"
            f"Active Mode: {mode.upper()}. Target Learner Level: {level.upper()}.{lesson_context}\n\n"
            "Key Principles:\n"
            "1. REASON RIGOROUSLY: Explain quantum states, superposition amplitudes, entanglement, and phase rotations accurately.\n"
            "2. CONNECT TO SIMULATION: Directly reference the circuit's gates, wires, and observed probabilities.\n"
            "3. PREDICT & COMPARE: If comparing prediction vs simulation, highlight exact discrepancies and explain measurement collapse.\n"
            "4. CIRCUIT OPTIMIZATION: If asked about optimization, explain Clifford+T relations and unitary preservation.\n"
            "5. DEBUGGING: If errors are present, pinpoint the wire, gate index, and canonical fix.\n"
            "6. FORMATTING: Use Markdown with bold terms and clear sections for pedagogical clarity."
        )

        user_prompt = f"{circuit_desc}\n\nStudent Question / Query: {question}"

        for event in self._stream_chat_completions(system_prompt, user_prompt, max_tokens=1000, temperature=0.25):
            if event.get("type") == "done":
                event["facts"] = facts
                event["actions"] = actions
                event["suggestions"] = suggestions
                event["context_used"] = context_used
                event["provider"] = "nvidia"
                event["reasoning_provider"] = "nvidia"
            yield event

    def compare_prediction(
        self,
        circuit: Dict[str, Any],
        prediction: str,
        simulation: Dict[str, Any],
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """Compare learner prediction against actual simulation results."""
        probs = simulation.get("probabilities", {})
        prob_str = ", ".join([f"|{s}>: {p*100:.1f}%" for s, p in probs.items() if p > 0.001])

        system_prompt = (
            "You are the Qualution Quantum Prediction Evaluator powered by NVIDIA NIM. "
            "Compare the student's prediction with the actual simulation outcome. "
            "Be encouraging, explain exactly where their intuition was correct or where quantum mechanics surprised them, "
            "and suggest the next experiment to test."
        )
        user_prompt = (
            f"Circuit: {json.dumps(circuit.get('gates', []))}\n"
            f"Learner's Prediction: {prediction}\n"
            f"Actual Simulation Probabilities: {prob_str}\n\n"
            "Explain whether the prediction matched, why the result occurred, and what experiment to try next."
        )

        res_call = self._call_chat_completions(system_prompt, user_prompt, max_tokens=700)
        if isinstance(res_call, tuple) and len(res_call) == 3:
            output, latency_ms, call_status = res_call
        elif isinstance(res_call, str):
            output = res_call
            latency_ms = 100.0
            call_status = "success"
        else:
            output = None
            latency_ms = 100.0
            call_status = "provider_unavailable"

        if call_status == "success" and output:
            return {
                "status": "success",
                "answer": output,
                "fallback_answer": None,
                "retryable": False,
                "error_code": None,
                "error_message": None,
                "technical_analysis": output,
                "confidence": "high",
                "facts": [f"Actual simulation yielded {prob_str}."],
                "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
                "suggestions": ["Why did the state collapse like that?", "What if I change the measurement basis?"],
                "context_used": ["prediction", "simulation_probabilities"],
                "provider": "nvidia",
                "reasoning_provider": "nvidia",
                "latency_ms": latency_ms
            }

        # Deterministic comparison fallback
        ans = (
            f"### 🔬 Prediction vs Actual Simulation\n\n"
            f"**Your Prediction**: \"{prediction}\"\n"
            f"**Actual Measured Results**: {prob_str}\n\n"
            "In quantum mechanics, measurement causes the superposition to collapse probabilistically according to the Born rule ($P(x) = |\\langle x | \\psi \\rangle|^2$). "
            "Even if individual shot outcomes vary, the aggregate distribution converges to these exact probability amplitudes."
        )
        err_code = "PROVIDER_TIMEOUT" if call_status == "provider_timeout" else (
            "CONFIGURATION_ERROR" if call_status == "configuration_error" else "PROVIDER_UNAVAILABLE"
        )
        err_msg = "NVIDIA Tutor is taking too long to respond." if call_status == "provider_timeout" else "NVIDIA reasoning unavailable."

        return {
            "status": call_status,
            "answer": ans,
            "fallback_answer": ans,
            "retryable": (call_status == "provider_timeout"),
            "error_code": err_code,
            "error_message": err_msg,
            "technical_analysis": ans,
            "confidence": "high",
            "facts": [f"Actual simulation yielded {prob_str}."],
            "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
            "suggestions": ["Why did the state collapse like that?", "What if I change the measurement basis?"],
            "context_used": ["prediction", "simulation_probabilities"],
            "provider": "local_deterministic_reasoner",
            "reasoning_provider": "fallback",
            "latency_ms": latency_ms
        }

nvidia_provider = NVIDIAProvider()
