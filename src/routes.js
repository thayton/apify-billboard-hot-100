// routes.js
const Apify = require('apify');
const path = require('path');
const {
    utils: { log },
} = Apify;

/*
 * Collect the top 100 songs for the week
 */
exports.DETAIL = async ({ $, request }) => {
    const chart = {
        week: path.basename(request.loadedUrl),
        songs: []
    };
    
    const classes = {
        'chart-element__rank__number': 'rank',
        'chart-element__information__artist': 'artist',
        'chart-element__information__song': 'song'
    };

    $('ol.chart-list__elements > li').each((i,li) => {
        const song = {};
        
        for (const [k, v] of Object.entries(classes)) {
            song[v] = $(li).find(`span.${k}`).text();
        }

        chart.songs.push(song);
    });    

    await Apify.pushData(chart);
};
