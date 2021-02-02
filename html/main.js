(function () {
  let mainInfo = {
    currentMonthMovementInBytes: 0,
    monthlyDataCapInBytes: 0,
    startOfMonthDay: 1,
    bytesLeftThisMonth: 0,
    bytesLeftToday: 0,
    dailyConsumableBytes: 0,
    milisecondsLeftThisMonth: 0,
    steadyTransferToEndOfMonthInKbps: 0,
    healthySchedule: [],
  };

  function bytesToGigaBytes(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  }

  function milisecondsToFullDays(miliseconds) {
    return parseInt(miliseconds / (1000 * 60 * 60 * 24));
  }

  function isDataFetchedFromModem() {
    return (
      (mainInfo.currentMonthMovementInBytes > 0) &
      (mainInfo.monthlyDataCapInBytes > 0)
    );
  }

  function recalculateStatistics() {
    if (isDataFetchedFromModem()) {
      let jackpot = mainInfo.monthlyDataCapInBytes;
      let hand = mainInfo.currentMonthMovementInBytes;
      mainInfo.bytesLeftThisMonth =
        mainInfo.monthlyDataCapInBytes - mainInfo.currentMonthMovementInBytes;

      let [timeOfStart, timeOfEnd, nowExactly] = getCurrentMonthBorders();

      let thisMonthLengthInMiliseconds = timeOfEnd - timeOfStart;
      let thisMonthLengthInDays = milisecondsToFullDays(
        thisMonthLengthInMiliseconds
      );
      let dailyConsumableBytes =
        mainInfo.monthlyDataCapInBytes / thisMonthLengthInDays;

      let virtualBytesToConsume = mainInfo.monthlyDataCapInBytes;

      mainInfo.milisecondsLeftThisMonth =
        timeOfEnd.getTime() - nowExactly.getTime();

      mainInfo.steadyTransferToEndOfMonthInKbps = parseInt(
        mainInfo.bytesLeftThisMonth /
          1024 /
          (mainInfo.milisecondsLeftThisMonth / 1000)
      );

      let crawledToToday = false;
      let tosEpoh = timeOfStart.getTime();
      let healthySchedule = [];
      for (i = 0; i < thisMonthLengthInDays; i++) {
        //iterating through days of current month
        virtualBytesToConsume -= dailyConsumableBytes;
        let virtualDate = new Date(tosEpoh + i * 24 * 60 * 60 * 1000);
        if (
          virtualDate.getDate() == nowExactly.getDate() &&
          virtualDate.getMonth() == nowExactly.getMonth()
        ) {
          crawledToToday = true;
          mainInfo.bytesLeftToday =
            mainInfo.bytesLeftThisMonth - virtualBytesToConsume;
        }

        if (crawledToToday) {
          healthySchedule[healthySchedule.length] = {
            date: virtualDate,
            transferLeftOnEod: virtualBytesToConsume,
          };
        }
      }
      mainInfo.healthySchedule = healthySchedule;
    }
  }

  function getCurrentMonthBorders() {
    // date magic, don't read code while sober
    let nowExactly = new Date();

    let currentDayOfMonth = nowExactly.getDate();
    let currentMonth = nowExactly.getMonth(); // [0-11]
    let currentYear = nowExactly.getFullYear();

    let timeOfStart = 0; // for destructor
    let timeOfEnd = 0;

    if (mainInfo.startOfMonthDay <= currentDayOfMonth) {
      // between invoice day and last day of physical month
      timeOfStart = new Date(
        currentYear,
        currentMonth,
        mainInfo.startOfMonthDay
      );
      if (currentMonth != 11) {
        timeOfEnd = new Date(
          currentYear,
          currentMonth + 1,
          mainInfo.startOfMonthDay
        );
      } else {
        timeOfEnd = new Date(currentYear + 1, 0, mainInfo.startOfMonthDay);
      }
    } else {
      if (currentMonth != 0) {
        timeOfStart = new Date(
          currentYear,
          currentMonth - 1,
          mainInfo.startOfMonthDay
        );
      } else {
        timeOfStart = new Date(currentYear - 1, 11, mainInfo.startOfMonthDay);
      }
      timeOfEnd = new Date(currentYear, currentMonth, mainInfo.startOfMonthDay);
    }
    return [timeOfStart, timeOfEnd, nowExactly];
  }

  function updatepopUpInterface() {
    if (isDataFetchedFromModem()) {
      recalculateStatistics();

      let readableMonthLeftElem = document.getElementById("month-data-left");
      readableMonthLeftElem.innerHTML =
        bytesToGigaBytes(mainInfo.bytesLeftThisMonth) + " GB";

      let readableMonthLeftProgressElem = document.getElementById(
        "month-data-left-progress"
      );
      readableMonthLeftProgressElem.setAttribute(
        "max",
        mainInfo.monthlyDataCapInBytes
      );
      readableMonthLeftProgressElem.setAttribute(
        "value",
        mainInfo.bytesLeftThisMonth
      );

      let steadyTransferAdvise = document.getElementById(
        "steady-transfer-till-eom"
      );
      steadyTransferAdvise.innerHTML =
        parseInt(mainInfo.steadyTransferToEndOfMonthInKbps) + " kB/s";

      let readableTodayLeftElem = document.getElementById("today-data-left");
      readableTodayLeftElem.innerHTML =
        bytesToGigaBytes(mainInfo.bytesLeftToday) + " GB";

      let tableElem = document.getElementById("main-table");
      for (i = 0; i < mainInfo.healthySchedule.length; i++) {
        // Print schedule for rest of the month
        let newRow = tableElem.insertRow(-1);

        let newCell = newRow.insertCell(0);
        let newText = document.createTextNode(
          mainInfo.healthySchedule[i].date.getDate() +
            "." +
            (mainInfo.healthySchedule[i].date.getMonth() + 1)
        );
        newCell.appendChild(newText);

        let newCell2 = newRow.insertCell(1);
        let newText2 = document.createTextNode(
          bytesToGigaBytes(mainInfo.healthySchedule[i].transferLeftOnEod) +
            " GB"
        );
        newCell2.appendChild(newText2);

        let progressCell = newRow.insertCell(2);
        let progressElem = document.createElement("progress");
        progressElem.setAttribute("max", mainInfo.monthlyDataCapInBytes);
        progressElem.setAttribute(
          "value",
          mainInfo.healthySchedule[i].transferLeftOnEod
        );
        progressCell.appendChild(progressElem);
      }
    }
  }

  function fetchCurrentMonthData() {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
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
          } else if (tagName == "CurrentMonthUpload") {
            mainInfo.currentMonthMovementInBytes += parseInt(nodeValue);
          }
        }
        updatepopUpInterface();
      }
    };
    httpRequest.open(
      "GET",
      "http://192.168.1.1/api/monitoring/month_statistics",
      true
    );
    httpRequest.overrideMimeType("text/xml");
    httpRequest.send();
  }

  function fetchOverallData() {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
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
        updatepopUpInterface();
      }
    };
    httpRequest.open(
      "GET",
      "http://192.168.1.1/api/monitoring/start_date",
      true
    );
    httpRequest.overrideMimeType("text/xml");
    httpRequest.send();
  }

  function prepareViewData() {
    fetchCurrentMonthData();
    fetchOverallData();
  }

  function fillPopupContent() {
    prepareViewData();
    // updateInterface(); // well,that's asynchronous, so...
  }
  fillPopupContent();
})();
