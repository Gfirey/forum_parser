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
   let threadMessages = [];
   let posts = document.getElementById('posts');
   if (posts) {
      let postsText = posts.querySelectorAll('[id^="post_message_"]');
      let userNames = posts.querySelectorAll('.username,.bigusername');
      for (let msg = 0; msg < postsText.length; msg++) {
         if (userNames[msg] && postsText[msg]) {
            threadMessages.push({author:userNames[msg].innerText, text: postsText[msg].innerText});
         }
      }
   }
   console.log('getThreadMessages');
   console.log(threadMessages);
   return threadMessages;
};

const getAuthor = () => {
   let posts = document.getElementById('posts');
   return posts ? posts.querySelector('.username,.bigusername').innerText : '';
};

// write to csv
const Json2csvParser = require('json2csv').Parser;
const fields = ['text', 'link', 'author', 'threadMessages'];
const opts = { fields };
const fs = require('fs');

const writeSingle = function (singleTrhead) {
   let caption = singleTrhead.text;
   let link = singleTrhead.link;
   let threadMessages = singleTrhead.threadMessages;
   let author = singleTrhead.author;

   let result = [];
   result.push({
         caption:caption,
         link: link,
         author: author,
         text: 'АВТОР'
      }
   );

   console.log('===================================================');
   console.log('threadMessages');
   console.log(threadMessages);
   for (let msg in threadMessages) {
      console.log(msg);
      console.log('===================================================');
      console.log(threadMessages[msg]);
      result.push({
            caption: caption,
            link: link,
            author: threadMessages[msg].author,
            text: threadMessages[msg].text
         }
      );
   }

   try {
      fs.writeFile('./threads/' + caption + '.json', JSON.stringify(result), ()=>{console.log(arguments)});
      const parser = new Json2csvParser(['caption', 'link', 'author', 'text']);
      const csv = parser.parse(result);
      fs.writeFile('./threads/' + caption + '.csv', csv, ()=>{console.log(arguments)});
   } catch (err) {
      console.error(err);
   }
};

(async () => {
   const browser = await puppeteer.launch({headless: false});
   const page = await browser.newPage();
   let currentUrl = 'http://forum.littleone.ru/showthread.php?t=209955';
   let currentPage = 1;
   await page.goto(currentUrl + '&page=' + currentPage);

   let threads = JSON.parse(fs.readFileSync('./allTreads.json', 'utf8'));
   // let pagesCount = await page.evaluate(getPageCount);
   // for (let currentPage = 1; currentPage < pagesCount; currentPage++) {
   //    await page.goto(currentUrl + '&page=' + currentPage);
   //    threads = threads.concat(await page.evaluate(parseLinks));
   // }
   // try {
   //    fs.writeFile('./allTreads' + '' + '.json', JSON.stringify(threads), ()=>{console.log(arguments)});
   // } catch (err) {
   //    console.error(err);
   // }

   console.log(threads);
   const threadsCount = threads.length;
   for (let i = 0; i < threadsCount; i++) {
      let threadMessages = [];
      currentUrl = threads[i].link;
      currentPage = 1;
      await page.goto(currentUrl + '&page=' + currentPage);
      pagesCount = await page.evaluate(getPageCount);
      threads[i].author = await page.evaluate(getAuthor);
      do {
         if (currentPage>1){await page.goto(currentUrl + '&page=' + currentPage);}
         let msgs = await page.evaluate(getThreadMessages);
         threadMessages = threadMessages.concat(msgs);
         currentPage++;
      } while (currentPage < pagesCount + 1);
      threads[i].threadMessages = threadMessages;
      writeSingle(threads[i]);
   }

   try {
      fs.writeFile('./data.json', JSON.stringify(threads), ()=>{console.log(arguments)});
      const parser = new Json2csvParser(opts);
      const csv = parser.parse(threads);
      fs.writeFile('./data.csv', csv, ()=>{console.log(arguments)});
   } catch (err) {
      console.error(err);
   }

   await browser.close();
})();

