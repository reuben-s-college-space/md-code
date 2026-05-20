#!/usr/bin/env python3
"""Simple HTTP server for Markdown Studio.

Usage:
    python serve.py [port]

Default port: 8080
Open http://localhost:8080 in your browser.
"""

import http.server
import socketserver
import sys
import os
import webbrowser
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[Server] {args[0]}")

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def run():
    os.chdir(Path(__file__).parent)
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        print(f"Markdown Studio running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        webbrowser.open(f"http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    run()
