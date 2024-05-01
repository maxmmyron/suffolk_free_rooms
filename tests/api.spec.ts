import { test, type APIResponse } from '@playwright/test';
import fs from "node:fs/promises";

type Meeting = { location: string, startTime: string, endTime: string, days: string };

const USE_SHORT_API_REQUEST = false;

/**
   * TypeError: fetch failed
   * cause: Error: unable to verify the first certificate
   * at TLSWrap.ssl.onhandshakedone -> code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
   */

  /**
   * Unable to verify leaf signature --> "unable to verify the first certificate"
   *
   * > openssl s_client -connect prodss.suffolk.edu:443 -servername prodss.suffolk.edu | tee logcertfile
   *   - Certificate chain:
   *      0 s:C = US, ST = Massachusetts, O = Suffolk University, CN = prodss.suffolk.edu
   *      i:C = US, O = Internet2, CN = InCommon RSA Server CA 2
   *
   *   - with:
   *      depth=0 C = US, ST = Massachusetts, O = Suffolk University, CN = prodss.suffolk.edu
   *        verify error:num=20:unable to get local issuer certificate
   *        verify return:1
   *      depth=0 C = US, ST = Massachusetts, O = Suffolk University, CN = prodss.suffolk.edu
   *        verify error:num=21:unable to verify the first certificate          <-- here!
   *        verify return:1
   *      depth=0 C = US, ST = Massachusetts, O = Suffolk University, CN = prodss.suffolk.edu
   *        verify return:1
   *
   * NOTE: https://www.sslshopper.com/ssl-checker.html#hostname=prodss.suffolk.edu; at first glance, the certificate chain looks good?
   *   1. prodss.suffolk.edu
   *   2. InCommon RSA Server CA 2
   *   3. USERTrust RSA Certification Authority
   *
   * To get the certs:
   *
   * > openssl s_client -connect prodss.suffolk.edu:443 -servername prodss.suffolk.edu | tee logcertfile
   *   - save the cert chain to a file
   *
   * > openssl x509 -in logcertfile -noout -text | grep -i "issuer"
   *   - get the issuer of the intermediate cert (seems like http://crt.sectigo.com/InCommonRSAServerCA2.crt)
   *
   * > curl --output intermediate.crt <url>
   *   - download the intermediate cert
   *
   * > openssl x509 -inform DER -in intermediate.crt -out intermediate.pem -text
   *   - convert to .pem (seems like .crt is really just .pem in another format (maybe DER, which is binary?)
   *   - NOTE: do the same with root cert as well
   *
   * > openssl verify -CAfile intermediate.pem -untrusted root.pem prodss.suffolk.edu.crt
   *   - should ideally verify the cert chain
   *
   * NOTE: last few steps are untested because it seems like Suffolk IT fixed the cert issue literally in the middle
   *       of me trying to figure out what the fuck was happening. LOL
   *
   * UPDATE: (like an hour later) cert issue is back??????????????????????????????????????????????????????????
   *         is this a rate limit issue? i have no idea i'm just throwing the idea out there
   *
   * seems like running:
   * > npx cross-env NODE_EXTRA_CA_CERTS=./certs/intermediate.pem npx playwright test
   * solves issue (haven't tried with --ui flag)
   */

test("Find Sections", async ({ page, request }) => {
  // --------------------------------------------
  // STEP 1: GET COURSE/SECTION IDs
  // --------------------------------------------

  console.debug("Navigating to page... ");
  await page.goto('https://prodss.suffolk.edu/Student/Courses/Search');

  // FIXME: implement
  // maybe unnecessary idk
  const token = await page.$eval('input[name="__RequestVerificationToken"]', (el) => el.getAttribute('value'));
  if (!token) {
    throw new Error("Token not found");
  }

  // first pass
  let res: Response | null = null;

  try {
    let numPerPage = 100;
    if (USE_SHORT_API_REQUEST) numPerPage = 10;

    console.debug("Fetching course page 1... ");
    res = await fetch("https://prodss.suffolk.edu/Student/Courses/SearchAsync", {
      "headers": {
        "__isguestuser": "true",
        "__requestverificationtoken": "G0iD4p47TLElFnljD09SLGVEleJEn8oJbDDKF82yBL3SMqgLjgK1beN5jSfwSQbUngPZvmDhRFNsCVWGOjYi5-6ACfnOxV2at3wDhHPP-s41",
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json, charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "_ga=GA1.2.1654894405.1705425235; __RequestVerificationToken_L1N0dWRlbnQ1=relYR47ZDTWi9BV0t3sa2NiwZ1qPNw-DxBNwCgMvYVxy1QpVeO_Iw3zelEDXwsdQG4iMhOiS1dtzQ5u9lstM8JQIYS9-SBXKhfPWGA8DYbo1; _sp=%257B%2522id%2522%253A%2522232664a9-db26-483b-8270-720cb6d391a9%2522%257D",
        "Referer": "https://prodss.suffolk.edu/Student/Courses/Search",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": "{\"searchParameters\":\"{\\\"keyword\\\":\\\"\\\",\\\"terms\\\":[\\\"24/SP\\\"],\\\"requirement\\\":null,\\\"subrequirement\\\":null,\\\"courseIds\\\":null,\\\"sectionIds\\\":null,\\\"requirementText\\\":null,\\\"subrequirementText\\\":\\\"\\\",\\\"group\\\":null,\\\"startTime\\\":0,\\\"endTime\\\":1440,\\\"openSections\\\":false,\\\"subjects\\\":[],\\\"academicLevels\\\":[],\\\"courseLevels\\\":[],\\\"synonyms\\\":[],\\\"courseTypes\\\":[],\\\"topicCodes\\\":[],\\\"days\\\":[],\\\"locations\\\":[\\\"ONC\\\"],\\\"faculty\\\":[],\\\"onlineCategories\\\":[],\\\"keywordComponents\\\":[],\\\"startDate\\\":null,\\\"endDate\\\":null,\\\"startsAtTime\\\":null,\\\"endsByTime\\\":null,\\\"pageNumber\\\":1,\\\"sortOn\\\":2,\\\"sortDirection\\\":0,\\\"subjectsBadge\\\":[],\\\"locationsBadge\\\":[{\\\"Value\\\":\\\"ONC\\\",\\\"Description\\\":\\\"On Campus\\\",\\\"Count\\\":1847,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"On Campus (1847)\\\"}],\\\"termFiltersBadge\\\":[{\\\"Value\\\":\\\"24/SP\\\",\\\"Description\\\":\\\"Spring 2024\\\",\\\"Count\\\":608,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"Spring 2024 (608)\\\"}],\\\"daysBadge\\\":[],\\\"facultyBadge\\\":[],\\\"academicLevelsBadge\\\":[],\\\"courseLevelsBadge\\\":[],\\\"courseTypesBadge\\\":[],\\\"topicCodesBadge\\\":[],\\\"onlineCategoriesBadge\\\":[],\\\"openSectionsBadge\\\":false,\\\"openAndWaitlistedSectionsBadge\\\":false,\\\"subRequirementText\\\":null,\\\"quantityPerPage\\\":"+numPerPage+",\\\"openAndWaitlistedSections\\\":false,\\\"searchResultsView\\\":\\\"CatalogListing\\\"}\"}",
      "method": "POST"
    });
  } catch (e) {
    console.log("Erroring attempting to fetch courses");
    console.error(e);
  }

  if (!res) {
    throw new Error("No response");
  }

  let courseData: Array<{ title: string, id: string, sections: Array<string> }> = [];

  let data = await res.json();

  courseData = data.Courses.map((course:any) => ({
    title: course.Title,
    id: course.Id,
    sections: course.MatchingSectionIds,
  }));

  // DEBUG: we skip over this if we're using the short api request
  if (!USE_SHORT_API_REQUEST) {
    for (let i = 2; i <= data.TotalPages; i++) {
      console.debug(`Fetching course page ${i}... `);
      let res = await fetch("https://prodss.suffolk.edu/Student/Courses/SearchAsync", {
        "headers": {
          "__isguestuser": "true",
          "__requestverificationtoken": "G0iD4p47TLElFnljD09SLGVEleJEn8oJbDDKF82yBL3SMqgLjgK1beN5jSfwSQbUngPZvmDhRFNsCVWGOjYi5-6ACfnOxV2at3wDhHPP-s41",
          "accept": "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json, charset=UTF-8",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "cookie": "_ga=GA1.2.1654894405.1705425235; __RequestVerificationToken_L1N0dWRlbnQ1=relYR47ZDTWi9BV0t3sa2NiwZ1qPNw-DxBNwCgMvYVxy1QpVeO_Iw3zelEDXwsdQG4iMhOiS1dtzQ5u9lstM8JQIYS9-SBXKhfPWGA8DYbo1; _sp=%257B%2522id%2522%253A%2522232664a9-db26-483b-8270-720cb6d391a9%2522%257D",
          "Referer": "https://prodss.suffolk.edu/Student/Courses/Search",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "{\"searchParameters\":\"{\\\"keyword\\\":\\\"\\\",\\\"terms\\\":[\\\"24/SP\\\"],\\\"requirement\\\":null,\\\"subrequirement\\\":null,\\\"courseIds\\\":null,\\\"sectionIds\\\":null,\\\"requirementText\\\":null,\\\"subrequirementText\\\":\\\"\\\",\\\"group\\\":null,\\\"startTime\\\":0,\\\"endTime\\\":1440,\\\"openSections\\\":false,\\\"subjects\\\":[],\\\"academicLevels\\\":[],\\\"courseLevels\\\":[],\\\"synonyms\\\":[],\\\"courseTypes\\\":[],\\\"topicCodes\\\":[],\\\"days\\\":[],\\\"locations\\\":[\\\"ONC\\\"],\\\"faculty\\\":[],\\\"onlineCategories\\\":[],\\\"keywordComponents\\\":[],\\\"startDate\\\":null,\\\"endDate\\\":null,\\\"startsAtTime\\\":null,\\\"endsByTime\\\":null,\\\"pageNumber\\\":"+i+",\\\"sortOn\\\":2,\\\"sortDirection\\\":0,\\\"subjectsBadge\\\":[],\\\"locationsBadge\\\":[{\\\"Value\\\":\\\"ONC\\\",\\\"Description\\\":\\\"On Campus\\\",\\\"Count\\\":1847,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"On Campus (1847)\\\"}],\\\"termFiltersBadge\\\":[{\\\"Value\\\":\\\"24/SP\\\",\\\"Description\\\":\\\"Spring 2024\\\",\\\"Count\\\":608,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"Spring 2024 (608)\\\"}],\\\"daysBadge\\\":[],\\\"facultyBadge\\\":[],\\\"academicLevelsBadge\\\":[],\\\"courseLevelsBadge\\\":[],\\\"courseTypesBadge\\\":[],\\\"topicCodesBadge\\\":[],\\\"onlineCategoriesBadge\\\":[],\\\"openSectionsBadge\\\":false,\\\"openAndWaitlistedSectionsBadge\\\":false,\\\"subRequirementText\\\":null,\\\"quantityPerPage\\\":100,\\\"openAndWaitlistedSections\\\":false,\\\"searchResultsView\\\":\\\"CatalogListing\\\"}\"}",
        "method": "POST"
      });

      let data = await res.json();

      courseData = courseData.concat(data.Courses.map((course:any) => ({
        title: course.Title,
        id: course.Id,
        sections: course.MatchingSectionIds,
      })));
    }
  }

  let titleLen = Math.max(...courseData.map(c => c.title.length)) + 2;
  let locationLen = 32;
  let timeLen = 21;
  let daysLen = 16;

  // --------------------------------------------
  // STEP 2: GET LOCATIONS
  // --------------------------------------------

  let courseSectionLocations: Array<{title: string, meetings: Array<Meeting>}> = [];
  let formattedData: {[key: string]: {data: any}} = {};

  // DEBUG: start cli table
  console.log(`╔${"═".padEnd(titleLen, "═")}╦${"═".padEnd(locationLen, "═")}╦${"═".padEnd(timeLen, "═")}╦${"═".padEnd(daysLen, "═")}╗`);
  console.log(`║${" COURSE TITLE".padEnd(titleLen, " ")}║${" LOCATION".padEnd(locationLen, " ")}║${" TIME".padEnd(timeLen, " ")}║${" DAYS".padEnd(daysLen, " ")}║▒`);
  console.log(`╠${"═".padEnd(titleLen, "═")}╬${"═".padEnd(locationLen, "═")}╬${"═".padEnd(timeLen, "═")}╬${"═".padEnd(daysLen, "═")}╣▒`);

  for (let i = 0; i < courseData.length; i++) {
    // DEBUG: print out course info into cli table
    if (i!==0) {
      console.log(`╟${"─".padEnd(titleLen, "─")}╫${"─".padEnd(locationLen, "─")}╫${"─".padEnd(timeLen, "─")}╫${"─".padEnd(daysLen, "─")}╢▒`);
    }

    const course = courseData[i];
    const sections = `[${course.sections.map(c => `\"${c}\"`).join(",")}]`;

    let res: APIResponse | null = null;
    try {
      res = await request.post("https://prodss.suffolk.edu/Student/Courses/SectionsAsync", {
        "headers": {
          "__isguestuser": "true",
          "__requestverificationtoken": "G0iD4p47TLElFnljD09SLGVEleJEn8oJbDDKF82yBL3SMqgLjgK1beN5jSfwSQbUngPZvmDhRFNsCVWGOjYi5-6ACfnOxV2at3wDhHPP-s41",
          "accept": "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json, charset=UTF-8",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "cookie": "_ga=GA1.2.1654894405.1705425235; __RequestVerificationToken_L1N0dWRlbnQ1=relYR47ZDTWi9BV0t3sa2NiwZ1qPNw-DxBNwCgMvYVxy1QpVeO_Iw3zelEDXwsdQG4iMhOiS1dtzQ5u9lstM8JQIYS9-SBXKhfPWGA8DYbo1; _sp=%257B%2522id%2522%253A%2522232664a9-db26-483b-8270-720cb6d391a9%2522%257D",
          "Referer": "https://prodss.suffolk.edu/Student/Courses/Search",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "data": "{\"courseId\":\""+course.id+"\",\"sectionIds\":"+sections+"}",
      });
    } catch (e) {
      console.log("Erroring attempting to fetch sections");
      console.error(e);
    }

    if (!res) {
      throw new Error("No response");
    }

    let data = await res.json();

    formattedData[course.id] = data;

    // parse data into struct
    let meetings: Array<Meeting> = [...new Set<Meeting>(data.TermsAndSections[0].Sections.map((section: any) =>
      section.Section.FormattedMeetingTimes
        .filter((formattedMeetingTime: any) => formattedMeetingTime.InstructionalMethodDisplay === "LECTURE")
        .map((formattedMeetingTime: any) => ({
          section: section.Section.SectionNameDisplay,
          location: formattedMeetingTime.BuildingDisplay + " " + formattedMeetingTime.RoomDisplay,
          startTime: formattedMeetingTime.StartTimeDisplay,
          endTime: formattedMeetingTime.EndTimeDisplay,
          days: formattedMeetingTime.DaysOfWeekDisplay
        }))
    ))].flat();

    courseSectionLocations.push({
      title: course.title,
      meetings,
    });

    // DEBUG: print out course info into cli table
    for (let i = 0; i < meetings.length; i++) {
      let paddedTitle = ` ${course.title}`.padEnd(titleLen, " ");
      if(i !== 0) paddedTitle = " ".padEnd(titleLen, " ");
      let paddedLocation = ` ${meetings[i].location}`.padEnd(locationLen, " ");
      let paddedMeetTimes = ` ${meetings[i].startTime} - ${meetings[i].endTime}`.padEnd(timeLen, " ");
      let paddedMeetDays = ` ${meetings[i].days}`.padEnd(daysLen, " ");

      console.log(`║${paddedTitle}║${paddedLocation}║${paddedMeetTimes}║${paddedMeetDays}║▒`);
    }
  }

  // DEBUG: end cli table
  console.log(`╚${"═".padEnd(titleLen, "═")}╩${"═".padEnd(locationLen, "═")}╩${"═".padEnd(timeLen, "═")}╩${"═".padEnd(daysLen, "═")}╝▒`);
  console.log(` ${"▒".repeat(titleLen + locationLen + timeLen + daysLen + 4)}▒`);

  for (let i = 0; i < 4; i++) {
    console.log("");
  }

  console.log(JSON.stringify(courseSectionLocations, null, 2));

  try {
    await fs.writeFile(`.output/sections_${Date.now()}.json`, JSON.stringify(formattedData, null, 2));
  } catch (e) {
    console.log("Failed to write file")
    console.error(e);
  }
});
