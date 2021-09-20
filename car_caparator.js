let link = "https://www.cardekho.com/";
let fs=require("fs");
let puppeteer=require("puppeteer");
let xlsx=require("xlsx");
let path=require("path");
let inputArr=process.argv.slice(2);
console.log(inputArr);
let input=inputArr[0];

let browserStartPromise = puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--disable-notifications"]

});
let browser,page;
(async function fn(){
    try{
        let browserObj=await browserStartPromise;
        console.log("brower opened");
        browser=browserObj;
        page = await browser.newPage();
        let newTab = page;
        await newTab.goto(link);
        await page.type('input[id="cardekhosearchtext"]',input,{delay: 100});
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForSelector(".tooltip");
        let el=await page.$(".tooltip");
        let name = await page.evaluate(function cb(el){
            return el.textContent;
        },el);
        console.log("Name:",name);
        await page.waitForSelector(".ratingvalue",{visible: true});
        let element=await page.$(".ratingvalue");
        let ratings=await page.evaluate(function cb(element){
            return element.textContent;
        },element);
        console.log("Ratings:",ratings);
        await waitAndClick(".BottomLinkViewAll",page);
        await page.waitForTimeout(100);
        let folderDir=path.join(process.cwd(),"Car_brochure");
        if(fs.existsSync(folderDir) == false){
            fs.mkdirSync(folderDir);
        }
        let carFolder=path.join(folderDir,"Cars");
        if(fs.existsSync(carFolder) == false){
            fs.mkdirSync(carFolder);
        }
        await specification(carFolder,page,input);

    }catch(err){
        console.log(err);
    }
})();

function KeyFeatures(features,value){
    let obj = {
        features,
        value
    }
    return obj;
}
function waitAndClick(selector,page){
    return new Promise(function(resolve,reject){
        let waitForModalPromise=page.waitForSelector(selector, {visible: true});
        waitForModalPromise
        .then(function(){
            let clickModal=page.click(selector,{delay: 100});
            return clickModal;
        })
        .then(function(){
            resolve();
        })
        .catch(function(err){
            reject(err);
        })

    })
}

//excel writer
function excelWriter(jsonData,location,value){
    let newWb=xlsx.utils.book_new();
    let newWS=xlsx.utils.json_to_sheet(jsonData);
    xlsx.utils.book_append_sheet(newWb,newWS,value);
    xlsx.writeFileSync(newWb,location);
}
//excel Reader
function excelReader(location,sheetName){
    if(fs.existsSync(location)==false){
        return [];
    }
    let wb=xlsx.readFile(location);
    let excelData=wb.Sheets[sheetName];
    let ans=xlsx.utils.sheet_to_json(excelData);
    return ans;
}

function specification(carFolder,page,input){
    return new Promise(function(resolve,reject){
        (async function fn(){
            try{
                await page.waitForSelector('table.keyfeature tr td');
                let data = await page.evaluate(() => {
                    let tds = Array.from(document.querySelectorAll('table.keyfeature tr td'))
                    return tds.map(td => td.innerText)
                  });
                  console.table(data);
                 
        
                let carFile=path.join(carFolder,input + '.xlsx');
                
                  for(let i=0;i<23;i+=2){
                    let content=excelReader(carFile,'Values');
                    let dataObj=KeyFeatures(data[i],data[i+1]);
                    content.push(dataObj);
                    console.log(data[i] + " -> " + data[i+1]);
                    console.log("****************************");
                    if(fs.existsSync(carFile) == false){
                        excelWriter(content,carFile,'Values');
                    }
                    excelWriter(content,carFile,'Values');
                      
                  }
                  resolve();
            }catch(err){
                reject(err);
            }
        })();
    })
        
}