'use strict';

module.exports.hello = async (event) => {
  const params = event.pathParameters
  const name = params.serviceName || 'Not found'

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Go Serverless v1.0! Your function executed successfully! Service:  ${name}`,
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
