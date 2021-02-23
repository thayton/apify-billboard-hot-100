// main.js
const Apify = require('apify');
const tools = require('./src/tools');
const {
    utils: { log },
} = Apify;

const NUM_WEEKS_IN_YEAR = 52;
const MIN_DELAY_BETWEEN_REQS = 1;
const MAX_DELAY_BETWEEN_REQS = 8;
const MS_PER_SEC = 1000;

log.setLevel(log.LEVELS.DEBUG);
log.setOptions({
    logger: new log.LoggerText({ skipTime: false }),
});

const getRandomWait = () => {
    const delta = MAX_DELAY_BETWEEN_REQS - MIN_DELAY_BETWEEN_REQS;
    const nSecs = (Math.random() * delta) + MIN_DELAY_BETWEEN_REQS;

    return Math.floor(nSecs) * MS_PER_SEC;
};

const randomDelay = async () => {
    const mSec = getRandomWait();
    log.debug(`Delaying ${mSec/1000} seconds`);
    await new Promise(r => setTimeout(r, mSec));
};

Apify.main(async () => {
    log.info('Starting actor.');

    const requestList = await Apify.openRequestList('weeks', await tools.getSources());
    const requestQueue = await Apify.openRequestQueue();
    const router = tools.createRouter({ requestQueue });

    log.debug('Setting up crawler.');
    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        maxRequestRetries: 1,
        maxRequestsPerCrawl: NUM_WEEKS_IN_YEAR + 1,
        maxConcurrency: 1,
        handlePageFunction: async context => {
            const { request } = context;

            /* 
             * Put a random delay between requests or else
             * we get an HTTP 429 status code from their
             * server
             */
            await randomDelay();
            
            log.info(`Processing ${request.url}`);
            await router(request.userData.label, context);
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});
