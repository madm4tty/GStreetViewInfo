from flask import Flask, render_template
import os

app = Flask(__name__)
google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")

# Print the API key to the terminal
print(f"Google Maps API Key: {google_maps_api_key}")

@app.route('/')
def index():
  return render_template('index.html', google_maps_api_key=google_maps_api_key)


if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8080)
