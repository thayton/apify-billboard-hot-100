// main.js
const Apify = require('apify');
const tools = require('./src/tools');
const {
    utils: { log },
} = Apify;

log.setLevel(log.LEVELS.DEBUG);
log.setOptions({
    logger: new log.LoggerText({ skipTime: false }),
});

const SINGULAR_MAX_CONCURRENCY = 1;
const PARALLEL_MAX_CONCURRENCY = 5;

Apify.main(async () => {
    log.info('Starting actor.');

    const input = await Apify.getInput();    
    const weeks = await tools.getWeeks(input.years);
    const numWeeks = weeks.length; /* save length before openRequestList consumes weeks */

    const proxyConfiguration = await Apify.createProxyConfiguration(input.proxyConfiguration);
    const requestList = await Apify.openRequestList('weeks', weeks);
    const requestQueue = await Apify.openRequestQueue();
    const router = tools.createRouter({ requestQueue });

    log.debug('Setting up crawler.');

    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        maxRequestRetries: 1,
        maxRequestsPerCrawl: weeks.length + 1,
        maxConcurrency: proxyConfiguration === undefined ? SINGULAR_MAX_CONCURRENCY : PARALLEL_MAX_CONCURRENCY,
        handlePageFunction: async context => {
            const { request } = context;

            if (proxyConfiguration === undefined) {
                /* 
                 * If we are not using proxies there is a much higher chance of getting
                 * blocked if there's no delay between requests. In this case we make
                 * two changes:
                 *
                 * 1) We perform only one request at a time (no concurrency)
                 *
                 * 2) We put a random delay between each request to avoid getting blocked
                 *    with an HTTP 429 status code from their server or being presented
                 *    with a CAPTCHA
                 */
                await tools.randomDelay();
            }
            
            log.info(`Processing ${request.url}`);
            await router(request.userData.label, context);
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});
