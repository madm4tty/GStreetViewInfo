# Google Street View Info

Google Street View Info is an interactive mapping application that displays street names and their corresponding Street View image date. Quickly see how up to date street-level imagery is for a given location without needing to enter a Streetview panorama view.

![Google Street View Info Screenshot](screenshot.png)

## Features

- Interactive Google Maps integration
- Displays street names and Street View image dates
- Search functionality for specific locations
- Marker display on the map for selected street names
- Toggle Points of Interest (POIs) for a cleaner map view

## How to Use

1. You will see a Google Map view on the left side of the screen and an initially empty data table on the right side.
2. At zoom level 17 or higher, the app will populate the info table with the visible street names and their Street View image date.
3. If there is no Street View imagery available for a street, "No imagery here" will be displayed.
4. Click on a street name in the info table, and a marker will appear on the map showing its location.
5. Click on a location on the map to view the Street View image date for that spot in a popup. If there is no Street View imagery available for the clicked location, the popup will display "No imagery here".
6. You can also use the search box to search for a specific location.
7. The 'Toggle POIs' button gives a cleaner map view.

## Installation and Setup

1. Clone the repository to your local machine.
2. Add your Google Maps API key in the `main.js` file and the `index.html` file.
3. Run a local server to host the files (e.g., using Python's SimpleHTTPServer or Live Server for Visual Studio Code).

## Built With

- HTML
- CSS
- JavaScript
- Google Maps API
- Roboto font

## License

This project is licensed under the MIT License.

## Author

Matt Follows - [Your GitHub Profile](https://github.com/madm4tty)
