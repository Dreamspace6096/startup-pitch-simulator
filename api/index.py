from flask import Flask, request, jsonify, send_from_directory
from main import app as flask_app

app = flask_app

@app.route('/')
def serve_index():
    return send_from_directory('../templates', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../', path) 