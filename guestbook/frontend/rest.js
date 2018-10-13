// createPath = 'http://10.10.20.202:31112/function/create'; // OpenFaaS
// listPath = 'http://10.10.20.202:31112/function/list'; // OpenFaaS
createPath = 'http://10.10.20.202:32237/create'; // Fission
listPath = 'http://10.10.20.202:32237/list'; // Fission

// Make List call and render current lst
function getAndRenderMsg() {
  console.log('Trying: ' + listPath);
  $.ajax({
    type: 'GET',
    url: listPath,
    crossDomain: true,
    success: function (resp) {
      var response = resp;
      if (typeof resp == 'string') // String or obj return?
        response = JSON.parse(resp);
      console.log('Response: ' + JSON.stringify(response, null, 2));
      var messageString = '';
      for (var i = 0; i < response.entries.length; i++) {
        messageString += '<div>' + response.entries[i].text + '</div>\n';
      }

      document.getElementById('messages').innerHTML = messageString;
    },
  });
}

// Upon the submit buttong being created, make Create call, then List
$('#submitEntry').on('click', function () {
  var inputMessage = document.getElementById('inputMessage').value;
  console.log('inputMessage: ' + inputMessage);
  $.ajax({
      type: 'POST',
      url: createPath,
      contentType: 'application/json',
      dataType: 'json',
      data: '{"text":"' + inputMessage + '"}',
      crossDomain: true,
      success: function (response) {
        console.log('Response: ' + JSON.stringify(response, null, 2));
        document.getElementById('inputMessage').innerHTML = '';
        getAndRenderMsg();
      },
    });
});

// Start the page load with the List call
getAndRenderMsg();
