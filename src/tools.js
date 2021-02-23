// tools.js
const Apify = require('apify');
const routes = require('./routes');
const {
    utils: { log },
} = Apify;

const _ = require("underscore");
const SATURDAY = 6;
const MONTHS_IN_YEAR = 12;

/*
 * Return a list of Date objects for each day of the month
 * in a given year. The monthIndex assume the twelve months 
 * in a year are indexed from 0 to 11.
 */
const getDatesInMonth = (year, monthIndex) => {
    const numDaysInMonth = (new Date(year, monthIndex + 1, 0)).getDate();
    let datesInMonth = [];
    
    for (let i = 1; i <= numDaysInMonth; i++) {
        datesInMonth.push(
            new Date(year, monthIndex, i)
        );
    }

    return datesInMonth;
};

/*
 * Return a day-of-week list for a given month and year. For example,
 * to return a list of Saturdays in January, 1983:
 *
 *   getDaysOfWeekInMonth(1983, 0, 6)
 *
 * The twelve months in a year are indexed from 0 to 11. The dayOfWeek 
 * is a number in the range of [0..6] that represents [Sunday..Saturday]
 */
const getDaysOfWeekInMonth = (year, monthIndex, dayOfWeek) => {
    let datesInMonth = getDatesInMonth(year, monthIndex);
    let daysOfWeek = datesInMonth.filter(d => d.getDay() == dayOfWeek);
    return daysOfWeek;
};

/*
 * Billboard Hot 100 identifies the weeks in a month by the last Saturday 
 * in each week (Sun-Sat). So, if you wanted to see hot 100 list for the 
 * week of 12/7/1980 - 12/13/1980:
 *
 *        December 1980
 *     Su Mo Tu We Th Fr Sa
 *         1  2  3  4  5  6
 *      7  8  9 10 11 12 13
 *     14 15 16 17 18 19 20
 *     21 22 23 24 25 26 27
 *     28 29 30 31
 *
 * you'd reference the URL at 
 *
 *    https://www.billboard.com/charts/hot-100/1980-12-13
 *
 * because 12/13/1980 is date of the Saturday ending that week.
 *
 * This function returns a list of such Saturdays for each week in 
 * the given month of the specified year formatted the same way 
 * Billboard does in their URLs.
 *
 * For example, given the month of January in the year 1983:
 *
 *        January 1983
 *    Su Mo Tu We Th Fr Sa
 *                       1
 *     2  3  4  5  6  7  8
 *     9 10 11 12 13 14 15
 *    16 17 18 19 20 21 22
 *    23 24 25 26 27 28 29
 *    30 31
 *
 * We would return 
 *
 *   [ 1983-01-01 1983-01-08, 1983-01-15, 1983-01-22, 1983-01-29 ]
 *
 * Because the last week rolls over into February it's not included.
 */
const getWeeksInMonth = (year, monthIndex) => {
    let saturdays = getDaysOfWeekInMonth(year, monthIndex, SATURDAY);
    
    saturdays = saturdays.map(s => [
        s.getFullYear(),
        ('0' + (s.getMonth() + 1)).slice(-2),
        ('0' + (s.getDate()     )).slice(-2)
    ].join('-'));

    return saturdays;
};

/*
 * Return a list of weeks in the given year. The weeks are
 * identified by the date of the Saturday at the end of each
 * week (Sun-Sat) as this is how Billboard identifies weeks.
 */
const getWeeksInYear = (year) => {
    let weeks = [];

    for (let i = 0; i < MONTHS_IN_YEAR; i++) {
        weeks = weeks.concat(getWeeksInMonth(year, i));
    }

    return weeks;
};

/*
 * Generate a list of URLs for each week of the year for
 * every year specified in INPUT
 */
exports.getSources = async () => {
    const input = await Apify.getInput();
    log.debug(`input: (${input.length} years) ${input}`);
    
    let sources = [];
    
    for (const year of input) {
        let weeks = getWeeksInYear(year);
        weeks = _.shuffle(weeks);

        sources = sources.concat(
            weeks.map(w => ({
                url: `https://www.billboard.com/charts/hot-100/${w}`,
                userData: {
                    label: 'DETAIL',
                },
            })
        ));
    }

    log.debug(`Returning ${sources.length} URLs`);
    return sources;
};

// globalContext = requestQueue
exports.createRouter = globalContext => {
    /*
     * routeName = CATEGORY,DETAIL
     * requestContext = request object { Request, AutoScaledPool, ... }
     */
    return async function(routeName, requestContext) {
        const route = routes[routeName];
        if (!route) throw new Error(`No route for name: ${routeName}`);
        log.debug(`Invoking route: ${routeName}`);
        return route(requestContext, globalContext);
    };
};
