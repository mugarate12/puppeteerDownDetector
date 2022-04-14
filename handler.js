'use strict';
const chromium = require('chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra')

async function getDownDetectorInformations(serviceName) {
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
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    .then(response => response.status())
    .catch(error => 403)

  return response
}

module.exports.hello = async (event) => {
  try {
    const params = event.pathParameters
    const name = params.serviceName || 'Not found'

    const response = await getDownDetectorInformations(name)

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: `Go Serverless v1.0! Your function executed successfully! Service:  ${name}, Status: ${response}`,
          input: event,
        },
        null,
        2
      ),
    };
  } catch (error) {
    return error
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
