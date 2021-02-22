(function () {
  let localData = {};

  function storeDataInLocalStorage(continueFunction) {
    let promise = browser.storage.local.set({ data: localData });
    if (continueFunction) {
      promise.then(continueFunction);
    }
  }

  function isDataFetchedFromModem() {
    return (
      (localData.currentMonthMovementInBytes > 0) &
      (localData.monthlyDataCapInBytes > 0)
    );
  }

  function milisecondsToFullDays(miliseconds) {
    return parseInt(miliseconds / (1000 * 60 * 60 * 24));
  }

  function getCurrentMonthBorders() {
    // date magic, don't read code while sober
    let nowExactly = new Date();

    let currentDayOfMonth = nowExactly.getDate();
    let currentMonth = nowExactly.getMonth(); // [0-11]
    let currentYear = nowExactly.getFullYear();

    let timeOfStart = 0; // for destructor
    let timeOfEnd = 0;

    if (localData.startOfMonthDay <= currentDayOfMonth) {
      // between invoice day and last day of physical month
      timeOfStart = new Date(
        currentYear,
        currentMonth,
        localData.startOfMonthDay
      );
      if (currentMonth != 11) {
        timeOfEnd = new Date(
          currentYear,
          currentMonth + 1,
          localData.startOfMonthDay
        );
      } else {
        timeOfEnd = new Date(currentYear + 1, 0, localData.startOfMonthDay);
      }
    } else {
      if (currentMonth != 0) {
        timeOfStart = new Date(
          currentYear,
          currentMonth - 1,
          localData.startOfMonthDay
        );
      } else {
        timeOfStart = new Date(currentYear - 1, 11, localData.startOfMonthDay);
      }
      timeOfEnd = new Date(
        currentYear,
        currentMonth,
        localData.startOfMonthDay
      );
    }
    return [timeOfStart, timeOfEnd, nowExactly];
  }

  function recalculateStatistics() {
    if (isDataFetchedFromModem()) {
      localData.bytesLeftThisMonth =
        localData.monthlyDataCapInBytes - localData.currentMonthMovementInBytes;

      let [timeOfStart, timeOfEnd, nowExactly] = getCurrentMonthBorders();

      let thisMonthLengthInMiliseconds = timeOfEnd - timeOfStart;
      let thisMonthLengthInDays = milisecondsToFullDays(
        thisMonthLengthInMiliseconds
      );

      localData.dailyDataCapInBytes =
        localData.monthlyDataCapInBytes / thisMonthLengthInDays;

      let virtualBytesToConsume = localData.monthlyDataCapInBytes;

      localData.milisecondsLeftThisMonth =
        timeOfEnd.getTime() - nowExactly.getTime();

      localData.steadyTransferToEndOfMonthInKbps = parseInt(
        localData.bytesLeftThisMonth /
          1024 /
          (localData.milisecondsLeftThisMonth / 1000)
      );

      let crawledToToday = false;
      let tosEpoh = timeOfStart.getTime();
      let healthySchedule = [];
      for (i = 0; i < thisMonthLengthInDays; i++) {
        //iterating through days of current month
        virtualBytesToConsume -= localData.dailyDataCapInBytes;
        let virtualDate = new Date(tosEpoh + i * 24 * 60 * 60 * 1000);
        if (
          virtualDate.getDate() == nowExactly.getDate() &&
          virtualDate.getMonth() == nowExactly.getMonth()
        ) {
          crawledToToday = true;
          localData.bytesLeftToday =
            localData.bytesLeftThisMonth - virtualBytesToConsume;
        }

        if (crawledToToday) {
          healthySchedule[healthySchedule.length] = {
            date: virtualDate.getTime(),
            transferLeftOnEod: parseInt(virtualBytesToConsume),
          };
        }
      }
      localData.healthySchedule = healthySchedule;
      storeDataInLocalStorage();
    }
  }

  function fetchCurrentMonthData() {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let responseData = this.responseXML.firstChild;
        let responseDataVars = responseData.children;
        localData.currentMonthMovementInBytes = 0;
        for (i = 0; i < responseDataVars.length; i++) {
          let currNode = responseDataVars[i];
          let tagName = currNode.tagName;
          let nodeValue = currNode.innerHTML;
          if (tagName == "CurrentMonthDownload") {
            localData.currentMonthMovementInBytes += parseInt(nodeValue);
          } else if (tagName == "CurrentMonthUpload") {
            localData.currentMonthMovementInBytes += parseInt(nodeValue);
          }
        }
        storeDataInLocalStorage(recalculateStatistics);
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
            localData.monthlyDataCapInBytes = parseInt(nodeValue);
          } else if (tagName == "StartDay") {
            localData.startOfMonthDay = parseInt(nodeValue);
          }
        }
        storeDataInLocalStorage();
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

  function makeFullDataProcess() {
    function processKnownData(dataSavedInLocalStorage) {
      if (localData) {
      } else {
        localData = dataSavedInLocalStorage.data;
      }

      if (localData) {
      } else {
        localData = {
          currentMonthMovementInBytes: 0,
          monthlyDataCapInBytes: 0,
          startOfMonthDay: 1,
          bytesLeftThisMonth: 0,
          bytesLeftToday: 0,
          dailyDataCapInBytes: 0,
          milisecondsLeftThisMonth: 0,
          steadyTransferToEndOfMonthInKbps: 0,
          healthySchedule: [],
        };
      }
      fetchCurrentMonthData();
      fetchOverallData();
    }
    browser.storage.local.get("data").then(processKnownData);
    storeDataInLocalStorage();
  }

  function appRunner() {
    browser.storage.local.clear();
    makeFullDataProcess();
    setInterval(makeFullDataProcess, 10000);
  }
  appRunner();
})();
