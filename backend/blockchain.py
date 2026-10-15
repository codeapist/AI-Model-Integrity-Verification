"""Local hash-linked ledger for AI model file integrity verification.

This is an educational prototype, not a decentralized blockchain.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from typing import Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
LEDGER_PATH = os.path.join(DATA_DIR, "blockchain.json")
_LOCK = threading.Lock()
GENESIS_PREVIOUS_HASH = "0" * 64


def sha256_bytes(data: bytes) -> str:
    """Return the SHA-256 hex digest for the supplied bytes."""
    return hashlib.sha256(data).hexdigest()


def hash_file_stream(file_stream, chunk_size: int = 1024 * 1024) -> str:
    """Hash a stream in chunks so large files need not be loaded at once."""
    digest = hashlib.sha256()
    file_stream.seek(0)
    while True:
        chunk = file_stream.read(chunk_size)
        if not chunk:
            break
        digest.update(chunk)
    file_stream.seek(0)
    return digest.hexdigest()


def _canonical_block_payload(block: dict[str, Any]) -> bytes:
    fields = {
        "index": block["index"],
        "timestamp": block["timestamp"],
        "model_id": block["model_id"],
        "model_name": block["model_name"],
        "model_hash": block["model_hash"],
        "previous_hash": block["previous_hash"],
        "nonce": block["nonce"],
    }
    return json.dumps(fields, sort_keys=True, separators=(",", ":")).encode("utf-8")


def calculate_block_hash(block: dict[str, Any]) -> str:
    return sha256_bytes(_canonical_block_payload(block))


def _ensure_ledger() -> dict[str, Any]:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LEDGER_PATH):
        ledger = {"chain": [], "models": {}}
        _write_ledger(ledger)
        return ledger
    try:
        with open(LEDGER_PATH, "r", encoding="utf-8") as handle:
            ledger = json.load(handle)
    except (json.JSONDecodeError, OSError):
        raise RuntimeError("Ledger file is unreadable or contains invalid JSON.")
    if not isinstance(ledger, dict) or not isinstance(ledger.get("chain"), list):
        raise RuntimeError("Ledger structure is invalid.")
    ledger.setdefault("models", {})
    return ledger


def _write_ledger(ledger: dict[str, Any]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    temporary_path = LEDGER_PATH + ".tmp"
    with open(temporary_path, "w", encoding="utf-8") as handle:
        json.dump(ledger, handle, indent=2, sort_keys=True)
    os.replace(temporary_path, LEDGER_PATH)


def list_models() -> list[dict[str, Any]]:
    with _LOCK:
        ledger = _ensure_ledger()
        return list(ledger.get("models", {}).values())


def get_chain() -> list[dict[str, Any]]:
    with _LOCK:
        ledger = _ensure_ledger()
        return list(ledger.get("chain", []))


def register_model(model_name: str, model_hash: str, original_filename: str) -> dict[str, Any]:
    import uuid

    clean_name = (model_name or "").strip() or os.path.basename(original_filename) or "Unnamed model"
    with _LOCK:
        ledger = _ensure_ledger()
        chain = ledger["chain"]
        previous_hash = chain[-1]["block_hash"] if chain else GENESIS_PREVIOUS_HASH
        model_id = "MODEL-" + uuid.uuid4().hex[:12].upper()
        block = {
            "index": len(chain),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model_id": model_id,
            "model_name": clean_name,
            "original_filename": os.path.basename(original_filename),
            "model_hash": model_hash,
            "previous_hash": previous_hash,
            "nonce": 0,
        }
        block["block_hash"] = calculate_block_hash(block)
        chain.append(block)
        model_record = {
            "model_id": model_id,
            "model_name": clean_name,
            "original_filename": os.path.basename(original_filename),
            "model_hash": model_hash,
            "registered_at": block["timestamp"],
            "block_index": block["index"],
            "block_hash": block["block_hash"],
        }
        ledger["models"][model_id] = model_record
        _write_ledger(ledger)
        return {"model": model_record, "block": block}


def verify_model(model_id: str, submitted_hash: str) -> dict[str, Any] | None:
    with _LOCK:
        ledger = _ensure_ledger()
        model = ledger["models"].get(model_id)
        if model is None:
            return None
        matches = model["model_hash"] == submitted_hash
        return {
            "model_id": model_id,
            "registered_hash": model["model_hash"],
            "submitted_hash": submitted_hash,
            "verified": matches,
            "status": "VERIFIED" if matches else "MISMATCH",
            "message": "File matches the registered artifact." if matches else "File differs from the registered artifact.",
        }


def validate_chain() -> dict[str, Any]:
    with _LOCK:
        ledger = _ensure_ledger()
        chain = ledger["chain"]
        issues = []
        expected_previous = GENESIS_PREVIOUS_HASH
        for position, block in enumerate(chain):
            if block.get("index") != position:
                issues.append({"index": position, "issue": "Incorrect block index"})
            if block.get("previous_hash") != expected_previous:
                issues.append({"index": position, "issue": "Previous-hash link mismatch"})
            try:
                calculated = calculate_block_hash(block)
            except (KeyError, TypeError):
                issues.append({"index": position, "issue": "Block fields missing or invalid"})
                expected_previous = block.get("block_hash", "")
                continue
            if calculated != block.get("block_hash"):
                issues.append({"index": position, "issue": "Block hash mismatch"})
            expected_previous = block.get("block_hash", "")
        return {"valid": not issues, "block_count": len(chain), "issues": issues}
