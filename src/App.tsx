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
import Button from '@mui/material/Button';

let apiToken: string;

function App() {
  const [askForAccessToken, setAskForAccessToken] = React.useState(true);
  const mapContainerRef = React.useRef<any>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const tokenField = React.useRef<HTMLInputElement | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [origin, setOrigin] = React.useState('');

  let [searchResultsList, setSearchResultsList] = React.useState<ReactElement | null>(null);

  React.useEffect(() => {
    if (!map.current && !askForAccessToken) {
      mapboxgl.accessToken = apiToken;
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [23.590659, 46.770292],
        zoom: 9
      });
    }
  }, [mapContainerRef, askForAccessToken]);

  React.useEffect(() => {
    if (!map.current) {
      return;
    }

    if (origin === '') {
      return;
    }
    let coordArray = origin.split(',');

    const geojson = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [parseFloat(coordArray[1]), parseFloat(coordArray[0])]
          },
          properties: {
            title: 'ORIGIN',
            iii: '📍'
          }
        }
      ]
    };
    console.log(geojson)

    if (map.current?.getSource("origin")) {
      (map.current.getSource("origin") as GeoJSONSource).setData(geojson);
    }
    else {
      map.current?.addSource("origin", {
        type: 'geojson',
        data: geojson
      });
      map.current?.addLayer({
        id: 'originLayer',
        source: 'origin',
        type: 'symbol',
        layout: {
          'text-field': ['get', 'title'],
          'icon-image': '{iii}-13',
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
    

  }, [origin]);

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
      <Popup open={askForAccessToken} modal closeOnDocumentClick={false}>
        {(close => (
          <div className="modal">
            <div className="header"> Access Token </div>
            <div className="content">
              <input
                name="myInput"
                ref={tokenField}
                onKeyPress={(event) => {
                  if (event.key == "Enter") {
                    apiToken = tokenField.current?.value || "";
                    setAskForAccessToken(false);
                  }
                }}
              />
            </div>
            <div className="actions">
              <button
                className="button"
                onClick={() => {
                  apiToken = tokenField.current?.value || "";
                  setAskForAccessToken(false);
                }}
              >
                Enter
              </button>
            </div>
          </div>
        ))()}
      </Popup>
      <div className='map-container' ref={mapContainerRef} hidden={askForAccessToken} />
      <TextField
        id="standard-search"
        label="Search"
        type="search"
        variant="filled"
        style={{ display: askForAccessToken ? 'none' : undefined }}
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

      <Button variant="contained" color='inherit'
      onClick={() => {
        const successCallback = (position:any) => {
          console.log(position);
          let prettyLocation = position.coords.latitude.toString() +','+position.coords.longitude.toString();
          setOrigin(prettyLocation);
        };
        
        const errorCallback = (error:any) => {
          console.log(error);
        };
        
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
        
      }}
      >📍</Button>
      <TextField
        id="location_input"
        label="Location"
        type="text"
        variant="filled"
        value={origin}
        // style={{ display: askForAccessToken ? 'none' : undefined }}
        sx={{
          input: {
            color: "black",
            background: "white"
          }
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            //TODO: set location
            ev.preventDefault();
          }
        }}
      />


    </div>
  );
}

export default App;
