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
  const [updateOriginOnMap, setUpdateOriginOnMap] = React.useState(false);

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
    if (!updateOriginOnMap) {
      return;
    }

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
            coordinates: [parseFloat(coordArray[0]), parseFloat(coordArray[1])]
          },
          properties: {
            title: 'ORIGIN',
            iii: '📍'
          }
        }
      ]
    };

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
    setUpdateOriginOnMap(false);

  }, [origin, updateOriginOnMap]);


  let calculateRoute = (destination:any) => {
    if (origin === '') {
      console.warn("No origin location set.");
      return;
    }

    let coordinates = origin + ';' + destination.geometry.coordinates[0] + ',' + destination.geometry.coordinates[1]

    let url = process.env.REACT_APP_NAVIGATION_API_ENDPOINT  + '/directions/coordinates=' + coordinates;

    const request: RequestInfo = new Request(url);

    fetch(request)
      .then(res => res.json())
      .then(res => {
        const data = res.routes[0];
        const route = data.geometry.coordinates;
        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: route
          }
        };

        if (map.current?.getSource('route')) {
          (map.current.getSource('route') as GeoJSONSource).setData(geojson);
        }
        else {
          map.current?.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
      });
  };

  React.useEffect(() => {
    if (searchText === '') {
      return;
    }

    let url = process.env.REACT_APP_SEARCH_API_ENDPOINT + '/search/places/' + searchText;

    if (origin !== '') {
      url += '?proximity=' + origin;
    }

    const request: RequestInfo = new Request(url);

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
              <ListItem
                alignItems="flex-start"
                onClick={ () => {
                  calculateRoute(element);
                }}
                >
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

      <Button 
        variant="contained"
        color='inherit'
        style={{ display: askForAccessToken ? 'none' : undefined }}
        onClick={() => {
          const successCallback = (position:any) => {
            let prettyLocation = position.coords.longitude.toString() +','+position.coords.latitude.toString();
            setOrigin(prettyLocation);
            setUpdateOriginOnMap(true);
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
        style={{ display: askForAccessToken ? 'none' : undefined }}
        value={origin}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setOrigin(event.target.value)
        }}
        sx={{
          input: {
            color: "black",
            background: "white"
          }
        }}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            setUpdateOriginOnMap(true);
            ev.preventDefault();
          }
        }}
      />


    </div>
  );
}

export default App;
