var Metrics = require( 'metrics' ),
	postal = require( 'postal' ),
	commands = postal.channel( 'incomming' ),
	cluster = require( 'cluster' ),
	_ = require( 'lodash' ),
	Api = require( './api.js' ),
	os = require( 'os' ),
	report;

var createMetric = function( type, name ) {
	var metric = report.getMetric( name );
		if( !metric ) {
			metric = new Metrics[ type ]();
			report.addMetric( name, metric );
		}
		return metric;
	},
	apply = function( type, name, fun ) {
		fun( createMetric( type, name ) );
	},
	operations = {
		incr: function( counter, msg ) {
			counter.inc( msg.val );
		},
		decr: function( counter, msg ) {
			counter.dec( msg.val );
		},
		occ: function( meter, msg ) {
			meter.mark( msg.val );
		},
		dur: function( timer, msg ) {
			timer.update( msg.val );
		},
		hist: function( histogram, msg ) {
			histogram.update( msg.val, Date.now() );
		}
	};

commands.subscribe( '#', function( msg, env ) {
	var parts = env.topic.split( '.' ),
		type = parts[ 1 ],
		op = parts[ 0 ],
		name = msg.name,
		metric = createMetric( type, name );
	operations[ op ]( metric, msg );
} );

var MB = 1024 * 1024,
	GB = MB * 1024,
	total = os.totalmem(),
	TOTALMB = total / MB,
	TOTALGB = total / GB,
	memoryList = {},
	listen = function() {
		report = new Metrics.Report();
		cluster.on( 'online', function( worker ) {
			worker.on( 'message', function( data ) {
				// ensure this message is for us
				if ( !data.clustermetrics ) {
					return;
				}

				delete data.clustermetrics;

				if( data.type == 'report' ) {
					worker.send( { clustermetrics: true, type: 'report', report: report.summary() } );
				} else if ( data.type == 'memory' ) {
					memoryList[ worker.id ] = data.message;
				} else {
					commands.publish( data.type, data.message );
				}
			} );
		} );

		report.getMetrics = function( callback ) {
			var free = os.freemem(),
				used = total - free,
				processMemory = process.memoryUsage(),
				metrics = report.summary();
			memoryList[ 'host' ] = {
					rssGB: processMemory.rss / GB,
					heapTotalGB: processMemory.heapTotal / GB,
					heapUsedGB: processMemory.heapUsed / GB,
					rssMB: processMemory.rss / MB,
					heapTotalMB: processMemory.heapTotal / MB,
					heapUsedMB: processMemory.heapUsed / MB
				};

			metrics.memoryUtilization = {};
			_.each( _.values( memoryList ),
				function( subtotals ) {
					_.reduce( subtotals, function( result, num, key ) {
						result[ key ] = ( result[ key ] || 0 ) + num;
						return result;
					}, metrics.memoryUtilization );
				} );
			metrics.systemMemory = {
				availableGB: TOTALGB,
				inUseGB: used / GB,
				freeGB: free /GB,
				availableMB: TOTALMB,
				inUseMB: used / MB,
				freeMB: free / MB
			};
			metrics.loadAverage = os.loadavg();
			callback( metrics );
		}

		var send = function( type, message ) {
			commands.publish( type, message );
		};

		return _.merge( report, new Api( send ) );
};

module.exports = listen;
