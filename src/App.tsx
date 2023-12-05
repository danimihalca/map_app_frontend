import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

import './App.css';

import React from 'react';

import Popup from 'reactjs-popup';

let apiToken: string;

function App() {
  const [isOpen, setIsOpen] = React.useState(true);
  const mapContainerRef = React.useRef<any>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const tokenField = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!map.current && !isOpen) {
      mapboxgl.accessToken = apiToken;
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [23.590659, 46.770292],
        zoom: 9
      });

      map.current.on('load', function () {
        const request: RequestInfo = new Request('http://127.0.0.1:12345/search/places/kfc');

        const useCachedResults = false;

        var setResultsOnMap = (res: any) => {
          for (var i = 0; i < res.features.length; ++i) {
            res.features[i].properties.index = i + 1;
          }

          map.current?.addSource("aaa", {
            type: 'geojson',
            data: res
          });
          map.current?.addLayer({
            id: 'point',
            source: 'aaa',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'index'],
              'icon-image': 'border-dot-13',
              'text-font': [
                'Open Sans Bold',
                'Arial Unicode MS Bold'
              ],
              'text-size': 15,
              'text-transform': 'uppercase',
              'text-letter-spacing': 0.05,
              'text-offset': [0, 1.5],

            },
            paint: {
              'text-color': '#202'
            }
          });
        };

        if (useCachedResults && localStorage['results']) {
          setResultsOnMap(JSON.parse(localStorage['results']))
        }
        else {
          fetch(request)
            .then(res => res.json())
            .then(res => {
              localStorage['results'] = JSON.stringify(res);
              setResultsOnMap(res)
            })
        }
      })

    }

  }, [mapContainerRef, isOpen]);
  return (
    <div>
      <Popup open={isOpen} modal closeOnDocumentClick={false}>
        {(close => (
          <div className="modal">
            <div className="header"> Access Token </div>
            <div className="content">
              <input name="myInput" ref={tokenField} />
            </div>
            <div className="actions">
              <button
                className="button"
                onClick={() => {
                  apiToken = tokenField.current?.value || "";
                  setIsOpen(false);
                }}
              >
                Enter
              </button>
            </div>
          </div>
        ))()}
      </Popup>
      <div className='map-container' ref={mapContainerRef} hidden={isOpen} />
    </div>
  );
}

export default App;
