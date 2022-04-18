'use strict';
const chromium = require('chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra')
const moment = require('moment-timezone')

function normalizeDownDetectorResult(downDetectorResult) {
  const baselines = downDetectorResult.baseline
  const reports = downDetectorResult.reports

  const data = baselines.map((baseline, index) => {
    return {
      
      date: moment(baseline.x).tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'),
      baseline: baseline.y,
      notificationCount: reports[index].y
    }
  })

  return data
}

async function getDownDetectorInformations(serviceName) {
  let response = {}
  
  const puppeteerExtra = addExtra(chromium.puppeteer)
  const browser = await puppeteerExtra
    .launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    })

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
  page.setDefaultNavigationTimeout(0)

  const url = `https://downdetector.com.br/fora-do-ar/${serviceName}`
  const status = await page.goto(url, { waitUntil: 'domcontentloaded' })
    .then(response => response.status())
    .catch(error => 403)

  if (status === 200) {
    const result = await page.evaluate(() => {
      const titleElement = document.getElementsByClassName('entry-title')[0]
      const titleTextContent = String(titleElement.textContent)
      
      // get title
      const title = titleTextContent.replace('\n', '').replace('\t', '').replace('\r', '').trim()	

      const currentServiceProperties = window['DD']['currentServiceProperties']
      // string
      const status = currentServiceProperties['status']
      const series = currentServiceProperties['series']

      // array 
      //   x: string,
      //   y: string,
      const baseline = series['baseline']['data']
      // array 
      //   x: string,
      //   y: string,
      const reports = series['reports']['data']

      return {
        title,
        status,
        baseline,
        reports
      }
    })

    console.log(result)

    const normalizeResult = normalizeDownDetectorResult(result)

    console.log(normalizeResult)
    response = {
      url,
      status: result.status,
      title: result.title,
      content: normalizeResult
    }
  }

  await browser.close()

  return {
    status,
    result: response
  }
}

module.exports.hello = async (event) => {
  try {
    const params = event.pathParameters
    const name = params.serviceName || 'Not found'

    const response = await getDownDetectorInformations(name)
    console.log(`resposta do servidor: ${response.status}`)

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: `Service:  ${name}, Status: ${response.status}`,
          content: response.result,
        },
      ),
    };
  } catch (error) {
    return error
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
