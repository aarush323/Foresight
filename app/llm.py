import hashlib
import json
import re
import os
import time
from dotenv import load_dotenv

load_dotenv()

_cache = {}

def get_llm(task_type: str):
    """Get the appropriate LLM for a given task type with fallback chain."""

    if task_type in ("data_analysis", "customer_engagement"):
        # Primary: Ollama Phi3 → Fallback: Groq
        try:
            from langchain_ollama import ChatOllama
            llm = ChatOllama(model="phi3", temperature=0.3)
            llm.invoke("test")
            print(f"  [LLM] Using Ollama phi3 for {task_type}")
            return llm
        except Exception as e:
            print(f"  [LLM] Ollama phi3 unavailable: {e}")

        try:
            from langchain_groq import ChatGroq
            groq_key = os.getenv("GROQ_API_KEY")
            if groq_key:
                llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=groq_key, temperature=0.3)
                print(f"  [LLM] Using Groq for {task_type}")
                return llm
        except Exception as e:
            print(f"  [LLM] Groq unavailable: {e}")

        raise RuntimeError(f"No LLM available for {task_type}")

    elif task_type in ("diagnosis", "manufacturing", "orchestrator"):
        # Primary: Cerebras → Fallback: Groq → Last resort: Ollama
        try:
            from langchain_cerebras import ChatCerebras
            cerebras_key = os.getenv("CEREBRAS_API_KEY")
            if cerebras_key:
                llm = ChatCerebras(model="gpt-oss-120b", api_key=cerebras_key, temperature=0.3)
                print(f"  [LLM] Using Cerebras gpt-oss-120b for {task_type}")
                return llm
        except Exception as e:
            print(f"  [LLM] Cerebras unavailable: {e}")

        try:
            from langchain_groq import ChatGroq
            groq_key = os.getenv("GROQ_API_KEY")
            if groq_key:
                llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=groq_key, temperature=0.3)
                print(f"  [LLM] Using Groq fallback for {task_type}")
                return llm
        except Exception as e:
            print(f"  [LLM] Groq unavailable: {e}")

        try:
            from langchain_ollama import ChatOllama
            llm = ChatOllama(model="phi3", temperature=0.3)
            llm.invoke("test")
            print(f"  [LLM] Using Ollama phi3 last-resort for {task_type}")
            return llm
        except Exception as e:
            print(f"  [LLM] Ollama phi3 unavailable: {e}")

        raise RuntimeError(f"No LLM available for {task_type}")

    else:
        raise ValueError(f"Unknown task_type: {task_type}")


def cached_llm_call(llm, prompt: str, task_type: str = None) -> str:
    """Call LLM with in-memory caching. Falls back through Groq → Ollama on invoke failure."""
    key = hashlib.md5(prompt.encode()).hexdigest()
    if key in _cache:
        print("  [cache hit]")
        return _cache[key]

    try:
        result = llm.invoke(prompt)
        content = result.content
        _cache[key] = content
        return content

    except Exception as e:
        print(f"  [LLM invoke failed] {e}")

        if task_type:
            # Fallback 1: Groq
            try:
                from langchain_groq import ChatGroq
                fallback = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    api_key=os.getenv("GROQ_API_KEY")
                )
                print("  [LLM] Falling back to Groq")
                result = fallback.invoke(prompt)
                content = result.content
                _cache[key] = content
                return content
            except Exception as e2:
                print(f"  [Groq fallback failed] {e2}")

                # Fallback 2: Ollama
                try:
                    from langchain_ollama import ChatOllama
                    last = ChatOllama(model="phi3")
                    print("  [LLM] Falling back to Ollama phi3")
                    result = last.invoke(prompt)
                    content = result.content
                    _cache[key] = content
                    return content
                except Exception as e3:
                    print(f"  [All LLMs failed] {e3}")
                    return ""

        return ""


def safe_parse_json(response: str) -> dict:
    """Safely parse JSON from an LLM response, stripping markdown fences."""
    try:
        clean = response.strip()
        clean = re.sub(r'```json\s*', '', clean)
        clean = re.sub(r'```\s*', '', clean)
        clean = clean.strip()
        return json.loads(clean)
    except Exception:
        return {"error": True, "raw": response}
