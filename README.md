# cluster-metrics
It's fun to put 'cluster' in front of things. It's also fun when you can aggregate all your metrics in a cluster into a single metrics report.

This lib provides a uniform api between workers and a main process within a Node cluster for collecting metrics. Collection is done via the [metrics lib in use at Yammer](https://github.com/mikejihbe/metrics), a clone of Coda's Java Metrics library.

Fwiw - you may not WANT this behavior, in which case, simply use the metrics lib. For our purposes, we don't care about knowing metrics PER worker and aggregating after the fact seemed like a chore.

## Use
No matter if you're on master or a worker, simply require it and go:
```javascript
var metrics = require( 'cluster-metrics' );
```

## API
The API for this lib is a bit different from the underlying metrics lib, so you'll want to actually look all of this over.

Each type of metric must be created before use. Once you've created one, you can access it by name like a property. You can also continue to just use the same call; not to worry, this will just use the existing metric previously created, nothing gets lost.

```javascript
	// creates a meter named 'test.timer' and records 1 event
	metrics.meter( 'test.timer' ).record(); // defaults to 1
	// record more events for the meter
	metrics[ 'test.timer' ].record( 3 );

	// creates a counter named 'test.count' and increments it by 1
	metrics.counter( 'test.count' ).incr(); // defaults to 1
	// decrements 'test.count' by 1
	metrics[ 'test.count' ].decr();

	// creates a histogram and records 5 events
	metrics.histogram( 'test.hist' ).record( 5 );

	// if you're already recording durations you can simply do this:
	metrics.timer( 'test.timer' ).record( duration );

	// if you'd like, this will record durations between calls to a specific
	// timer in seconds
	metrics.timer( 'test.timer' ).start();

	// a bunch of stuff happens here

	metrics.timer( 'test.timer' ).record(); // records the time elapsed since last start
```