const userAgent = require('useragent')
const path = require('path')

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  
  request.uri = request.uri.replace(/^\/v9.5.0\/(en|ru|fr|de|es|pt|it|cs)\//,'/v9.5.0/');
  request.uri = request.uri.replace(/^\/images\//,'/v9.5.0/images/');

  const headers = request.headers;
  const userAgentString = headers['user-agent'] && headers['user-agent'][0] ? headers['user-agent'][0].value : null;
  const agent = userAgent.lookup(userAgentString);

const browsersToInclude = [
    { browser: 'Edge', version: 18 },
    { browser: 'Firefox', version: 65 },
    { browser: 'Chrome', version: 24 },
    { browser: 'Opera', version: 13 },
    { browser: 'Opera Mini', version: 1 },
    { browser: 'Android', version: 53 },
    { browser: 'Chrome Mobile', version: 55 },
    { browser: 'Opera Mobile', version: 37 },
    { browser: 'Baidu Browser', version: 7 },
    { browser: 'QQ Browser', version: 1 },
    { browser: 'UC Browser', version: 11 },
    { browser: 'Samsung Internet', version: 4 }
  ];

  const supportingBrowser = browsersToInclude
    .find(browser => browser.browser === agent.family && agent.major >= browser.version);
    
  if (supportingBrowser) {
    const fileFormat = path.extname(request.uri).replace('.', '')
    request.headers['original-resource-type'] = [{
      key: 'Original-Resource-Type',
      value: `image/${fileFormat}`
    }];

    const olduri = request.uri;
    const newuri = olduri.replace(/(\.jpg|\.png|\.jpeg)$/g, '.webp');
    request.uri = newuri;
    console.log("newuri:" + newuri);
  }

  return callback(null, request)
};
