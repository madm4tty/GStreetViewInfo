import os
import sys

from flask import Flask, render_template

app = Flask(__name__)

# SECURITY: The Google Maps API key is exposed client-side (required by the
# Maps JavaScript API). You MUST restrict this key in the Google Cloud Console:
#   1. Set HTTP referrer restrictions to your domain(s) only
#   2. Restrict the key to only: Maps JavaScript API, Geocoding API, Street View API
#   3. Set a daily quota / budget cap to limit abuse
google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
if not google_maps_api_key:
    sys.exit("ERROR: GOOGLE_MAPS_API_KEY environment variable is not set.")


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://maps.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src https://fonts.gstatic.com; "
        "img-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com data:; "
        "connect-src 'self' https://maps.googleapis.com https://overpass-api.de; "
        "frame-src 'none'; "
        "object-src 'none';"
    )
    return response


@app.route('/')
def index():
    return render_template('index.html', google_maps_api_key=google_maps_api_key)


if __name__ == '__main__':
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "8080"))
    app.run(host=host, port=port, debug=False)
