"""Flask API for registering and verifying AI model file integrity."""
from __future__ import annotations

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from blockchain import (
    hash_file_stream,
    list_models,
    get_chain,
    register_model,
    validate_chain,
    verify_model,
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024
CORS(app)


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"error": "File exceeds the 100 MB upload limit."}), 413


@app.errorhandler(RuntimeError)
def ledger_error(error):
    return jsonify({"error": str(error)}), 500


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "AI Model Integrity Verification API"})


@app.post("/api/register")
def register():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Select a model file to register."}), 400

    filename = secure_filename(uploaded.filename) or "uploaded-model"
    model_name = request.form.get("model_name", "").strip() or os.path.splitext(filename)[0]
    model_hash = hash_file_stream(uploaded.stream)
    result = register_model(model_name, model_hash, filename)
    return jsonify({
        "success": True,
        "message": "Model registered successfully.",
        "model_id": result["model"]["model_id"],
        "model_hash": model_hash,
        "model": result["model"],
        "block": result["block"],
    }), 201


@app.post("/api/verify")
def verify():
    model_id = request.form.get("model_id", "").strip()
    uploaded = request.files.get("file")
    if not model_id:
        return jsonify({"error": "Model ID is required."}), 400
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Select a file to verify."}), 400

    submitted_hash = hash_file_stream(uploaded.stream)
    result = verify_model(model_id, submitted_hash)
    if result is None:
        return jsonify({"error": "No registered model was found for that model ID."}), 404
    return jsonify(result)


@app.get("/api/models")
def models():
    return jsonify({"models": list_models()})


@app.get("/api/chain")
def chain():
    blocks = get_chain()
    return jsonify({"length": len(blocks), "chain": blocks})


@app.get("/api/chain/validate")
def chain_validate():
    result = validate_chain()
    return jsonify(result), (200 if result["valid"] else 409)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
