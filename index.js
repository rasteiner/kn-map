;(() => {


  function apiLoader() {
    let mapsLoading = false
    let mapsLoaded = false

    const deferreds = []

    return (key) => {
      const deferred = {};

      if (mapsLoaded) {
        return new Promise((resolve) => resolve())
      }

      if (!mapsLoading) {
        mapsLoading = true;
        const script = document.createElement('script')
        const callback = 'rasteinerknmapinit'
        const options = {
          key,
          callback,
        };
        const url = 'https://maps.googleapis.com/maps/api/js?' +
          Object.keys(options)
            .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(options[key]))
            .join('&')
        script.setAttribute('src', url)
        script.setAttribute('async', '')
        script.setAttribute('defer', '')
        document.head.appendChild(script);

        window[callback] = () => {
          mapsLoaded = true
          for(let d of deferreds) {
            d.resolve();
          }
        }
        script.addEventListener('error', (e) => {
          for (let d of deferreds) {
            d.reject(e);
          }
        })
      }

      deferreds.push(deferred)

      return new Promise((resolve, reject) => {
        deferred.resolve = resolve
        deferred.reject = reject
      })
    }

  }

  const loadApi = apiLoader()

  panel.plugin('rasteiner/kn-map', {
    fields: {
      map: {
        props: {
          label: String,
          value: Object,
          default: Array,
          apikey: String,
          height: {
            default: 'medium',
            type: String,
            validator(value) {
              return ['small', 'medium', 'large'].indexOf(value) !== -1
            },
          },
        },
        mounted() {
          loadApi(this.apikey).then(() => {
            const container = this.$refs.mapcontainer;
            const map = new google.maps.Map(container, {
              center: this.coords,
              zoom: this.zoom || 10,
            })
            this.map = map

            map.addListener('dragend', () => {
              this.coords = {
                lat: parseFloat(map.getCenter().lat()),
                lng: parseFloat(map.getCenter().lng()),
              }
              this.emit()
            })

            map.addListener('zoom_changed', () => {
              if(this.updatingmap) return
              this.zoom = parseInt(map.getZoom())
              this.emit()
            })
            const marker = new google.maps.Marker({
              position: map.getCenter(),
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 3
              },
              title: 'Center',
              draggable: false,
              map: map
            });

            this.rendermarkers()

            marker.bindTo('position', map, 'center')

          })
        },
        watch: {
          value(value, oldvalue) {
            this.updatingmap = true
            //center
            this.map.panTo({
              lat: parseFloat(value.coords.lat),
              lng: parseFloat(value.coords.lng)
            })
            this.coords = value.coords

            //zoom
            if (parseInt(value.zoom || 10) !== parseInt(oldvalue.zoom || 10)) {
              this.map.setZoom(parseInt(value.zoom || 10))
            }

            //markers
            this.rendermarkers()

            this.updatingmap = false
          },

        },
        data() {
          let defaultCoords = { lat: 46.9480900, lng: 7.4474400 }

          //check if default coords are valid
          if (this.default && !isNaN(this.default.lat) && !isNaN(this.default.lng)) {
            defaultCoords = {
              lat: parseFloat(this.default.lat),
              lng: parseFloat(this.default.lng)
            }
          }

          if (this.value.coords && this.value.coords.lat) {
            this.value.coords.lat = parseFloat(this.value.coords.lat);
          }

          if (this.value.coords && this.value.coords.lng) {
            this.value.coords.lng = parseFloat(this.value.coords.lng);
          }

          return {
            coords: this.value.coords || defaultCoords,
            zoom: this.value.zoom || 10,
            searchingvalue: '',
            map: null,
            markers: []
          }
        },
        methods: {
          rendermarkers() {
            if (this.allmarkers) {
              this.allmarkers.forEach((m) => {
                m.setMap(null);
              })
            }
            this.allmarkers = []
            this.markers = this.value.markers || []
            this.markers.forEach(m => {
              const marker = new google.maps.Marker({
                map: this.map,
                draggable: true,
                position: {
                  lat: parseFloat(m.lat),
                  lng: parseFloat(m.lng)
                },
                title: m.title
              })
              marker.addListener('dragend', () => {
                m.lat = marker.getPosition().lat()
                m.lng = marker.getPosition().lng()
                this.emit()
              })

              this.allmarkers.push(marker)
            });
          },
          searchcenter(value) {
            const coder = new google.maps.Geocoder()
            coder.geocode({ address: value.location }, (results, status) => {
              if (status === 'OK') {
                this.coords = {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                }
                this.$refs.centerdialog.close()
                this.emit()
              } else {
                this.$refs.centerdialog.error('Geocode failed because: ' + status)
              }
            })
          },
          addmarker(value) {
            const coder = new google.maps.Geocoder()
            coder.geocode({address: value.location}, (results, status) => {
              if(status === 'OK') {
                this.markers.push({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  title: value.label
                })

                this.$refs.markerdialog.close()
                this.emit()
              } else {
                this.$refs.markerdialog.error('Geocode failed because: ' + status)
              }
            })
          },
          removeMarker(index) {
            this.markers.splice(index, 1)
            this.emit()
          },
          emit() {
            this.$emit('input', {
              zoom: this.zoom,
              coords: this.coords,
              markers: this.markers,
            });
          }
        },
        template: `
          <kirby-field :label="label" class="rasteiner-k3-map-field">
            <kirby-button-group slot="options">
              <kirby-button icon="globe" @click="$refs.centerdialog.open()">Search center</kirby-button>
              <kirby-button icon="add" @click="$refs.markerdialog.open()">Add Marker</kirby-button>
            </kirby-button-group>
            <kirby-grid>
              <kirby-column width="2/3">
                <div ref="mapcontainer" :class="height"></div>
              </kirby-column>
              <kirby-column width="1/3">
                <kirby-text>
                  <p>
                    <strong>Location: </strong><br>
                    lat: {{coords.lat}}<br>
                    lng: {{coords.lng}}
                  </p>
                  <p>
                    <strong>Zoom: </strong> {{zoom}}
                  </p>
                  <strong>Markers: </strong> <br>
                </kirby-text>
                <kirby-list v-if="markers.length">
                  <kirby-list-item v-for="(m, i) in markers" :key="i" :icon="{type: 'globe', back: 'black'}" :flag="{ icon: 'trash', click: removeMarker }" :text="m.title" />
                </kirby-list>
                <div v-else>No Markers yet. You could <kirby-button icon="add" @click="$refs.markerdialog.open()">add one</kirby-button>.</div>
              </kirby-column>
            <kirby-grid>

            <kirby-dialog ref="markerdialog" @submit="$refs.markerform.submit()">
              <kirby-form ref="markerform" @submit="addmarker" :fields="{label: {label: 'Label', type: 'text'}, location: {label: 'Location', type: 'text'}}" />
            </kirby-dialog>

            <kirby-dialog ref="centerdialog" @submit="$refs.centerform.submit()">
              <kirby-form ref="centerform" @submit="searchcenter" :fields="{location: {label: 'Location', type: 'text'}}" />
            </kirby-dialog>
          </kirby-field>
        `,
      }
    }
  })

})()
