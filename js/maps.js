
  function initialize() {
    var mapOptions = {
      center: { lat: 51.760, lng: -1.239},
      zoom: 14
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
  }
  google.maps.event.addDomListener(window, 'load', initialize);
