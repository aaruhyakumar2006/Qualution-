import json
import logging
import urllib.request
import urllib.error
import re
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("groq_provider")

def redact_sensitive(text: str) -> str:
    """Redacts potential API keys from text."""
    if not text:
        return ""
    for secret in [settings.NVIDIA_API_KEY, settings.GROQ_API_KEY]:
        if secret and len(secret) > 8:
            text = text.replace(secret, f"{secret[:4]}...[REDACTED]")
    text = re.sub(r'nvapi-[A-Za-z0-9_\-]+', '[REDACTED_API_KEY]', text)
    text = re.sub(r'gsk_[A-Za-z0-9_\-]+', '[REDACTED_API_KEY]', text)
    return text

class GroqProvider:
    """
    Groq LPU Inference Provider.
    Acts as the FAST RESPONSE / RESPONSE-OPTIMIZATION LAYER.
    Responsible for pedagogical refinement, readability, and learner-level adaptation.
    Strictly preserves the factual quantum truth established by NVIDIA's primary reasoning.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = settings.GROQ_API_KEY if api_key is None else api_key
        self.base_url = (settings.GROQ_BASE_URL or "https://api.groq.com/openai/v1").rstrip("/")
        self.primary_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self.fallback_models = [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b"
        ]

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 0)

    def _call_chat_completions(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.3
    ) -> Optional[str]:
        if not self.is_configured():
            return None

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]

        connect_timeout = getattr(settings, "GROQ_CONNECT_TIMEOUT", 5.0)
        read_timeout = getattr(settings, "GROQ_READ_TIMEOUT", 15.0)
        timeout_config = httpx.Timeout(connect=connect_timeout, read=read_timeout, write=10.0, pool=5.0)

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

            try:
                with httpx.Client(timeout=timeout_config) as client:
                    resp = client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        resp_data = resp.json()
                        choices = resp_data.get("choices", [])
                        if choices and len(choices) > 0:
                            msg = choices[0].get("message", {})
                            content = (msg.get("content") or msg.get("reasoning") or "").strip()
                            if content:
                                return content
                    elif resp.status_code in (401, 403):
                        safe_err = redact_sensitive(resp.text[:120])
                        logger.warning(f"Groq auth rejected (HTTP {resp.status_code}): {safe_err}. Skipping further models.")
                        break
                    else:
                        safe_err = redact_sensitive(resp.text[:120])
                        logger.warning(f"Groq API HTTP {resp.status_code} on model '{model}': {safe_err}")
            except httpx.TimeoutException as e:
                safe_err = redact_sensitive(str(e))
                logger.warning(f"Groq timeout on model '{model}': {safe_err}")
            except Exception as e:
                safe_err = redact_sensitive(str(e))
                logger.warning(f"Groq API error on model '{model}': {safe_err}")

        return None

    def _stream_chat_completions(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 900,
        temperature: float = 0.3
    ):
        """
        Stream chat completions from Groq LPU using real upstream SSE chunks.
        Yields:
          - {"type": "delta", "text": str}
          - {"type": "done", "content": str, "model": str}
          - {"type": "error", "error": str}
        """
        if not self.is_configured():
            yield {"type": "error", "error": "Groq API key not configured."}
            return

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "User-Agent": "Qualution-Quantum-Studio/1.0"
        }

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]
        connect_timeout = getattr(settings, "GROQ_CONNECT_TIMEOUT", 5.0)
        read_timeout = getattr(settings, "GROQ_READ_TIMEOUT", 15.0)
        timeout_config = httpx.Timeout(connect=connect_timeout, read=read_timeout, write=10.0, pool=5.0)

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

            try:
                with httpx.Client(timeout=timeout_config) as client:
                    with client.stream("POST", url, json=payload, headers=headers) as resp:
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
                                yield {"type": "done", "content": full_text, "model": model}
                                return

                        if resp.status_code in (401, 403):
                            safe_err = redact_sensitive(resp.text[:120])
                            logger.warning(f"Groq auth rejected: {safe_err}")
                            yield {"type": "error", "error": "Groq authentication failed."}
                            return
            except Exception as e:
                safe_err = redact_sensitive(str(e))
                logger.warning(f"Groq stream error on model '{model}': {safe_err}")

        yield {"type": "error", "error": "Groq streaming unavailable across all models."}

    def optimize_response_stream(
        self,
        nvidia_reasoning: str,
        question: str,
        context: Dict[str, Any],
        level: str = "beginner"
    ):
        """
        Stream pedagogical optimization of NVIDIA's verified reasoning in real-time.
        Yields delta chunks and a final done event.
        """
        circ = context.get("circuit", {})
        qubits = circ.get("qubits", 2)
        gates = circ.get("gates", [])
        gate_summary = ", ".join([g.get("gate", "").upper() for g in gates]) if gates else "empty circuit"

        level_clean = level.lower().strip()
        if level_clean not in ["beginner", "intermediate", "advanced"]:
            level_clean = "technical" if level_clean == "technical" else "beginner"

        level_instructions = {
            "beginner": (
                "- Target: BEGINNER learner.\n"
                "- Tone: Welcoming, highly intuitive, zero intimidating jargon.\n"
                "- Metaphors: Use spinning coins for superposition, linked dice for entanglement, compass needles for phase.\n"
                "- Math: Minimal. Explain formulas in plain English sentences.\n"
                "- Structure: Direct 1-2 sentence answer -> 🧠 The Intuition -> 🔬 In Your Circuit -> 💡 Takeaway."
            ),
            "intermediate": (
                "- Target: INTERMEDIATE learner.\n"
                "- Tone: Clear, conceptual + mathematical balance.\n"
                "- Focus: Circuit mechanics, gate matrix action, measurement projection, basis transformations.\n"
                "- Structure: Conceptual core -> Mathematical breakdown -> Circuit action -> Next step."
            ),
            "advanced": (
                "- Target: ADVANCED learner.\n"
                "- Tone: Rigorous, concise, high information density.\n"
                "- Focus: Unitary operators, Hilbert space state evolution, physical decoherence (T1/T2), Clifford+T optimizations.\n"
                "- Structure: Formal analysis -> Algorithmic implications -> Hardware & optimization note."
            )
        }

        chosen_guidelines = level_instructions.get(level_clean, level_instructions["beginner"])

        system_prompt = (
            "You are the Qualution Pedagogical Response Optimizer powered by Groq LPU inference. "
            "Your task is to adapt the substantive quantum physics reasoning provided by NVIDIA NIM into a "
            "wonderfully clear, beautifully structured, and perfectly leveled explanation.\n\n"
            "CRITICAL GUARDRAILS:\n"
            "1. PRESERVE FACTUAL MEANING: Do NOT contradict NVIDIA's reasoning or invent conflicting quantum claims.\n"
            "2. DO NOT hallucinate gates, wires, or probabilities not present in NVIDIA's analysis.\n"
            f"3. LEVEL GUIDELINES:\n{chosen_guidelines}\n"
            "4. Keep formatting clean with Markdown headers and bullet points."
        )

        user_prompt = (
            f"Student Question: {question}\n"
            f"Circuit: {qubits} qubit(s), gates: [{gate_summary}]\n\n"
            f"--- NVIDIA NIM Quantum Reasoning ---\n{nvidia_reasoning}\n-----------------------------------\n\n"
            f"Please optimize this explanation for a {level_clean.upper()} learner."
        )

        for event in self._stream_chat_completions(system_prompt, user_prompt, max_tokens=900, temperature=0.3):
            yield event

    def optimize_response(
        self,
        nvidia_reasoning: str,
        question: str,
        context: Dict[str, Any],
        level: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Take NVIDIA's substantive quantum reasoning and optimize it for readability,
        structure, and student comprehension according to the learner's level.
        """
        circ = context.get("circuit", {})
        qubits = circ.get("qubits", 2)
        gates = circ.get("gates", [])
        gate_summary = ", ".join([g.get("gate", "").upper() for g in gates]) if gates else "empty circuit"

        level_clean = level.lower().strip()
        if level_clean not in ["beginner", "intermediate", "advanced"]:
            level_clean = "technical" if level_clean == "technical" else "beginner"

        level_instructions = {
            "beginner": (
                "- Target: BEGINNER learner.\n"
                "- Tone: Welcoming, highly intuitive, zero intimidating jargon.\n"
                "- Metaphors: Use spinning coins for superposition, linked dice for entanglement, compass needles for phase.\n"
                "- Math: Minimal. Explain formulas in plain English sentences.\n"
                "- Structure: Direct 1-2 sentence answer -> 🧠 The Intuition -> 🔬 In Your Circuit -> 💡 Takeaway."
            ),
            "intermediate": (
                "- Target: INTERMEDIATE learner.\n"
                "- Tone: Clear, conceptual + mathematical balance.\n"
                "- Focus: Circuit mechanics, gate matrix action, measurement projection, basis transformations.\n"
                "- Structure: Conceptual core -> Mathematical breakdown -> Circuit action -> Next step."
            ),
            "advanced": (
                "- Target: ADVANCED learner.\n"
                "- Tone: Rigorous, concise, high information density.\n"
                "- Focus: Unitary operators, Hilbert space state evolution, physical decoherence (T1/T2), Clifford+T optimizations.\n"
                "- Structure: Formal analysis -> Algorithmic implications -> Hardware & optimization note."
            )
        }

        chosen_guidelines = level_instructions.get(level_clean, level_instructions["beginner"])

        system_prompt = (
            "You are the Qualution Pedagogical Response Optimizer powered by Groq LPU inference. "
            "Your task is to adapt the substantive quantum physics reasoning provided by NVIDIA NIM into a "
            "wonderfully clear, beautifully structured, and perfectly leveled explanation.\n\n"
            "CRITICAL GUARDRAILS:\n"
            "1. PRESERVE FACTUAL MEANING: Do NOT contradict NVIDIA's reasoning or invent conflicting quantum claims.\n"
            "2. DO NOT hallucinate gates, wires, or probabilities not present in NVIDIA's analysis.\n"
            f"3. LEVEL GUIDELINES:\n{chosen_guidelines}\n"
            "4. Keep formatting clean with Markdown headers and bullet points."
        )

        user_prompt = (
            f"Student Question: {question}\n"
            f"Circuit: {qubits} qubit(s), gates: [{gate_summary}]\n\n"
            f"--- NVIDIA NIM Quantum Reasoning ---\n{nvidia_reasoning}\n-----------------------------------\n\n"
            f"Please optimize this explanation for a {level_clean.upper()} learner."
        )

        groq_output = self._call_chat_completions(system_prompt, user_prompt, max_tokens=900, temperature=0.3)

        if groq_output and len(groq_output.strip()) > 20:
            return {
                "optimized_text": groq_output.strip(),
                "optimized_by": "groq",
                "model": self.primary_model
            }

        # If Groq produces empty, malformed, or offline output, return None so NVIDIA response is passed directly
        return None

    def heuristic_optimizer(self, technical_text: str, question: str, level: str = "beginner") -> str:
        """Deterministic heuristic pedagogical re-formatter when external API is unreachable."""
        q_lower = question.lower()
        if "50/50" in q_lower or "superposition" in q_lower or "hadamard" in q_lower:
            return (
                "### 🪙 Student-Friendly Quantum Explanation\n\n"
                "**The Quick Intuition**: Think of your qubit like a **spinning coin in mid-air**. "
                "While spinning, it is not simply 'heads' (|0⟩) or 'tails' (|1⟩)—it is in a **superposition** of both states simultaneously. "
                "When you measure the circuit, the coin is caught flat on the table, yielding a 50% chance of Heads and 50% chance of Tails!\n\n"
                "**What the Hadamard ($H$) Gate Did**:\n"
                "- It set the coin spinning by converting computational basis $|0\\rangle$ into $(|0\\rangle + |1\\rangle)/\\sqrt{2}$.\n\n"
                "**💡 Key Student Takeaway**:\n"
                "- Superposition isn't 'unknown' or 'random'—it is a coherent quantum state with equal probability amplitudes."
            )

        if "entangle" in q_lower or "bell" in q_lower or "cx" in q_lower or "00 and 11" in q_lower:
            return (
                "### 🎲 Student-Friendly Quantum Explanation\n\n"
                "**The Quick Intuition**: Think of two qubits as a **pair of magical entangled dice**. "
                "No matter how far apart they travel, if die #1 rolls an Even number, die #2 instantly rolls an Even number as well!\n\n"
                "**How Your Circuit Created Entanglement**:\n"
                "1. **H on q0**: Puts qubit 0 into a 50/50 superposition.\n"
                "2. **CNOT (CX)**: Reads qubit 0 and flips qubit 1 conditionally. Since qubit 0 is in superposition, both qubits become non-locally connected (|00⟩ and |11⟩).\n\n"
                "**💡 Key Student Takeaway**:\n"
                "- Neither qubit has an individual state anymore—they are described by one unified two-qubit wavefunction!"
            )

        if level in ["technical", "advanced"]:
            return technical_text

        return f"### 💡 Quantum Insight\n\n{technical_text}\n\n*Tip: Observe the Statevector view to see the complex amplitude phase angles.*"

groq_provider = GroqProvider()
