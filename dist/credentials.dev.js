"use strict";

module.exports = {
  cookieSecret: "your cookie secret goes here",
  sessionSecret: "your session secret goes here",
  mongo: {
    // tạo ra 2 kết nối database dành cho 2 trường hợp -- ta đang học nên đang là trường hợp development
    development: {
      connectionString: "mongodb://127.0.0.1:27017/test26"
    },
    production: {
      connectionString: ""
    }
  },
  google: {
    GOOGLE_CLIENT_ID: "777673536157-0cjcqfvi9fvk57hqvpheu9ld45mjg9ul.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "Drz5RKUGGxxu2R6OEf6kX2YN",
    GOOGLE_CALLBACK_URL: "/auth/google/callback"
  }
};