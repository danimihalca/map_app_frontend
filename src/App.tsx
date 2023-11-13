import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

import './App.css';

import React from 'react';

function App() {
  const mapContainerRef =  React.useRef<any>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);

  React.useEffect(() => {
    if (!map.current) {
      mapboxgl.accessToken = 'TODO';
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40],
        zoom: 9
      });
    }

  }, [mapContainerRef]);
  return (
    <div>
      <div className='map-container' ref={mapContainerRef} />
    </div>
  );
}

export default App;
