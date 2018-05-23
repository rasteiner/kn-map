----

This was an experiment. Thi project will be replaced by the [Map Section](https://github.com/rasteiner/kn-map-section) plugin

----


# kn-map
A google maps plugin for k next

Enables you to set up coordinates, zoom level and markers on a google map. 

[![Link to youtube](preview.gif)](https://www.youtube.com/watch?v=a_IKjDoQGy8)

# Install 
Download and copy folder to /site/plugins/map

You need a google API browser key with access to the Maps Javascript API and the Geolocation service. 
Then you need to set that in your **config.php** file, like this:
```php
<?php

return [
    //...
    'rasteiner/kn-map/apikey' => 'YOUR API KEY HERE',
    //...
];
```

# Example Blueprint

```yaml
fields:
  map:
    type: map
    label: My Map
    height: large # / medium / small
    default:
      lat: 46.19278
      lng: 9.01703
```

# Example content output

```yaml
Map: 

zoom: 3
coords:
  lat: '44.50446627223'
  lng: '-32.502954970489'
markers:
  - 
    lat: 48.856614
    lng: "2.3522219"
    title: Paris
  - 
    lat: "52.5200066"
    lng: "13.404954"
    title: Berlin
```
