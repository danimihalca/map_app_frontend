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

        fetch(request)
          .then(res => res.json())
          .then(res => {
            console.log(res);

            map.current?.addSource("aaa", {
              type: 'geojson',
              data: res
            });
            map.current?.addLayer({
              id: 'point',
              source: 'aaa',
              type: 'circle',
              paint: {
                'circle-radius': 10,
                'circle-color': '#448ee4'
              }
            });
          })
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
