const puppeteer = require('puppeteer');
//go to hotel page to get offset page link
let firstUrl = 'https://www.booking.com/reviewlist.hr.html?aid=304142;label=gen173nr-1FCAEoggI46AdIM1gEaGWIAQGYARC4ARfIAQzYAQHoAQH4AQuIAgGoAgO4Av-JnOUFwAIB;sid=b449df7e7e0d13602044e191190ed921;cc1=hr;dist=1;pagename=inn-forty-two;srpvid=d718354aca3c02cf;type=total&;offset=0;'

let scrapeOffset = async (firstUrl) => {

  const getAllReviews = async url => {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitFor(1500);

    const reviewsFromPage = await page.evaluate(() => {
      let posts = [...document.getElementsByClassName('review_list_new_item_block')]
      let reviews = [];
      
      posts.forEach((post) => {
        let username = post.querySelector('.bui-avatar-block__title').innerText.trim();
        let country = post.querySelector('.bui-avatar-block__subtitle').innerText.trim();
        let score = post.querySelector('.bui-review-score__badge').innerText.trim();
        let comments = [...post.getElementsByClassName('c-review__body')].map(comment => comment.innerText.trim());

        if(comments.length > 1) {
          if(comments[0].endsWith('.')) {
            reviews.push({
              username,
              country,
              score,
              comment: comments.join(' ')
            });
          } else {
            reviews.push({
              username,
              country,
              score,
              comment: comments.join('. ')
            });
          }
        } else {
          reviews.push({
            username,
            country,
            score,
            comment: comments.pop()
          });
        }
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
      console.log(nextPageNumber); 
      const reviewLimit = 110; //change number of reviews limit
      if (nextPageNumber % reviewLimit == 0) {
        return reviewsFromPage;
      }
      
      const nextUrl = url.replace(/offset=(\d*)0;$/, `offset=${nextPageNumber};`);
      

      return reviewsFromPage.concat(await getAllReviews(nextUrl))
    }
    
  };

  let browser = await puppeteer.launch({headless: true});
  await browser.userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36');

  const allReviews = await getAllReviews(firstUrl)
  

  await browser.close();

  return allReviews;

}

scrapeOffset(firstUrl).then(reviews => {
  reviews.forEach(review => {
    console.log(`${review.username}, ${review.country}, ${review.score}, ${review.comment}`);
  });
});