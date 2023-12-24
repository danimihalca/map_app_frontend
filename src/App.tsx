import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

import './App.css';

import React, { ReactElement } from 'react';

import Popup from 'reactjs-popup';

import TextField from '@mui/material/TextField';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';

let apiToken: string;

function App() {
  const [isOpen, setIsOpen] = React.useState(true);
  const mapContainerRef = React.useRef<any>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const tokenField = React.useRef<HTMLInputElement | null>(null);
  const [searchText, setSearchText] = React.useState('');

  let [searchResultsList, setSearchResultsList] = React.useState<ReactElement | null>(null);

  React.useEffect(() => {
    if (!map.current && !isOpen) {
      mapboxgl.accessToken = apiToken;
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [23.590659, 46.770292],
        zoom: 9
      });
    }
  }, [mapContainerRef, isOpen]);

  React.useEffect(() => {
    if (searchText === '') {
      return;
    }

    const request: RequestInfo = new Request(process.env.REACT_APP_SEARCH_API_ENDPOINT + '/search/places/' + searchText);

    const useCachedResults = false;

    var setResultsOnMap = (res: any) => {
      for (var i = 0; i < res.features.length; ++i) {
        res.features[i].properties.index = i + 1;
      }

      if (map.current?.getSource("searchResultsSource")) {
        (map.current.getSource("searchResultsSource") as GeoJSONSource).setData(res);
      }
      else {
        map.current?.addSource("searchResultsSource", {
          type: 'geojson',
          data: res
        });
        map.current?.addLayer({
          id: 'searchResultsLayer',
          source: 'searchResultsSource',
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
      }
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

          let listItems = res.features.map((element: any) =>
            <>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <ListItemText
                    primary={element.properties.index.toString() + '.'}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={element.text}
                  secondary={element.properties.address}
                />
              </ListItem>
              <Divider />
            </>
          )

          setSearchResultsList(<List sx={{ visibility: 'visible', width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {listItems}
          </List>)

        })
    }
  }, [searchText]);


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
      <TextField
        id="standard-search"
        label="Search"
        type="search"
        variant="filled"
        sx={{
          input: {
            color: "black",
            background: "white"
          }
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            setSearchText((ev.target as HTMLTextAreaElement).value)
            ev.preventDefault();
          }
        }}
      />

      {searchResultsList}

    </div>
  );
}

export default App;
