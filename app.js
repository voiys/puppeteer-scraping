const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://www.booking.com/searchresults.hr.html?aid=356980&label=gog235jc-1DCAMoZTjkA0gQWANoZYgBAZgBELgBF8gBDNgBA-gBAfgBAogCAagCA7gCvtWY5QXAAgE&sid=b449df7e7e0d13602044e191190ed921&tmpl=searchresults&city=-101579&class_interval=1&dest_id=-101579&dest_type=city&dtdisc=0&from_sf=1&group_adults=2&group_children=0&inac=0&index_postcard=0&label_click=undef&nflt=ht_id%3D204%3Bclass%3D3%3B&no_rooms=1&offset=0&percent_htype_hotel=1&postcard=0&raw_dest_type=city&room1=A%2CA&sb_price_type=total&shw_aparth=0&slp_r_match=0&src=city&srpvid=120170fa83d900e0&ss=Zagreb&ss_all=0&ssb=empty&sshis=0&ssne=Zagreb&ssne_untouched=Zagreb';

//get hotel links from url
let scrapeLinks = async (page_url) => {

  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();

  await page.goto(page_url);

  await page.waitForSelector('.sr-hotel__title a');

  let links = await page.$$eval('.sr-hotel__title a', (nodeList) => {
    let link_array = [];

    for (let link of nodeList) {
      link_array.push(link['href']);
    }

    return link_array;
  });

  await browser.close();

  return links
}

//getting reviews from offset pagea
let scrapeReviewsOffset = async (hotel_url) => {
  let browser = await puppeteer.launch({headless: true});
  let page = await browser.newPage();

  await page.goto(hotel_url);

  await page.waitFor(1500);

  const reviews = await page.evaluate(() => {
    let posts = [...document.getElementsByClassName('review_list_new_item_block')]
    let allReviews = [];
    
    posts.forEach((post) => {
      let username = post.querySelector('.bui-avatar-block__title').innerText;
      let country = post.querySelector('.bui-avatar-block__subtitle').innerText;
      let score = post.querySelector('.bui-review-score__badge').innerText;
      let comments = [...post.getElementsByClassName('c-review__body')].map(comment => comment.innerText.trim());

      if(comments.length > 1) {
        if(comments[0].endsWith('.')) {
          allReviews.push({
            username,
            country,
            score,
            comment: comments.join(' ')
          });
        } else {
          allReviews.push({
            username,
            country,
            score,
            comment: comments.join('. ')
          });
        }
      } else {
        allReviews.push({
          username,
          country,
          score,
          comment: comments.pop()
        });
      }
    });

    return allReviews;
  });

  await browser.close();

  return reviews;

}

//scrape reviews from each page
let scrapeReviews = async (hotel_url) => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();

  await page.goto(hotel_url);

  await page.waitForSelector('#hp_hotel_name');
  await page.waitForSelector('#show_reviews_tab');

  let hotel_name = await page.evaluate(() => document.querySelector('#hp_hotel_name').innerText.trim());

  await page.click('#show_reviews_tab');

  await page.waitFor(2000);

  const reviews = await page.evaluate(() => {
    
    let review_array = [];
    
    let posts = document.querySelectorAll('div[itemprop="review"]');

    posts.forEach((post) => {
      let score = post.querySelector('.bui-review-score__badge').innerText;
      let username = post.querySelector('.bui-avatar-block__title').innerText;
      let country = post.querySelector('.bui-avatar-block__subtitle').innerText;
      let comment = post.querySelector('.c-review-block__title').innerText;
      
      review_array.push(
        {
          username,
          country,
          score,
          comment
        }
      );
    });

    return review_array;
  });

  await browser.close();

  return {
    hotel_name,
    reviews
  }

}

scrapeReviews('https://www.booking.com/hotel/hr/central.hr.html?aid=356980;label=gog235jc-1DCAMoZTjkA0gQWANoZYgBAZgBELgBF8gBDNgBA-gBAfgBAogCAagCA7gCvtWY5QXAAgE;sid=b449df7e7e0d13602044e191190ed921;dest_id=-101579;dest_type=city;dist=0;group_adults=2;hapos=1;hpos=1;nflt=ht_id%3D204%3Bclass%3D3%3B;room1=A%2CA;sb_price_type=total;sr_order=popularity;srepoch=1554393846;srpvid=120170fb6b7c0292;type=total;ucfs=1&#tab-main').then((hotel_info) => {
  reviews = hotel_info['reviews'];
  console.log(hotel_info['hotel_name'])
  reviews.forEach((review) => console.log(`${review.username}, ${review.country}, ${review.score}, ${review.comment}.`))
}); //ovo jos dovrsi da se pise u file

// scrapeLinks(url).then( (links) => {
//   const write_stream = fs.createWriteStream('./links.txt');

//   for(let link of links) {
//     write_stream.write(`${link}\n`);
//   }

//   write_stream.close()
// });

