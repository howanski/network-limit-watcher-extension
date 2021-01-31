(function() {
  // TODO: use let not var, make peace not war
    var mainInfo = {
      "currentMonthMovementInBytes": 0,
      "monthlyDataCapInBytes": 0,
      "startOfMonthDay": 1
    };

    function bytesToGigaBytes(bytes){
      return (bytes / (1024*1024*1024)).toFixed(2);
    }

    function milisecondsToFullDays(miliseconds){
      return parseInt(miliseconds / (1000*60*60*24));
    }

    function updateInterface(){
      if (mainInfo.currentMonthMovementInBytes > 0 & mainInfo.monthlyDataCapInBytes >0){
        var jackpot = mainInfo.monthlyDataCapInBytes;
        var hand = mainInfo.currentMonthMovementInBytes;
        var bytesLeftThisMonth = jackpot - hand;
        var gigaBytesLeftThisMonth = bytesToGigaBytes(bytesLeftThisMonth);
        
        readableMonthLeftElem = document.getElementById('month-data-left');
        readableMonthLeftElem.innerHTML = gigaBytesLeftThisMonth + " GB";

        readableMonthLeftProgressElem = document.getElementById('month-data-left-progress');
        readableMonthLeftProgressElem.setAttribute('max', jackpot);
        readableMonthLeftProgressElem.setAttribute('value', bytesLeftThisMonth);

        // date magic, don't read code while sober
        var today = new Date();
        

        var currentDayOfMonth = today.getDate();
        var currentMonth = today.getMonth(); // [0-11]
        var currentYear = today.getFullYear();

        if (mainInfo.startOfMonthDay <= currentDayOfMonth){ // month's not over
          timeOfStart = new Date(currentYear, currentMonth, mainInfo.startOfMonthDay);
          if (currentMonth != 11){
            timeOfEnd = new Date(currentYear, currentMonth + 1, mainInfo.startOfMonthDay);
          } else {
            timeOfEnd = new Date(currentYear + 1, 0, mainInfo.startOfMonthDay);
          }
        } else {
          if (currentMonth != 0){
            timeOfStart = new Date(currentYear, currentMonth - 1, mainInfo.startOfMonthDay);
          } else {
            timeOfStart = new Date(currentYear -1, 11, mainInfo.startOfMonthDay);
          }
          timeOfEnd = new Date(currentYear, currentMonth, mainInfo.startOfMonthDay);        
        }

        var thisMonthLengthInMiliseconds = timeOfEnd - timeOfStart;
        var thisMonthLengthInDays = milisecondsToFullDays(thisMonthLengthInMiliseconds);
        var dailyConsumableBytes = mainInfo.monthlyDataCapInBytes / thisMonthLengthInDays;
        var virtualBytesToConsume = mainInfo.monthlyDataCapInBytes;
        tosEpoh = timeOfStart.getTime();
        var crawledToToday = false;
        var tableElem = document.getElementById('main-table');
        for (i=0; i<thisMonthLengthInDays; i++){ //iterating through days of current month
          virtualBytesToConsume -= dailyConsumableBytes;
          virtualDate = new Date(tosEpoh + i*24*60*60*1000);
          if (virtualDate.getDate() == currentDayOfMonth && virtualDate.getMonth() == currentMonth){
            crawledToToday = true;
            var todaysFood = bytesLeftThisMonth - virtualBytesToConsume;
            readableTodayLeftElem = document.getElementById('today-data-left');
            readableTodayLeftElem.innerHTML = bytesToGigaBytes(todaysFood) + " GB";
          }

          if (crawledToToday){
            let newRow = tableElem.insertRow(-1);

            let newCell = newRow.insertCell(0);
            let newText = document.createTextNode(virtualDate.getDate() + "." + (virtualDate.getMonth() + 1));
            newCell.appendChild(newText);

            let newCell2 = newRow.insertCell(1);
            let newText2 = document.createTextNode(bytesToGigaBytes(virtualBytesToConsume) + " GB");
            newCell2.appendChild(newText2);

            let newCell3 = newRow.insertCell(2);
            let newText3 = document.createElement('progress');
            newText3.setAttribute("max", mainInfo.monthlyDataCapInBytes);
            newText3.setAttribute("value", virtualBytesToConsume);
            newCell3.appendChild(newText3);
            
          }
        }

      }
    }
    
    function loadCurrentMonthData(){
      var httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          responseData = this.responseXML.firstChild;
          responseDataVars = responseData.children;
          mainInfo.currentMonthMovementInBytes = 0;
            for (i = 0; i < responseDataVars.length; i++) {
              var currNode = responseDataVars[i]; 
              var tagName = currNode.tagName;
              var nodeValue = currNode.innerHTML;
              if (tagName == "CurrentMonthDownload") {
                mainInfo.currentMonthMovementInBytes += parseInt(nodeValue);
              }
              else if (tagName == "CurrentMonthUpload") {
                mainInfo.currentMonthMovementInBytes += parseInt(nodeValue);
              }
            } 
          updateInterface();
        }
      };
      httpRequest.open("GET", "http://192.168.1.1/api/monitoring/month_statistics", true);
      httpRequest.overrideMimeType('text/xml');
      httpRequest.send();
    }

    function loadOverallData(){
      var httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          responseData = this.responseXML.firstChild;
          responseDataVars = responseData.children;
            for (i = 0; i < responseDataVars.length; i++) {
              var currNode = responseDataVars[i]; 
              var tagName = currNode.tagName;
              var nodeValue = currNode.innerHTML;
              if (tagName == "trafficmaxlimit") {
                mainInfo.monthlyDataCapInBytes = parseInt(nodeValue);
              } else if (tagName == "StartDay") {
                mainInfo.startOfMonthDay = parseInt(nodeValue);
              }
            } 
          updateInterface();
        }
      };
      httpRequest.open("GET", "http://192.168.1.1/api/monitoring/start_date", true);
      httpRequest.overrideMimeType('text/xml');
      httpRequest.send();
    }

    function fillPopupContent() {
      loadCurrentMonthData();
      loadOverallData();
      updateInterface();
    }
    fillPopupContent();
  })();
  