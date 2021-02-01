(function() {
    let mainInfo = {
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
        let jackpot = mainInfo.monthlyDataCapInBytes;
        let hand = mainInfo.currentMonthMovementInBytes;
        let bytesLeftThisMonth = jackpot - hand;
        let gigaBytesLeftThisMonth = bytesToGigaBytes(bytesLeftThisMonth);
        
        let readableMonthLeftElem = document.getElementById('month-data-left');
        readableMonthLeftElem.innerHTML = gigaBytesLeftThisMonth + " GB";

        let readableMonthLeftProgressElem = document.getElementById('month-data-left-progress');
        readableMonthLeftProgressElem.setAttribute('max', jackpot);
        readableMonthLeftProgressElem.setAttribute('value', bytesLeftThisMonth);

        // date magic, don't read code while sober
        let today = new Date();
        

        let currentDayOfMonth = today.getDate();
        let currentMonth = today.getMonth(); // [0-11]
        let currentYear = today.getFullYear();

        if (mainInfo.startOfMonthDay <= currentDayOfMonth){ // month's not over
          let timeOfStart = new Date(currentYear, currentMonth, mainInfo.startOfMonthDay);
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

        let thisMonthLengthInMiliseconds = timeOfEnd - timeOfStart;
        let thisMonthLengthInDays = milisecondsToFullDays(thisMonthLengthInMiliseconds);
        let dailyConsumableBytes = mainInfo.monthlyDataCapInBytes / thisMonthLengthInDays;
        let virtualBytesToConsume = mainInfo.monthlyDataCapInBytes;
        let tosEpoh = timeOfStart.getTime();
        let crawledToToday = false;
        let tableElem = document.getElementById('main-table');
        for (i=0; i<thisMonthLengthInDays; i++){ //iterating through days of current month
          virtualBytesToConsume -= dailyConsumableBytes;
          let virtualDate = new Date(tosEpoh + i*24*60*60*1000);
          if (virtualDate.getDate() == currentDayOfMonth && virtualDate.getMonth() == currentMonth){
            crawledToToday = true;
            let todaysFood = bytesLeftThisMonth - virtualBytesToConsume;
            let readableTodayLeftElem = document.getElementById('today-data-left');
            readableTodayLeftElem.innerHTML = bytesToGigaBytes(todaysFood) + " GB";
          }

          if (crawledToToday){ // Print schedule for rest of the month
            let newRow = tableElem.insertRow(-1);

            let newCell = newRow.insertCell(0);
            let newText = document.createTextNode(virtualDate.getDate() + "." + (virtualDate.getMonth() + 1));
            newCell.appendChild(newText);

            let newCell2 = newRow.insertCell(1);
            let newText2 = document.createTextNode(bytesToGigaBytes(virtualBytesToConsume) + " GB");
            newCell2.appendChild(newText2);

            let progressCell = newRow.insertCell(2);
            let progressElem = document.createElement('progress');
            progressElem.setAttribute("max", mainInfo.monthlyDataCapInBytes);
            progressElem.setAttribute("value", virtualBytesToConsume);
            progressCell.appendChild(progressElem);
          }
        }

      }
    }
    
    function loadCurrentMonthData(){
      let httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          let responseData = this.responseXML.firstChild;
          let responseDataVars = responseData.children;
          mainInfo.currentMonthMovementInBytes = 0;
            for (i = 0; i < responseDataVars.length; i++) {
              let currNode = responseDataVars[i]; 
              let tagName = currNode.tagName;
              let nodeValue = currNode.innerHTML;
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
      let httpRequest = new XMLHttpRequest();
      httpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          responseData = this.responseXML.firstChild;
          responseDataVars = responseData.children;
            for (i = 0; i < responseDataVars.length; i++) {
              let currNode = responseDataVars[i]; 
              let tagName = currNode.tagName;
              let nodeValue = currNode.innerHTML;
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
  