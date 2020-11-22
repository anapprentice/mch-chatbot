"use strict";

const CovidHelper = {
  apis: {
    summary: "https://api.covid19api.com/summary",
    slovakia: {
      getConfirmed: "https://api.covid19api.com/country/slovakia/status/confirmed"
    },
    czechRepublic: {
      getConfirmed: "https://api.covid19api.com/country/czech-republic/status/confirmed"
    }
  }
}

module.exports = CovidHelper;
