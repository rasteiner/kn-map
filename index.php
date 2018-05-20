<?php

Kirby::plugin('rasteiner/kn-map', [
    'fields' => [
        'map' => [
            'props' => [
                'value' => function($value = "") {
                    return Yaml::decode($value);
                },
                'apikey' => function() {
                    $value = kirby()->option('rasteiner/kn-map/apikey');
                    if(!$value) {
                        throw new Exception('No Google Api Key set in config. Set "rasteiner/kn-map/apikey" to your Google Cloud Browser Api Key');
                    }

                    return $value;
                }
            ]
        ]
    ]
]);
