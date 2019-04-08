# puppeteer-scraping
Node.js scraper for booking.com reviews of hotels in Zagreb

How to use:
- go to booking.com
- enter the name of the city you want to scrape from
- choose your hotel
- click on the "Guest reviews" button (<a href="#blockdisplay4" ...>)
- open review pagination link in new page (middle mouse click on number 2 for example [<li class="bui-pagination__item" ...>])
- copy link from browser address bar (the link should look like "<beginning of the link>offset=<number [preferably 0]>;")
- paste it into the script
- run the script :) 

Known bugs:
- for some reason it will get 2.5 times more reviews than you set in the limit (for example, instead of 100 it gets 250)
