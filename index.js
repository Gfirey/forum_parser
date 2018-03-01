const puppeteer = require('puppeteer');


const parseLinks = () => {
   let arr = document.getElementsByTagName('a');
   let links = Array.from(arr);
   return links.filter(link => {
      return link.href && (String(link.href).includes('.littleone.ru/showthread.php?t')) && !(String(link.href).includes('?t=209955'));
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
   let threadMessages = '';
   let posts = document.getElementById('posts');
   if (posts) {
      let postsText = posts.querySelectorAll('[id^="post_message_"]');
      let userNames = posts.querySelectorAll('.username,.bigusername');
      for (let msg = 0; msg < postsText.length; msg++) {
         if (userNames[msg] && postsText[msg]) {
            threadMessages += '\n' + userNames[msg].innerText + ': ' + postsText[msg].innerText + '\n';
         }
      }
   }
   return threadMessages;
};

const getAuthor = () => {
   let posts = document.getElementById('posts');
   return posts ? posts.querySelector('.username,.bigusername').innerText : '';
};


(async () => {
   const browser = await puppeteer.launch({headless: false});
   const page = await browser.newPage();
   let currentUrl = 'http://forum.littleone.ru/showthread.php?t=209955';
   let currentPage = 1;
   await page.goto(currentUrl + '&page=' + currentPage);

   let threads = [];
   let pagesCount = await page.evaluate(getPageCount);
   for (let currentPage = 1; currentPage < pagesCount + 1; currentPage++) {
      await page.goto(currentUrl + '&page=' + currentPage);
      threads = threads.concat(await page.evaluate(parseLinks));
   }

   const threadsCount = threads.length;
   for (let i = 0; i < threadsCount; i++) {
      let threadMessages = '';
      currentUrl = threads[i].link;
      currentPage = 1;
      await page.goto(currentUrl + '&page=' + currentPage);
      pagesCount = await page.evaluate(getPageCount);
      threads[i].author = await page.evaluate(getAuthor);
      do {
         if (currentPage>1){await page.goto(currentUrl + '&page=' + currentPage);}
         threadMessages += await page.evaluate(getThreadMessages);
         currentPage++;
      } while (currentPage < pagesCount + 1);
      threads[i].threadMessages = threadMessages;
   }

   // write to csv
   const Json2csvParser = require('json2csv').Parser;
   const fields = ['text', 'link', 'author', 'threadMessages'];
   const opts = { fields };
   const fs = require('fs');

   try {
      fs.writeFile('./data.json', threads, ()=>{console.log(arguments)});
      const parser = new Json2csvParser(opts);
      const csv = parser.parse(threads);
      fs.writeFile('./data.csv', csv, ()=>{console.log(arguments)});
   } catch (err) {
      console.error(err);
   }

   await browser.close();
})();

