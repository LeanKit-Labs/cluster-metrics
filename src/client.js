var Api = require( './api.js' ),
	_ = require( 'lodash' );

var MB = 1024 * 1024,
	GB = MB * 1024,
	client = function() {
		var waiting = [],
			send = function( type, message ) {
				process.send(  { clustermetrics: true, type: type, message: message } ) ;
			};

		process.on( 'message', function( metrics ) {
			// ensure this message is for us
			if ( !metrics.clustermetrics ) {
				return;
			}

			delete metrics.clustermetrics;

			_.each( waiting, function( callback ) {
				callback( metrics.report );
			} );
			waiting = [];
		} );

		var api = new Api( send );
		api.getMetrics = function( callback ) {
			var inWaiting = waiting.length;
			waiting.push( callback );
			if( !inWaiting ) {
				send( 'report', '' );
			}
		}

		setInterval( function() {
			var processMemory = process.memoryUsage(),
				mem = {
					rssGB: processMemory.rss / GB,
					heapTotalGB: processMemory.heapTotal / GB,
					heapUsedGB: processMemory.heapUsed / GB,
					rssMB: processMemory.rss / MB,
					heapTotalMB: processMemory.heapTotal / MB,
					heapUsedMB: processMemory.heapUsed / MB
				};
			send( 'memory', mem );
		}, 1000 );

		return api;
};

module.exports = client;
