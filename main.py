from flask import Flask, render_template
import os

app = Flask(__name__)
google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")

@app.route('/')
def index():
    return render_template('index.html', google_maps_api_key=google_maps_api_key)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
