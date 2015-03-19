var cluster = require( 'cluster' ),
	metrics = require( '../src/index.js' );

if( cluster.isMaster ) {
	setTimeout( function() {
		metrics.getMetrics( function( summary ) {
			console.log( JSON.stringify(summary, null, 2) );
		} );
		process.exit();
	}, 5000 );
	setInterval( function() {
		metrics.meter( 'test.meter' ).record( 2 );
	}, 100 );
	cluster.fork();
	cluster.fork();
} else {
	setInterval( function() {
		metrics.timer( 'test.timer' ).record();
		metrics.counter( 'test.count' ).incr();
		metrics.histogram( 'test.hist' ).record( 5 );
		metrics.timer( 'test.timer' ).start();
	} , 100 );
}
