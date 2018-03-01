const puppeteer = require('puppeteer');

// let result;

const getBySelector = (selector) => {
   return document.querySelector(selector).innerText;
};

const parseLinks = () => {
   let arr = document.getElementsByTagName('a');
   let links = Array.from(arr);
   return links.filter(link => {
      return link.href && (String(link.href).includes('.littleone.ru/showthread.php?t')) && !(String(link.href).includes('?t=209955&'));
   }).map(link => {
      return {text: link.innerText, link: link.href};
   });
};

const getPageCount = () => {
   let paginator = document.querySelector('.thread_pagination') || document.querySelector('.page .pagenav .vbmenu_control');
   if (paginator) {
      return +paginator.innerText.split('\u0009')[0].split('\u0020')[3];
   } else {
      return 1;
   }
};

const getThreadMessages = () => {
   let threadMessages = [];
   let posts = document.getElementById('posts');
   let postsText = posts.querySelectorAll('[id^="post_message_"]');
   let userNames = posts.querySelectorAll('.username,.bigusername');
   debugger;
   for (let msg = 0; msg < postsText.length; msg++) {
      if (userNames[msg] && postsText[msg]) {
         threadMessages.push({
            author: userNames[msg].innerText,
            text: postsText[msg].innerText
         });
      }
   }
   return threadMessages;
};


(async () => {
   const browser = await puppeteer.launch({headless: false});
   const page = await browser.newPage();
   let currentUrl = 'http://forum.littleone.ru/showthread.php?t=209955';
   let currentPage = 1;
   await page.goto(currentUrl + '&page=' + currentPage);

   let threads = [];
   //fixme: change to const
   let pagesCount = await page.evaluate(getPageCount);
   pagesCount = 3;
   for (let currentPage = 1; currentPage < pagesCount + 1; currentPage++) {
      console.log('goto: '+ currentUrl + '&page=' + currentPage);
      await page.goto(currentUrl + '&page=' + currentPage);
      threads = threads.concat(await page.evaluate(parseLinks));
   }

   //fixme: change to const
   let threadsCount = threads.length;
   threadsCount = 3;

   for (let i = 0; i < threadsCount; i++) {
      currentUrl = threads[i].link;
      console.log('goto: '+ currentUrl + '&page=' + 1);
      await page.goto(currentUrl + '&page=' + 1);
      pagesCount = await page.evaluate(getPageCount);
      console.log('getPageCount ' + pagesCount);
      if (pagesCount>3) {pagesCount=3;}
      let threadMessages = [];
      for (let currentPage = 1; currentPage < pagesCount + 1; currentPage++) {
         console.log('goto: '+ currentUrl + '&page=' + currentPage);
         await page.goto(currentUrl + '&page=' + currentPage);
         threadMessages = threadMessages.concat(await page.evaluate(getThreadMessages));
      }
      threads[i].threadMessages = threadMessages;
   }
   console.log(threads);


   // let threads = await page.evaluate(parseLinks);
   // for (let i = 0; i <2; i++) {
   //    await page.goto(threads[i].href);
   //    await page.evaluate(getThread);
   // }

   // let titleSelector = '.pagetitle .threadtitle';
   // const title = await page.evaluate(getBySelector, titleSelector);
   // console.log(title);
   await browser.close();
})();
