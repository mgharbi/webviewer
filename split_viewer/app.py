"""Run a Flask webserver for image viewing."""
import os
from flask import Flask, render_template, send_from_directory, request, jsonify

IMAGE_ROOT = os.environ["IMAGE_ROOT"]
IMAGE_ROOT = os.path.abspath(IMAGE_ROOT)

print("Serving images from:", IMAGE_ROOT)

app = Flask(__name__, static_url_path='', static_folder='static')

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)))

VALID_EXTENSIONS = [".jpg", ".png", ".jpeg"]

METHODS = [d for d in os.listdir(IMAGE_ROOT) if os.path.isdir(os.path.join(IMAGE_ROOT, d))]
METHODS = sorted(METHODS)
print("Available methods", METHODS)

IMAGES = [f for f in os.listdir(os.path.join(IMAGE_ROOT, METHODS[0])) if os.path.splitext(f)[-1] in VALID_EXTENSIONS]
IMAGES = sorted(IMAGES)
print("Listing images from ", METHODS[0], ", found", len(IMAGES))


@app.route('/static/js/<path:path>')
def serve_js(path):
    return send_from_directory(os.path.join('js'), path)

@app.route('/static/css/<path:path>')
def serve_css(path):
    return send_from_directory(os.path.join('css'), path)


@app.route('/image/<path:method>/<path:image>')
def serve_image(method, image):
    return send_from_directory(
        os.path.join(IMAGE_ROOT, method), image)


@app.route('/', methods=["GET"])
def home():
    selected_image = request.args.get("selected_image")
    left_method = request.args.get("left_method")
    right_method = request.args.get("right_method")

    if selected_image is None:
        selected_image = IMAGES[0]
    if left_method is None:
        left_method = METHODS[0]
    if right_method is None:
        right_method = METHODS[0]

    return render_template(
        'index.html',
        images=IMAGES, selected_image=selected_image,
        methods=METHODS, left_method=left_method,
        right_method=right_method)


@app.route('/select', methods=["POST"])
def select():
    print("select", request.form)
    return jsonify({"a": 5})
