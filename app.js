const puppeteer = require('puppeteer');
const fs = require('fs'); //writing to txt file

//go to hotel page to get offset page link
const url = 'https://www.booking.com/reviewlist.en-gb.html?aid=304142;label=gen173nr-1FCAEoggI46AdIM1gEaGWIAQGYAQm4ARfIAQzYAQHoAQH4AQuIAgGoAgO4ArSfrOUFwAIB;sid=b449df7e7e0d13602044e191190ed921;cc1=hr;dist=1;pagename=europa-zagreb;srpvid=221d47ddf07d03a3;type=total&;offset=0;' //'offset=<number>;' has to be at the end of the link or else it won't work 

const hotelName = 'Hotel Europa'; //put hotel name here
const hotelRating = '3'; //put number of stars here
const hotelLocation = 'Zagreb'; //put hotel location here
const txtPath = './korpus.txt'; //change filename
const reviewLimit = 60; //change the number of reviews you want to get (* actually gets 2.5 times that amount, so keep that in mind)
const delimiter = '|'; //select your delimiter

let scrapeReviews = async (firstUrl, scrapingLimit) => {
  console.log('started scraping...')
  const getAllReviews = async url => {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitFor(1500);

    const reviewsFromPage = await page.evaluate(() => {
      let posts = [...document.getElementsByClassName('review_list_new_item_block')];
      let reviews = [];
      
      posts.forEach((post) => {
        let username = post.querySelector('.bui-avatar-block__title').innerText.trim();
        let country = post.querySelector('.bui-avatar-block__subtitle').innerText.trim();
        let score = post.querySelector('.bui-review-score__badge').innerText.trim();
        let comments = [...post.getElementsByClassName('c-review__body')].map(comment => comment.innerText.trim());

        if(username === undefined || username == '' || username === null) {
          username = '-'
        }

        if(country === undefined || country == '' || country === null) {
          country = '-'
        }

        if(score === undefined || score == '' || score === null) {
          score = '-'
        }

        if(comments[0] === undefined ||comments[0].trim() == '' || comments[0] === null) {
          comments[0] = '-'
        }

        if(comments[1] === undefined ||comments[1].trim() == '' || comments[1] === null) {
          comments[1] = '-'
        }

        reviews.push({
          username,
          country,
          score,
          positiveComment: comments[0],
          negativeComment: comments[1]
        })
      });

      return reviews; //end of reviewsFromPage
    });

    await page.close();

    //recursively scrape next page
    if (reviewsFromPage.length < 1) {
      //return if no reviews are on page
      return reviewsFromPage
    } else {
      //get next page
      const nextPageNumber = parseInt(url.match(/offset=(\d+);$/)[1], 10) + 10;
      //console.log(nextPageNumber);

      if (nextPageNumber % scrapingLimit == 0) {
        return reviewsFromPage;
      }
      
      const nextUrl = url.replace(/offset=(\d*)0;$/, `offset=${nextPageNumber};`);
      

      return reviewsFromPage.concat(await getAllReviews(nextUrl))
    }
    
  };

  let browser = await puppeteer.launch({headless: true});
  await browser.userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'); //google search "what's my user agent string" and paste here

  const allReviews = await getAllReviews(firstUrl)
  

  await browser.close();

  return allReviews;

}

scrapeReviews(url, reviewLimit).then(reviews => {  

  reviews.forEach(review => {

    fs.appendFile(txtPath, `${hotelName}${delimiter}${hotelLocation}${delimiter}${hotelRating}${delimiter}${review.username}${delimiter}${review.country}${delimiter}${review.score}${delimiter}${review.positiveComment}${delimiter}${review.negativeComment}\n`, (err) => {
      if (err) throw err;
    });
    //console.log(`${review.username}, ${review.country}, ${review.score}, ${review.positiveComment}, ${review.negativeComment}`);
  });

  console.log('done!')
});