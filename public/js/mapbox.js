/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidG9ycmVtb2xpbm8iLCJhIjoiY2tpZWd4ejc4MTNpajJxcGU4Nnc1ZnA4ciJ9.okNnAKexKAQUtGhG9Tf7hA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/torremolino/ckij1ngd90pl319p8vdubtukm',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Crear marca
    const el = document.createElement('div');
    el.className = 'marker';

    // Añadir marca
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Añadir popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds para incluir la localizacion actual
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
