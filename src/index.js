var cluster = require( 'cluster' ),
	client = require( './client.js' ),
	server = require( './server.js' );

if( cluster.isMaster ) {
	module.exports = server();
} else {
	module.exports = client();
}