from http.server import BaseHTTPRequestHandler
import json
import subprocess
import os
import sys

ALLOWED_SCRIPTS = {"check_unique.py", "validate_puzzle.py", "generate_thematic_image.py"}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            req = json.loads(post_data)
            
            script_name = req.get("script")
            
            # The lambda env puts the root at cwd usually, but safer to use __file__
            rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            script_path = os.path.join(rootDir, "scripts", script_name)
            
            cmd = [sys.executable, script_path]
            temp_files = []
            
            if "file_content" in req:
                import tempfile
                fd, path = tempfile.mkstemp(suffix=".json")
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    f.write(req["file_content"])
                temp_files.append(path)
                cmd.append(path)
                
            if "image_base64" in req:
                import tempfile, base64
                fd, path = tempfile.mkstemp(suffix=".png")
                with os.fdopen(fd, 'wb') as f:
                    f.write(base64.b64decode(req["image_base64"]))
                temp_files.append(path)
                cmd.extend(["--image", path])
                
            if "prompt" in req:
                cmd.extend(["--prompt", req["prompt"]])
            if "api_key" in req:
                cmd.extend(["--api_key", req["api_key"]])
            if "title" in req:
                 cmd.extend(["--title", req["title"]])
            if "author" in req:
                 cmd.extend(["--author", req["author"]])
            
            if "rules_content" in req:
                import tempfile
                fd, path = tempfile.mkstemp(suffix=".txt")
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    f.write(req["rules_content"])
                temp_files.append(path)
                cmd.extend(["--rules_file", path])
                
            if "structure_content" in req:
                import tempfile
                fd, path = tempfile.mkstemp(suffix=".txt")
                with os.fdopen(fd, 'w', encoding='utf-8') as f:
                    f.write(req["structure_content"])
                temp_files.append(path)
                cmd.extend(["--structure_file", path])
            
            args = req.get("args", [])
            cmd.extend(args)
            
            stdin_data = req.get("stdin", "")
            result = subprocess.run(cmd, input=stdin_data, capture_output=True, text=True)
            
            for path in temp_files:
                try: os.remove(path)
                except: pass
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
