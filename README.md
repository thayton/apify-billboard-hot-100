## Billboard Hot 100 Scraper

Billboard Hot 100 Scraper is an Apify actor for scraping the Billboard Hot 100 weekly charts for a
specific year (or list of years). It is build on top of [Apify SDK](https://sdk.apify.com/) and you
can run it both on Apify [platform](https://my.apify.com/) and locally.

- [Input](#input)
- [Output](#output)
- [Running](#running)

### Input

If running the actor locally, then the input can be specified in the file:

    apify_storage/key_value_stores/default/INPUT.json

The input allows the following fields to be set:


| Field | Type | Description |
| ----- | ---- | ----------- |
| years | array | A list of years for the Actor to scrape.
| proxyConfiguration | object | (optional) Proxy settings of the run. If you have access to Apify proxy, leave the default settings. If not, you can set `{ "useApifyProxy": false" }` to disable proxy usage |

** Note on the proxy configuration **

If you do not have proxies enabled, then the Actor will only send one request at a time with a random
delay of between 1 and 8 seconds between requests. This is to help prevent the scraper from being blocked.

INPUT Example:

```
{
    "years": [ 1980, 1984 ],
    "proxyConfiguration": {
        "useApifyProxy": false
    }
}
```

### Output

Output is stored in a dataset. If you run the actor locally, then the results will be a set of JSON files under 
the directory `apify_storage/datasets/default/`, one file for each week of the year being scraped. Each file 
contains the top 100 hits for a particular week of the year that was scraped:

Example for the week of [3/2/1980-3/8/1980](https://www.billboard.com/charts/hot-100/1980-03-08):

```
{
{
  "week": "1980-03-08",
  "songs": [
    {
      "rank": "1",
      "artist": "Queen",
      "song": "Crazy Little Thing Called Love"
    },
    {
      "rank": "2",
      "artist": "Teri DeSario With K.C.",
      "song": "Yes, I'm Ready"
    },
    ...
   {
      "rank": "99",
      "artist": "Styx",
      "song": "Why Me"
    },
    {
      "rank": "100",
      "artist": "Tavares",
      "song": "Bad Times"
    }
  ]
}
```

### Running

After setting the years to scrape and the proxy configuration in INPUT.json, you can run the actor locally 
using the [Apify CLI](https://docs.apify.com/cli) by running the following command:

    $ apify run -p