(function($) {
  var geocoder = new google.maps.Geocoder();

  $.fn.autoGeocoder = function(options) {
    options = $.extend(true, {}, $.fn.autoGeocoder.defaults, options || {});

    this.setupExtras(options.setup || $.fn.autoGeocoder.base, options);
    this.each(function() {
      $(this).trigger('auto-geocoder-initialize');
    });

    return this;
  };

  $.fn.autoGeocoder.base = {
    initialize: [function(options) {
      options.initial.center = new google.maps.LatLng(
        options.initial.center[0],
        options.initial.center[1]
      );

      this.bind('auto-geocoder-initialize', function() {
        $(this).trigger('auto-geocoder-createMap');
      });
    }],

    createMap: [function(options) {
      this.bind('auto-geocoder-createMap', function() {
        var element = $('<div class="jquery-auto-geocoder-map" />');

        if (options.position == 'before' || options.position == 'after') {
          $(this)[options.position](element);
        } else {
          $(options.position).append(element);
        }

        $(this).keyup(function() {
          $(this).trigger('auto-geocoder-onKeyUp');
        });

        this.map = new google.maps.Map(element[0], options.initial);
      });
    }],

    onKeyUp: [function(options) {
      this.bind('auto-geocoder-onKeyUp', function() {
        var self    = $(this);
        var address = $.trim(self.val());

        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        if (address == '') {
          self.trigger('auto-geocoder-onGeocodeResult', [[], '']);

          return;
        }

        this.timeout = setTimeout(function() {
          geocoder.geocode({ address: address }, function(results, status) {
            self.trigger('auto-geocoder-onGeocodeResult', [results, status]);
          });
        }, options.delay);
      })
    }],

    onGeocodeResponse: [function(options) {
      this.bind('auto-geocoder-onGeocodeResult', function(e, results, status) {
        if (status == google.maps.GeocoderStatus.OK &&
            status != google.maps.GeocoderStatus.ZERO_RESULTS) {
          this.map.set_zoom(options.success.zoom);
          this.map.set_center(results[0].geometry.location);

          this.marker = this.marker || new google.maps.Marker();
          this.marker.set_position(results[0].geometry.location);
          this.marker.set_map(this.map);

          $(this).trigger('auto-geocoder-onGeocodeSuccess', [results, status]);
        } else {
          if (this.marker) {
            this.marker.set_map(null);
            delete this.marker;
          }

          this.map.set_zoom(options.initial.zoom);
          this.map.set_center(options.initial.center);

          $(this).trigger('auto-geocoder-onGeocodeFailure', [results, status]);
        }
      });
    }],

    onGeocodeSuccess: [],
    onGeocodeFailure: []
  };

  $.fn.autoGeocoder.defaults = {
    position : 'after',
    delay    : 500,
    success  : {
      zoom : 14
    },
    initial  : {
      zoom           : 1,
      center         : [34, 0],
      draggable      : false,
      mapTypeId      : google.maps.MapTypeId.ROADMAP,
      mapTypeControl : false
    }
  };

  // From:
  // http://yehudakatz.com/2009/04/20/evented-programming-with-jquery/
  jQuery.fn.setupExtras = function(setup, options) {
    for (property in setup) {
      var self = this;

      if (setup[property] instanceof Array) {
        for (var i = 0; i < setup[property].length; i++) {
          setup[property][i].call(self, options);
        }
      } else {
        setup[property].call(self, options);
      }
    }
  };
})(jQuery);