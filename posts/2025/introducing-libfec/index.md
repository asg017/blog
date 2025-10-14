---
title: I'm working on libfec, a new FEC file parser and CLI tool
description: Parse federal campaign filings
created_at: 2025-10-13
build: make dist
share_photo_url: https://blog-static.alxg.xyz/Screenshot%202025-10-13%20at%2010.22.10%20PM.png
---

<script type="module" src="./index.js"></script>

<svg id="hero"></svg>
<style>
  :root {
  --svg-bg: var(--ctp-crust);
  --hero-c1: var(--ctp-flamingo);
  --hero-c2: var(--ctp-pink);
  --hero-c3: var(--ctp-mauve);
  --hero-c4: var(--ctp-red);
  --hero-c5: var(--ctp-maroon);
  --hero-c6: var(--ctp-peach);
  --hero-c7: var(--ctp-yellow);
  --hero-c8: var(--ctp-green);
  --hero-c9: var(--ctp-teal);
  --hero-c10: var(--ctp-sky);
  --hero-c11: var(--ctp-sapphire);
  --hero-c12: var(--ctp-blue);
  --hero-c13: var(--ctp-lavender);
}
</style>

<div class="summary">

> *tl;dr — [`libfec`](https://github.com/asg017/libfec) is a new tool for working with Federal Election Committee (FEC) data, for exploring and analyzing federal campaign finance reports. It's reminiscent of past tools like [FastFEC](https://github.com/washingtonpost/FastFEC) and  [fecfile](https://github.com/esonderegger/fecfile), but is faster, supports exporting to CSV/JSON/ SQLite/Excel, and works directly with the [OpenFEC API](https://api.open.fec.gov/developers/) to simplify common operations. Try it today!*

<style>
  .summary blockquote {
    font-weight: 500;
  }
</style>
</div>

---

Building a tool for working with FEC data is a rite of passage for data journalists and newsroom engineers.

The earliest open-source FEC parser I could find is
[FEC-Scraper](https://github.com/cschnaars/FEC-Scraper),
created 14 years ago — a collection of Python scripts published by journalists at USA Today. Then a year later 
[Fech](https://github.com/nytimes/Fech)
(Ruby) from the New York Times, followed by 
[fec-parse](https://github.com/PublicI/fec-parse)
(Node.js) in 2015, 
[fecfile](https://github.com/esonderegger/fecfile)
(Python) in 2018, and 
[FastFEC](https://github.com/washingtonpost/FastFEC)
(C) from the Washington Post in 2021.


All these tools perform a similar task — converting the FEC's 
[custom `.fec` file format](https://www.fec.gov/introduction-campaign-finance/data-tutorials/)
into more usable formats like CSV or JSON. 

And `libfec` is no different! It's fast, easy to install, and works directly with the [OpenFEC API](https://api.open.fec.gov/developers/) to make your life easier.



## Introducing `libfec` 

`libfec` is a single-binary CLI tool written in Rust, with [a variety of ways to install](https://alexgarcia.xyz/libfec/installation). 

The `libfec export` command allows you to export filing itemizations to CSVs/JSON/SQLite/Excel for easier analysis. Let's try it with [`FEC-1903265`](https://docquery.fec.gov/cgi-bin/forms/C00765164/1903265), the 2025 Q2 financial report for Alex Padilla, senator from California. To export the receipt itemizations from that filing, we can run:


```bash
libfec export \
  --target receipts \
  FEC-1903265 \
  -o padilla_contributors-2025-Q2.csv
```


Behind the scenes, `libfec` will download and cache the [raw `1903265.fec` file](https://docquery.fec.gov/dcdev/posted/1781583.fec) for this filing, and export all receipt itemizations (contributions, incoming transfers) into a CSV file at `padilla_contributors-2025-Q2.csv`. 

Now we can use other tools for further analysis. For example, let's get all individual contributors from California who donated to Alex Padilla in this reporting period, using [`csvkit`](https://csvkit.readthedocs.io/en/latest/):

```bash
csvgrep padilla_contributors-2025-Q2.csv -c entity_type -m IND \
  | csvgrep -c contributor_state -m CA \
  | csvcut -c contributor_first_name,contributor_last_name,contributor_city,contribution_amount \
  | head -10
```
```
contributor_first_name,contributor_last_name,contributor_city,contribution_amount
David,Alexander,Carlsbad,2000.00
Jan,Altemus,Los Angeles,250.00
L Sue,Alza,Los Angeles,250.00
Cynthia,Amador Diaz,Monrovia,50.00
Gilberto,Amparo,Northridge,250.00
John H,Anderson,San Diego,20.00
John H,Anderson,San Diego,20.00
John H,Anderson,San Diego,20.00
Olle,Andersson,Carlsbad,25.00
```

Or you can use Python, R, Node.js, DuckDB, Excel — any tool that works with CSVs!

Another example: [this Politico article from Jessica Piper](https://www.politico.com/news/2023/01/25/george-santos-199-expenses-00079334) (January 2023) details how George Santos, former New York Congressman, reported 40 expenditure transactions that were valued between $199.00 and $199.99. Campaigns are required to keep receipts for expenses greater than $200, so having multiple expenditures *right below* the cutoff is a bit suspicous.

To get a list of all expenditures reported by George Santos' campaign committee [`C00721365`](https://www.fec.gov/data/committee/C00721365/?cycle=2022) in 2022, we could run:


```bash
$ libfec export C00721365 \
  --target disbursements \
  --cycle 2022 \
   -o santos22.csv
✓ Cached 15 filings, 1.04 MiB
Exported 1558 rows to santos22.csv in 1s 977ms 586µs
```

Now `santos22.csv` contains all Schedule B disbursements from all FEC reports filed by the Santos campaign! Including the 40 suspicous transactions, which we can confirm with a DuckDB query:

```bash
$ duckdb :memory: 'SELECT count(*) FROM "santos22.csv" WHERE expenditure_amount BETWEEN 199.0 AND 199.99'
```

<pre>
┌──────────────┐
│ count_star() │
│    int64     │
├──────────────┤
│      40      │
└──────────────┘
</pre>

## `libfec` on commitees & contests

Look at the above example a little closer — all we provided was a committee ID for Santos (`libfec export C00721365 ...`). With just the committee ID, `libfec` was able to resolve the 15 relevant filings that `C00721365` filed for the 2022 cycle, even accounting for amended filings.

This is powerful! Previous open-source FEC tooling required you to supply individual FEC filing IDs, which often meant searching up a committee's filing history, copy+pasting FEC IDs, and manually accounting for amended filings. With `libfec`, it's handled for you!

Let's try another sample. I'm tracking the near-to-me 2026 California 40th district, where incumbent Young Kim is runnings to hold onto her seat. If I want to get filings for all candidates running in that race, I can run:

```bash
$ libfec export \
  --election 2026 \
  CA40 \
  -o ca40-2026.db
Exporting filings to SQLite database at "ca40-2026.db"
Finished exporting 18 filings into ca40-2026.db, in 3 seconds
```

`libfec` found all the candidates running in CA40 and exported their filinings into a SQLite database at `ca40-2026.db`. 


## SQLite as a first-class target

`libfec` was built with SQLite in mind, for many reasons!

For one, FEC filings are not just 1 clean CSV file. A single "filing" can have multiple tabular datasets. A "receipt" itemization has columns like `contributor_first_name` and `contribution_amount`, while a "disbursement" itemization has columns like `payee_first_name` and `expenditure_amount`. 

With SQLite, `libfec` stores these different itemization types into different tables, meaning we can store all itemizations from multiple filings all in a single database file.

Also with SQLite, you can write SQL! Let's find the top 10 cities where individuals contributed to any candidate from the CA40 race:

```sql
select 
  contributor_state, 
  contributor_city, 
  sum(contribution_amount)
from libfec_schedule_a
where form_type = 'SA11AI'
  and entity_type = 'IND'
group by 1, 2
order by 3 desc
limit 10;
```

```
contributor_state    contributor_city      sum(contribution_amount)
-------------------  ------------------  --------------------------
CA                   Los Angeles                           233757
NY                   New York                              111062
DC                   Washington                             79642.7
CA                   Beverly Hills                          64100
CA                   San Francisco                          52590.4
MN                   Minneapolis                            35657.3
TX                   Dallas                                 33362.7
TX                   Houston                                31549.2
CA                   Santa Monica                           29218.5
NY                   Manhattan                              28000
```
 
I was not expecting so many non-California cities...

Now let's find which candidate raised the most from small individual donors compared to large donors:

```sql
select
  committee_name,
  format(
    '%f%%', 
    100.0 * col_a_individual_contributions_unitemized / 
      (
        col_a_individual_contributions_itemized 
        + col_a_individual_contributions_unitemized
      )
  ) as percent_small_donor_raised,
  format('$%,.2f', col_a_cash_on_hand_close) as cash_on_hand_close
from libfec_F3
where report_code = 'Q2'
order by 2 desc
```

```
committee_name                  percent_small_donor_raised    cash_on_hand_close
------------------------------  ----------------------------  --------------------
Esther Kim Varet for Congress   62.068472%                    $1,308,999.98
Young Kim for Congress          39.489178%                    $3,938,779.72
Christina Gagnier for Congress  34.705837%                    $306,572.33
Joe Kerr for California         29.493767%                    $11,838.09
NINA LINH FOR CONGRESS          1.394278%                     $104,300.06
```

And finally, SQLite is great because every programming language already has a great client library for SQLite! 
Python has the [`sqlite3` module](https://docs.python.org/3/library/sqlite3.html),
Node.js now has the builtin [`node:sqlite3`](https://nodejs.org/api/sqlite.html) module,
[RSQLite](https://cran.r-project.org/web/packages/RSQLite/vignettes/RSQLite.html) for R users, [`sqlite3-ruby`](https://github.com/sparklemotion/sqlite3-ruby) for Ruby, even [SQLite WASM](https://sqlite.org/wasm/doc/trunk/index.md) for in-browser options! 

This means that even if you personally use Python but your coworkers likes R, you can use `libfec` as a lingua franca to work together: `libfec export` to a SQLite database, write SQL to analyze, then whatever language you like for your own visualizations or analysis work.


## `libfec` is *fast*

The previous fastest FEC parsing tool was [FastFEC](https://github.com/washingtonpost/FastFEC/) from the Washington Post. While `libfec` and FastFEC do different things, there is a [FastFEC compatible `libfec fastfec`](https://alexgarcia.xyz/libfec/guides/fastfec) command that runs ~1.8x to ~10x faster than FastFEC, depending on the FastFEC installation.

The `libfec export` command is fast too! It can parse [`FEC-1909062`](https://docquery.fec.gov/cgi-bin/forms/C00401224/1909062/), the `10GB` Mid-Year 2025 report for ActBlue, in ~30 seconds:

```bash
libfec export 1909062.fec \
  --target receipts \
  -o ab-2025-h1.csv
```

On my machine (2024 MacBook Pro M4 Pro) this takes 31 seconds, exporting a `5.8 GB` CSV with 25 million rows!

`libfec` also caches filing files by default, so subsequent exports on the same filings will be even faster. See [The `libfec` Cache](https://alexgarcia.xyz/libfec/guides/cache.html) for more details.

## A big thanks

Federal campaign finance data is extremely complex and not well documented. `libfec` would not be possible for the countless newsroom developers and volunteers who contributed to dozens of open source projects and resources. I am grateful to all who have contributed to these initiatives, and also to these specific folks in no particular order:


- [Chris Zubak-Skees](https://zubak-skees.dev/), creator of `fec-parser`, advisor on the FastFEC project
- [Dylan Freedman](https://github.com/freedmand), creator of the FastFEC project
- [Evan Sonderegger](https://github.com/esonderegger), creator of the fecfile project, maintains the most up-to-fec FEC version mappings
- [Derek Willis](https://github.com/dwillis), creator of the Fech project
- [Rachel Shorey](https://github.com/rshorey), creator oof the fec2json project

And *many* other contributors, maintainers, and other journalist who have put in countless hours digging into the weird intricacies and nuances of federal campaign finance. 


## I need help finishing `libfec`!

I've been working on `libfec` for a long time, but it's nowhere near complete! For example:

- Only FEC filings version `8.1+` are supported, so only filings from the last ~10 years years are supported. See [issue #1](https://github.com/asg017/libfec/issues/1) for more info.
- I want to add bindings for other programming languages (Python, WASM, Node.js, Ruby, etc).
- A "watch" feature that can automically sync newly filed reports, using the FEC RSS feeds or APIs

But most importantly, I need people to use it! If you currently use other FEC parsers, give `libfec` a try and let me know how it goes!

A rough roadmap of what I'm planning for the near future:

- Support for all FEC versions ([#1](https://github.com/asg017/libfec/issues/1))
- Python + WASM support
- *Extensive* examples, recipes, and story re-creations

Want to get involved? Drop a post [in the `libfec` forum on GitHub](https://github.com/asg017/libfec/discussions), tell us how you want to use `libfec`, and try it out today!