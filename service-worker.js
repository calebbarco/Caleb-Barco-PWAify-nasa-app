const CACHE_NAME = 'space-explorer-v1';
const NASA_API_ORIGIN = 'https://science.nasa.gov';
const NASA_API_PATH = '/wp-json/wp/v2/apod-basic';
const APP_SHELL = [
	'./',
	'./index.html',
	'./manifest.json',
	'./style.css',
	'./js/dateRange.js',
	'./js/script.js',
	'./img/nasa-worm-logo.png',
	'./img/space-explorer-icon.svg'
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

// Fetch NASA data first, then use its cached response when the network is unavailable.
self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') {
		return;
	}

	const requestUrl = new URL(event.request.url);
	if (requestUrl.origin === NASA_API_ORIGIN && requestUrl.pathname === NASA_API_PATH) {
		event.respondWith((async () => {
			let response;
			try {
				response = await fetch(event.request);
			} catch (error) {
				const cachedResponse = await caches.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}
				throw error;
			}

			if (response.ok) {
				try {
					const cache = await caches.open(CACHE_NAME);
					await cache.put(event.request, response.clone());
				} catch (error) {
					console.error('Unable to cache NASA response:', error);
				}
			}

			return response;
		})());
		return;
	}

	if (requestUrl.origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		caches.match(event.request)
			.then(cachedResponse => cachedResponse || fetch(event.request))
	);
});