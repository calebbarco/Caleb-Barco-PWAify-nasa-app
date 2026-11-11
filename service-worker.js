const CACHE_NAME = 'space-explorer-v1';
const APP_SHELL = [
	'./',
	'./index.html',
	'./manifest.json',
	'./style.css',
	'./js/dateRange.js',
	'./js/script.js',
	'./img/nasa-worm-logo.png'
];

// Save the app shell so it can load without a network connection.
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(APP_SHELL))
			.then(() => self.skipWaiting())
	);
});

// Remove older app-shell caches when this worker takes control.
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter(cacheName => cacheName !== CACHE_NAME)
					.map(cacheName => caches.delete(cacheName))
			))
			.then(() => self.clients.claim())
	);
});

// Use cached local files first and leave external API requests alone.
self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		caches.match(event.request)
			.then(cachedResponse => cachedResponse || fetch(event.request))
	);
});