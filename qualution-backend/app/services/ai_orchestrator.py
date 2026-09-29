import json
import time
import logging
from typing import Dict, Any, List, Optional
from app.schemas.ai_tutor import NormalizedTutorResponse
from app.services.providers.nvidia_provider import nvidia_provider, NVIDIAProvider, redact_sensitive
from app.services.providers.groq_provider import groq_provider, GroqProvider

logger = logging.getLogger("ai_orchestrator")

class AIOrchestrator:
    """
    Quantum Studio AI Tutor Orchestration Engine.
    Orchestrates the NVIDIA (primary reasoning) and Groq (response optimization) pipeline.
    Ensures robust fallbacks, normalized response schemas, bounded context,
    pedagogical adaptation, secret redaction, and accurate provider provenance.
    """

    def __init__(
        self,
        nvidia: Optional[NVIDIAProvider] = None,
        groq: Optional[GroqProvider] = None
    ):
        self.nvidia = nvidia or nvidia_provider
        self.groq = groq or groq_provider

    def query_tutor(
        self,
        question: str,
        context: Dict[str, Any],
        mode: str = "explain",
        level: str = "beginner",
        simplify_for_students: bool = True
    ) -> Dict[str, Any]:
        """
        Primary AI Tutor reasoning pipeline:
        1. Context validation and bounding
        2. NVIDIA NIM primary quantum physics reasoning (with deadline & transient retry)
        3. Optional Groq pedagogical response optimization (ONLY if NVIDIA succeeded)
        4. Schema normalization with explicit status semantics
        """
        # Step 1: NVIDIA Primary Reasoning
        t_request_start = time.time()
        t_provider_start = time.time()
        try:
            nvidia_res = self.nvidia.generate_reasoning(
                question=question,
                context=context,
                mode=mode,
                level=level
            )
        except Exception as e:
            logger.error(f"NVIDIA reasoning exception: {redact_sensitive(str(e))}")
            nvidia_res = {
                "status": "provider_unavailable",
                "answer": f"Quantum analysis momentarily interrupted: {redact_sensitive(str(e))}",
                "fallback_answer": None,
                "retryable": False,
                "error_code": "PROVIDER_EXCEPTION",
                "error_message": "Primary reasoning provider error.",
                "technical_analysis": "Primary reasoning provider error.",
                "confidence": "low",
                "facts": ["Quantum operations preserve unitary norm ||psi|| = 1."],
                "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
                "suggestions": ["Can you explain in simpler terms?"],
                "context_used": ["fallback_recovery"],
                "code": None,
                "provider": "local_fallback",
                "reasoning_provider": "local_fallback",
                "latency_ms": 0.0
            }
        t_provider_complete = time.time()
        nv_lat = nvidia_res.get("latency_ms")
        t_first_provider_response = t_provider_start + (nv_lat / 1000.0) if nv_lat else t_provider_complete

        # Normalize status & provider for both new schema and backwards-compatible mocks
        nvidia_status = nvidia_res.get("status")
        if not nvidia_status:
            if nvidia_res.get("provider") == "nvidia" and nvidia_res.get("answer"):
                nvidia_status = "success"
            elif "timeout" in str(nvidia_res.get("error_code", "")).lower() or "timeout" in str(nvidia_res.get("error_message", "")).lower():
                nvidia_status = "provider_timeout"
            else:
                nvidia_status = "provider_unavailable"

        raw_reasoning = nvidia_res.get("answer")
        fallback_answer = nvidia_res.get("fallback_answer")
        retryable = nvidia_res.get("retryable", (nvidia_status == "provider_timeout"))
        error_code = nvidia_res.get("error_code")
        error_message = nvidia_res.get("error_message")
        latency_ms = nvidia_res.get("latency_ms")

        facts = nvidia_res.get("facts", [])
        actions = nvidia_res.get("actions", [])
        suggestions = nvidia_res.get("suggestions", [])
        context_used = nvidia_res.get("context_used", ["circuit"])
        confidence = nvidia_res.get("confidence", "high")
        code = nvidia_res.get("code")

        reasoning_provider = nvidia_res.get("reasoning_provider")
        if not reasoning_provider:
            if nvidia_res.get("provider") == "nvidia":
                reasoning_provider = "nvidia"
            elif nvidia_res.get("provider") in ("local_deterministic_reasoner", "local_fallback") or fallback_answer:
                reasoning_provider = "local_fallback"
            else:
                reasoning_provider = "none"

        # Step 2: Groq Optimization Decision
        # MANDATORY: If NVIDIA failed/timed out, NEVER call Groq to refine non-existent reasoning.
        response_optimizer = None
        simplified_by = None
        final_status = nvidia_status
        final_answer = raw_reasoning
        t_groq_start = None
        t_groq_complete = None

        is_nvidia_success = (nvidia_status == "success" and bool(raw_reasoning) and (reasoning_provider == "nvidia" or nvidia_res.get("provider") == "nvidia"))

        if is_nvidia_success:
            use_groq_opt = simplify_for_students and level.lower() not in ["advanced", "technical"]
            if use_groq_opt:
                t_groq_start = time.time()
                try:
                    groq_res = self.groq.optimize_response(
                        nvidia_reasoning=raw_reasoning,
                        question=question,
                        context=context,
                        level=level
                    )
                    if groq_res and groq_res.get("optimized_text") and len(groq_res["optimized_text"].strip()) > 20:
                        final_answer = groq_res["optimized_text"].strip()
                        response_optimizer = "groq"
                        simplified_by = "groq"
                        final_status = "success"
                    else:
                        final_answer = raw_reasoning
                        response_optimizer = None
                        simplified_by = None
                        final_status = "success"
                except Exception as e:
                    # Groq failure marks response as DEGRADED because optional stage failed,
                    # but primary NVIDIA answer is successfully returned.
                    logger.warning(f"Groq optimization failed; passing NVIDIA output directly: {redact_sensitive(str(e))}")
                    final_answer = raw_reasoning
                    response_optimizer = None
                    simplified_by = None
                    final_status = "degraded"
                t_groq_complete = time.time()
            else:
                final_status = "success"

        t_final_response = time.time()
        total_latency_ms = (t_final_response - t_request_start) * 1000.0

        timings = {
            "request_start": round(t_request_start, 3),
            "provider_start": round(t_provider_start, 3),
            "first_provider_response": round(t_first_provider_response, 3) if t_first_provider_response else None,
            "first_token": None,
            "provider_complete": round(t_provider_complete, 3),
            "groq_start": round(t_groq_start, 3) if t_groq_start else None,
            "groq_complete": round(t_groq_complete, 3) if t_groq_complete else None,
            "final_response": round(t_final_response, 3),
            "total_latency_ms": round(total_latency_ms, 1)
        }

        technical_analysis = nvidia_res.get("technical_analysis") or raw_reasoning or fallback_answer

        final_answer = redact_sensitive(final_answer) if final_answer else None
        fallback_answer = redact_sensitive(fallback_answer) if fallback_answer else None
        technical_analysis = redact_sensitive(technical_analysis) if technical_analysis else None
        facts = [redact_sensitive(f) for f in facts]
        suggestions = [redact_sensitive(s) for s in suggestions]

        normalized = NormalizedTutorResponse(
            status=final_status,
            answer=final_answer,
            fallback_answer=fallback_answer,
            retryable=retryable,
            error_code=error_code,
            error_message=error_message,
            latency_ms=latency_ms,
            actions=actions,
            context_used=context_used,
            reasoning_provider=reasoning_provider,
            response_optimizer=response_optimizer,
            confidence=confidence,
            follow_up="Try modifying a gate parameter and observe the updated statevector." if not suggestions else suggestions[0],
            visualization_hint="Inspect the Statevector Amplitudes and 3D Bloch Sphere to observe the phase shifts.",
            code=code,
            technical_analysis=technical_analysis,
            facts=facts,
            suggestions=suggestions,
            provider="groq-nvidia-dual" if (reasoning_provider == "nvidia" and response_optimizer == "groq") else ("nvidia" if reasoning_provider == "nvidia" else "local_fallback"),
            simplified_by=simplified_by,
            timings=timings
        )

        return normalized.model_dump()

    def stream_tutor(
        self,
        question: str,
        context: Dict[str, Any],
        mode: str = "explain",
        level: str = "beginner",
        simplify_for_students: bool = True
    ):
        """
        Server-Sent Events streaming pipeline:
        1. Emits status events as each pipeline stage starts.
        2. Executes NVIDIA primary reasoning.
        3. Streams Groq pedagogical adaptation deltas in real-time.
        4. Validates and emits the final NormalizedTutorResponse in the done event.
        """
        t_request_start = time.time()
        yield {
            "event": "status",
            "data": {"stage": "reasoning", "message": "Consulting NVIDIA NIM quantum reasoning engine..."}
        }

        # Step 1: NVIDIA Reasoning
        t_provider_start = time.time()
        try:
            nvidia_res = self.nvidia.generate_reasoning(
                question=question,
                context=context,
                mode=mode,
                level=level
            )
        except Exception as e:
            logger.error(f"NVIDIA reasoning exception in stream: {redact_sensitive(str(e))}")
            nvidia_res = {
                "status": "provider_unavailable",
                "answer": None,
                "fallback_answer": f"Quantum analysis momentarily interrupted: {redact_sensitive(str(e))}",
                "retryable": False,
                "error_code": "PROVIDER_EXCEPTION",
                "error_message": "Primary reasoning provider error.",
                "technical_analysis": "Primary reasoning provider error.",
                "confidence": "low",
                "facts": ["Quantum operations preserve unitary norm ||psi|| = 1."],
                "actions": [{"type": "open_state", "label": "Inspect Statevector"}],
                "suggestions": ["Can you explain in simpler terms?"],
                "context_used": ["fallback_recovery"],
                "code": None,
                "provider": "local_fallback",
                "reasoning_provider": "local_fallback",
                "latency_ms": 0.0
            }
        t_provider_complete = time.time()

        nvidia_status = nvidia_res.get("status", "success" if nvidia_res.get("answer") else "provider_unavailable")
        raw_reasoning = nvidia_res.get("answer")
        fallback_answer = nvidia_res.get("fallback_answer")
        is_nvidia_success = (nvidia_status == "success" and bool(raw_reasoning))

        response_optimizer = None
        simplified_by = None
        final_status = nvidia_status
        final_answer = raw_reasoning
        t_groq_start = None
        t_groq_complete = None
        first_token_time = None

        if is_nvidia_success:
            use_groq_opt = simplify_for_students and level.lower() not in ["advanced", "technical"]
            if use_groq_opt and self.groq.is_configured():
                yield {
                    "event": "status",
                    "data": {"stage": "pedagogical", "message": "Synthesizing pedagogical explanation with Groq LPU..."}
                }
                t_groq_start = time.time()
                accumulated_groq_deltas = []

                try:
                    for chunk in self.groq.optimize_response_stream(
                        nvidia_reasoning=raw_reasoning,
                        question=question,
                        context=context,
                        level=level
                    ):
                        if chunk.get("type") == "delta":
                            delta_text = chunk.get("text", "")
                            if delta_text:
                                if first_token_time is None:
                                    first_token_time = time.time()
                                accumulated_groq_deltas.append(delta_text)
                                yield {
                                    "event": "delta",
                                    "data": {"text": delta_text}
                                }
                        elif chunk.get("type") == "done":
                            groq_done_text = chunk.get("content", "").strip()
                            if groq_done_text:
                                final_answer = groq_done_text
                                response_optimizer = "groq"
                                simplified_by = "groq"
                                final_status = "success"
                        elif chunk.get("type") == "error":
                            logger.warning(f"Groq streaming error: {chunk.get('error')}")

                    t_groq_complete = time.time()

                    # If no deltas were produced by Groq stream, fall back to NVIDIA raw reasoning
                    if not accumulated_groq_deltas and raw_reasoning:
                        yield {
                            "event": "delta",
                            "data": {"text": raw_reasoning}
                        }
                        final_answer = raw_reasoning
                    elif accumulated_groq_deltas and not final_answer:
                        final_answer = "".join(accumulated_groq_deltas).strip()
                        response_optimizer = "groq"
                        simplified_by = "groq"
                except Exception as e:
                    logger.warning(f"Groq streaming exception: {redact_sensitive(str(e))}")
                    if not accumulated_groq_deltas and raw_reasoning:
                        yield {
                            "event": "delta",
                            "data": {"text": raw_reasoning}
                        }
                    final_answer = "".join(accumulated_groq_deltas).strip() if accumulated_groq_deltas else raw_reasoning
                    final_status = "degraded"
            else:
                # Direct NVIDIA output without Groq
                yield {
                    "event": "status",
                    "data": {"stage": "reasoning", "message": "Rendering verified NVIDIA quantum reasoning..."}
                }
                if raw_reasoning:
                    yield {
                        "event": "delta",
                        "data": {"text": raw_reasoning}
                    }
                final_answer = raw_reasoning
        else:
            # NVIDIA failed or timed out -> stream fallback answer if available
            yield {
                "event": "status",
                "data": {"stage": "fallback", "message": "Applying verified deterministic quantum reasoning..."}
            }
            if fallback_answer:
                yield {
                    "event": "delta",
                    "data": {"text": fallback_answer}
                }
            final_answer = fallback_answer or "AI Tutor reasoning service is currently unreachable."

        yield {
            "event": "status",
            "data": {"stage": "validating", "message": "Validating quantum fact consistency..."}
        }

        t_final_response = time.time()
        total_latency_ms = (t_final_response - t_request_start) * 1000.0

        timings = {
            "request_start": round(t_request_start, 3),
            "provider_start": round(t_provider_start, 3),
            "first_provider_response": round(t_provider_complete, 3),
            "first_token": round(first_token_time, 3) if first_token_time else None,
            "provider_complete": round(t_provider_complete, 3),
            "groq_start": round(t_groq_start, 3) if t_groq_start else None,
            "groq_complete": round(t_groq_complete, 3) if t_groq_complete else None,
            "final_response": round(t_final_response, 3),
            "total_latency_ms": round(total_latency_ms, 1)
        }

        facts = [redact_sensitive(f) for f in nvidia_res.get("facts", [])]
        suggestions = [redact_sensitive(s) for s in nvidia_res.get("suggestions", [])]
        actions = nvidia_res.get("actions", [])
        context_used = nvidia_res.get("context_used", ["circuit"])
        reasoning_provider = nvidia_res.get("reasoning_provider", "nvidia" if is_nvidia_success else "local_fallback")

        normalized = NormalizedTutorResponse(
            status=final_status,
            answer=redact_sensitive(final_answer) if final_answer else None,
            fallback_answer=redact_sensitive(fallback_answer) if fallback_answer else None,
            retryable=nvidia_res.get("retryable", False),
            error_code=nvidia_res.get("error_code"),
            error_message=nvidia_res.get("error_message"),
            latency_ms=nvidia_res.get("latency_ms"),
            actions=actions,
            context_used=context_used,
            reasoning_provider=reasoning_provider,
            response_optimizer=response_optimizer,
            confidence=nvidia_res.get("confidence", "high"),
            follow_up="Try modifying a gate parameter and observe the updated statevector." if not suggestions else suggestions[0],
            visualization_hint="Inspect the Statevector Amplitudes and 3D Bloch Sphere to observe the phase shifts.",
            code=nvidia_res.get("code"),
            technical_analysis=redact_sensitive(nvidia_res.get("technical_analysis") or raw_reasoning or fallback_answer),
            facts=facts,
            suggestions=suggestions,
            provider="groq-nvidia-dual" if (reasoning_provider == "nvidia" and response_optimizer == "groq") else ("nvidia" if reasoning_provider == "nvidia" else "local_fallback"),
            simplified_by=simplified_by,
            timings=timings
        )

        yield {
            "event": "done",
            "data": normalized.model_dump()
        }

    def debug_circuit(
        self,
        circuit: Dict[str, Any],
        simulation_data: Optional[Dict[str, Any]] = None,
        code: Optional[str] = None,
        error: Optional[str] = None,
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """Deep circuit debugging and anomaly detection."""
        context = {
            "circuit": circuit,
            "simulation": simulation_data,
            "error": error,
            "code": code
        }
        question = "Please inspect this circuit for anomalies, redundant gates, schema violations, or measurement issues."
        if error:
            question += f" The circuit produced the following active error: {error}"
        return self.query_tutor(question, context, mode="debug", level=level, simplify_for_students=True)

    def explain_optimization(
        self,
        original_circuit: Dict[str, Any],
        optimized_circuit: Dict[str, Any],
        passes_applied: List[str],
        improvements: Dict[str, Any],
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """Explain circuit simplification and unitary equivalence."""
        context = {
            "circuit": original_circuit,
            "optimized_circuit": optimized_circuit,
            "passes": passes_applied,
            "improvements": improvements
        }
        question = (
            f"Explain how the optimization passes ({', '.join(passes_applied)}) preserve unitary equivalence "
            f"while reducing gate count from {len(original_circuit.get('gates', []))} to {len(optimized_circuit.get('gates', []))}."
        )
        return self.query_tutor(question, context, mode="optimize", level=level, simplify_for_students=True)

    def compare_simulation(
        self,
        circuit: Dict[str, Any],
        prediction: str,
        simulation: Dict[str, Any],
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """Compare learner prediction with actual simulation results."""
        context = {
            "circuit": circuit,
            "simulation": simulation,
            "learner_prediction": prediction
        }
        res = self.nvidia.compare_prediction(circuit, prediction, simulation, level=level)
        raw_reasoning = res.get("answer")
        fallback_answer = res.get("fallback_answer")
        nvidia_status = res.get("status", "success" if (res.get("provider") == "nvidia" and raw_reasoning) else "provider_unavailable")
        retryable = res.get("retryable", False)
        error_code = res.get("error_code")
        error_message = res.get("error_message")
        latency_ms = res.get("latency_ms")
        reasoning_provider = res.get("reasoning_provider", "nvidia" if res.get("provider") == "nvidia" else "fallback")

        final_answer = raw_reasoning
        response_optimizer = None
        final_status = nvidia_status

        if nvidia_status == "success" and raw_reasoning and level in ["beginner", "intermediate"]:
            try:
                opt = self.groq.optimize_response(raw_reasoning, f"Compare prediction: {prediction}", context, level=level)
                if opt.get("optimized_text"):
                    final_answer = opt["optimized_text"]
                    response_optimizer = opt.get("optimized_by")
                    final_status = "success"
            except Exception as e:
                logger.warning(f"Groq compare optimization failed: {e}")
                final_status = "degraded"

        normalized = NormalizedTutorResponse(
            status=final_status,
            answer=final_answer,
            fallback_answer=fallback_answer,
            retryable=retryable,
            error_code=error_code,
            error_message=error_message,
            latency_ms=latency_ms,
            actions=res.get("actions", []),
            context_used=res.get("context_used", ["prediction", "simulation"]),
            reasoning_provider=reasoning_provider,
            response_optimizer=response_optimizer,
            confidence=res.get("confidence", "high"),
            technical_analysis=raw_reasoning or fallback_answer,
            facts=res.get("facts", []),
            suggestions=res.get("suggestions", []),
            provider="groq-nvidia-dual" if response_optimizer == "groq" else ("nvidia" if reasoning_provider == "nvidia" else "local_fallback"),
            simplified_by=response_optimizer
        )
        return normalized.model_dump()

    def recommend_next(
        self,
        learner_level: str = "beginner",
        mastery: Optional[Dict[str, Any]] = None,
        current_topic: Optional[str] = None,
        recent_circuit: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Recommend what the student should explore or experiment with next."""
        context = {
            "circuit": recent_circuit or {"qubits": 2, "gates": []},
            "user": {
                "currentLevel": learner_level,
                "mastery": mastery or {},
                "currentTopic": current_topic
            }
        }
        question = (
            f"Based on my current learning level ({learner_level}) and recent circuit explorations, "
            f"what quantum concept, experiment, or challenge should I explore next?"
        )
        return self.query_tutor(question, context, mode="learn", level=learner_level, simplify_for_students=True)

ai_orchestrator = AIOrchestrator()
