var cluster = require( 'cluster' ),
	moment = require( 'moment' ),
	_ = require( 'lodash' );


var Api = function( send ) {
	var cache = {},
		Counter = function( name ) {
			return {
				incr: function( val ) {
					send( 'incr.Counter', { name: name, val: val || 1 } );
				},
				decr: function( val ) {
					send( 'decr.Counter', { name: name, val: val || 1 } );
				}
			}
		},
		Histogram = function( name ) {
			return {
				record: function( val ) {
					send( 'hist.Histogram', { name: name, val: val || 1 } );
				}
			};
		},
		Meter = function( name ) {
			return {
				record: function( val ) {
					send( 'occ.Meter', { name: name, val: val || 1 } );
				}
			}
		},
		Timer = function( name ) {
			this.last = 0;
			this.name = name;
			_.bindAll( this );
		};

	Timer.prototype.start = function() {
		this.last = Date.now();
	};

	Timer.prototype.record = function( val ) {
		if( !val && this.last ) {
			val = Date.now() - this.last;
		}
		if( val ) {
			send( 'dur.Timer', { name: this.name, val: val } );
		}
	};

	var factory = function( Type ) {
		return function( name ) {
			if( !cache[ name ] ) {
				cache[ name ] = new Type( name );	
			}
			return cache[ name ];
		}
	};

	return {
		counter: factory( Counter ),
		histogram: factory( Histogram ),
		meter: factory( Meter ),
		timer: factory( Timer )
	}
};

module.exports = Api;