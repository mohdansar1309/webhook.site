var settings = {};

// The VICIDIAL server API URL (e.g. http://dialer.example.com/vicidial/non_agent_api.php).
settings.URL = ''

// The VICIDIAL server username.
settings.USERNAME = ''

// The VICIDIAL server password.
settings.PASSWORD = ''

// The list ID for the new lead.
settings.LIST_ID = ''

// A simple JSON object of extra field mappings.  e.g. { "field": "value" }.  You can use curly bracket templating to insert any {{value}} from the FLG 360 webhook, for example {{data1}}.
settings.extra_field_mappings = ""

try {
  JSON.parse(settings.extra_field_mappings || '{}');
  var validExtraFieldMappings = true;
} catch (error) {
  var validExtraFieldMappings = false;
}

if (!settings.URL || !settings.USERNAME || !settings.PASSWORD) {
  log.error("Please provide the URL, username and password for VICIDIAL.");  
} else if (!validExtraFieldMappings) {
  log.error("The extra field mappings doesn't seem to be valid JSON.  Have you enclosed all properties in quotes?");
} else if (!settings.LIST_ID.match(/^\d+$/)) {
  log.error("The list ID should be numeric.");
} else if (!request.body) {
  log.error("You should call this script from a FLG 360 webhook.  We didn't receive any data.");
} else {
  
  // Data fields for the dialer record
  var data = {
    list_id: settings.LIST_ID,
    source: 'flg' + '360',
    add_to_hopper: 'Y',
    user: settings.USERNAME,
    pass: settings.PASSWORD,
    'function': 'add_lead',
    vendor_lead_code: request.body.id,
    title: request.body.title,
    first_name: request.body.firstname,
    last_name: request.body.lastname,
    address1: request.body.address,
    address2: request.body.address2,
    address3: request.body.address3,
    city: request.body.towncity,
    postal_code: request.body.postcode,
    phone_number: request.body.phone1,
    phone_code: '44',
    ddi_mobile: request.body.phone2
  };
  
  // Add the extra field mappings if necessary
  data = _.extend(data, JSON.parse(helper.template(settings.extra_field_mappings || '{}', request.body)));
  
  // Post the lead to the dialer
  http.post({ url: settings.URL, form: data }, function (error, response, body) {
    if (error) {
      log.error("Couldn't create lead in dialer.", data, error);
      script.result({ status: 500 }); // The webhook should retry
    } else if (body.substr(0, 8) !== 'SUCCESS:') {
      log.error("Couldn't create lead in dialer.", data, body);
      script.result({ status: 500 }); // The webhook should retry
    } else {
      log.info("Created lead in dialer.", body);
    }
  });
  
}
