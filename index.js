//  dell site se data automate krke pdf bnani h with the help of web scrapping
//  node index.js --url="https://www.dell.com/en-in" --UrlFile=urls.json --dataFolder=Info --excelFile=Output.csv

let minimist = require('minimist');
let fs = require('fs');
let args = minimist(process.argv);
let puppeteer = require('puppeteer');
let jsdom = require('jsdom');

let axios = require("axios");

let xls = require('excel4node');

// let configJSON = fs.readFileSync(args.config, "utf-8");
// let configJSO = JSON.parse(configJSON);


// console.log(configJSO.url);
run();
async function run() {
    let browser = await puppeteer.launch({
        headless: false,// headless :false se hme process hota hua show hota h agr true krte to hme bs end result show hota
        args: [
            '--start-maximized'
            // strt-mximzed se full screen open hogi 
        ],
        defaultViewport: null// isse hme jo page ka content h vo maximized show hoga i;e default view visible hoga

    });

    let pages = await browser.pages();
    let page = pages[0];

    await page.goto(args.url);
    // home for laptop p clik kra 
    await page.waitForSelector("a[href='https://www.dell.com/en-in/shop/scc/sc/laptops']");
    await page.click("a[href='https://www.dell.com/en-in/shop/scc/sc/laptops']");
    // ab hme prices wale p krna h clik or sbi price range k nikalne h
    // 80k and + range wale
    await page.waitFor(2000);
    await page.waitForSelector("input[name='9975']");
    await page.click("input[name='9975']");
        let currUrl = page.url();
        await page.waitFor(4000);
        let dwldKaPromise = axios.get(currUrl);

        dwldKaPromise.then(function (response) {
            let html = response.data;
            let dom = new jsdom.JSDOM(html);
            let document = dom.window.document;
            let productsDiv = document.querySelectorAll('div.no-div-lines-layout > div.ps > article');
            // console.log(productsDiv.length);
            let products = [];

            for (let i = 0; i < productsDiv.length; i++) {

                let product = {
                    modelName: "",
                    price: "",
                    gen: "",
                    memory: "",
                    windows: ""
                }

                let modelNames = productsDiv[i].querySelector('section.ps-top>h3.ps-title>a');
                // console.log(modelNames.textContent);
                product.modelName = modelNames.textContent;

                let prices = productsDiv[i].querySelectorAll("div.ps-dell-price>span");
                product.price = prices[1].textContent;
                // console.log(prices[1].textContent);
                let generation = productsDiv[i].querySelector('div.ps-iconography > div.dds_processor');
                product.gen = generation.textContent;
                // console.log(generation.textContent);

                let win = productsDiv[i].querySelector('div.ps-iconography > div.dds_disc-system');
                product.windows = win.textContent;
                // console.log(win.textContent);

                let mem = productsDiv[i].querySelector('div.ps-iconography > div.dds_hard-drive');
                product.memory = mem.textContent;
                // console.log(mem.textContent);

                products.push(product);

            }
            let productJSON = JSON.stringify(products);
            fs.writeFileSync("productsInfo.json", productJSON, "utf-8");
            // createExcel(products);
            // fs.mkdirSync(args.dataFolder);
            let wb = new xls.Workbook();
            let style = wb.createStyle({
                font: {
                    color: "white",
                },
                fill:
                {
                    type: "pattern",
                    patternType: "solid",
                    fgcolor: "black"
                },
                border: {
                    left: {
                        style: "thick",
                        color: "white"
                    },
                    right: {
                        style: "thick",
                        color: "white"
                    },
                    left: {
                        style: "thick",
                        color: "white"
                    },

                    top: {
                        style: "thick",
                        color: "white"
                    }
                }
            });

            for (let i = 0; i < products.length; i++) {
                let sheet = wb.addWorksheet(products[i].modelName);
                sheet.cell(1, 1).string('Model Name').style(style);
                sheet.cell(1, 2).string('Generation').style(style);
                sheet.cell(1, 3).string('Memory').style(style);
                sheet.cell(1, 4).string('Windows').style(style);
                sheet.cell(1, 5).string('Price').style(style);
                // console.log(products[i].length);
               
                    sheet.cell(2, 1).string(products[i].modelName);
                    sheet.cell(2, 2).string(products[i].gen);
                    sheet.cell(2, 3).string(products[i].memory);
                    sheet.cell(2, 4).string(products[i].windows);
                    sheet.cell(2, 5).string(products[i].price);
            }
            wb.write(args.excelFile);
        }); 

    await page.waitForSelector("div.anavmfe__facet__item");
    await page.click("div.anavmfe__facet__item");

    await page.waitFor(2000);

    // await page.waitForSelector("input[name='9974']");
    // await page.click("input[name='9974']");
}