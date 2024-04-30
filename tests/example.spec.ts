import { test, expect } from '@playwright/test';

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
   *       UPDATE (like an hour later): cert issue is back??????????????????????????????????????????????????????????
   *                                    is this a rate limit issue? i have no idea i'm just throwing the idea out there
   */

test('Find Courses', async ({ page }) => {
  await page.goto('https://www.suffolk.edu/coursesearch/courses');

  // first pass
  let res = await fetch("https://www.suffolk.edu/coursesearch/api/SearchCourses", {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache"
    },
    "referrer": "https://www.suffolk.edu/coursesearch/courses",
    "body": "{\"AcademicLevel\":[\"Undergraduate\"],\"Subject\":[],\"AcademicPeriod\":[\"Fall 2024\"],\"Campus\":[],\"DeliveryMode\":[\"In-Person\",\"Hybrid\"],\"CourseStatus\":[],\"SectionCapacity\":[],\"MeetingDay\":[],\"MeetingTime\":[],\"Page\":1,\"PageSize\":500}",
    "method": "POST",
    "mode": "cors"
  });

  let courseTitles: Array<string> = [];

  let data = await res.json();

  courseTitles = data.Courses.map((course:any) => course.SectionTitle);

  const total = data.Total;
  const pages = Math.ceil(total / 500);

  for (let i = 2; i <= pages; i++) {
    let res = await fetch("https://www.suffolk.edu/coursesearch/api/SearchCourses", {
      "credentials": "include",
      "headers": {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/json",
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
      },
      "referrer": "https://www.suffolk.edu/coursesearch/courses",
      "body": "{\"AcademicLevel\":[\"Undergraduate\"],\"Subject\":[],\"AcademicPeriod\":[\"Fall 2024\"],\"Campus\":[],\"DeliveryMode\":[\"In-Person\",\"Hybrid\"],\"CourseStatus\":[],\"SectionCapacity\":[],\"MeetingDay\":[],\"MeetingTime\":[],\"Page\":"+i+",\"PageSize\":500}",
      "method": "POST",
      "mode": "cors"
    });

    let data = await res.json();

    courseTitles = courseTitles.concat(data.Courses.map((course:any) => course.SectionTitle));
  }

  console.log(`Total courses: ${total} (${courseTitles.length})`);
  console.log(courseTitles);
});

test("Find Sections", async ({ page, request }) => {
  // --------------------------------------------
  // GET COURSE/SECTION IDs
  // --------------------------------------------

  await page.goto('https://prodss.suffolk.edu/Student/Courses/Search');

  // FIXME: implement
  const token = await page.$eval('input[name="__RequestVerificationToken"]', (el) => el.getAttribute('value'));

  // first pass
  let res: Response | null = null;

  try {
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
      "body": "{\"searchParameters\":\"{\\\"keyword\\\":\\\"\\\",\\\"terms\\\":[\\\"24/SP\\\"],\\\"requirement\\\":null,\\\"subrequirement\\\":null,\\\"courseIds\\\":null,\\\"sectionIds\\\":null,\\\"requirementText\\\":null,\\\"subrequirementText\\\":\\\"\\\",\\\"group\\\":null,\\\"startTime\\\":0,\\\"endTime\\\":1440,\\\"openSections\\\":false,\\\"subjects\\\":[],\\\"academicLevels\\\":[],\\\"courseLevels\\\":[],\\\"synonyms\\\":[],\\\"courseTypes\\\":[],\\\"topicCodes\\\":[],\\\"days\\\":[],\\\"locations\\\":[\\\"ONC\\\"],\\\"faculty\\\":[],\\\"onlineCategories\\\":[],\\\"keywordComponents\\\":[],\\\"startDate\\\":null,\\\"endDate\\\":null,\\\"startsAtTime\\\":null,\\\"endsByTime\\\":null,\\\"pageNumber\\\":1,\\\"sortOn\\\":2,\\\"sortDirection\\\":0,\\\"subjectsBadge\\\":[],\\\"locationsBadge\\\":[{\\\"Value\\\":\\\"ONC\\\",\\\"Description\\\":\\\"On Campus\\\",\\\"Count\\\":1847,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"On Campus (1847)\\\"}],\\\"termFiltersBadge\\\":[{\\\"Value\\\":\\\"24/SP\\\",\\\"Description\\\":\\\"Spring 2024\\\",\\\"Count\\\":608,\\\"Selected\\\":true,\\\"descriptionToDisplay\\\":\\\"Spring 2024 (608)\\\"}],\\\"daysBadge\\\":[],\\\"facultyBadge\\\":[],\\\"academicLevelsBadge\\\":[],\\\"courseLevelsBadge\\\":[],\\\"courseTypesBadge\\\":[],\\\"topicCodesBadge\\\":[],\\\"onlineCategoriesBadge\\\":[],\\\"openSectionsBadge\\\":false,\\\"openAndWaitlistedSectionsBadge\\\":false,\\\"subRequirementText\\\":null,\\\"quantityPerPage\\\":100,\\\"openAndWaitlistedSections\\\":false,\\\"searchResultsView\\\":\\\"CatalogListing\\\"}\"}",
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

  for (let i = 2; i <= data.TotalPages; i++) {
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

  if (!token) {
    throw new Error("Token not found");
  }

  let courseSectionLocations: Array<{title: string, locations: Array<string>}> = [];

  for (let i = 0; i < 5; i++) {
    const course = courseData[i];
    const sections = `[${course.sections.map(c => `\"${c}\"`).join(",")}]`;

    try {
      let res = await request.post("https://prodss.suffolk.edu/Student/Courses/SectionsAsync", {
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

      let data = await res.json();

      let locations = new Set<string>(data.TermsAndSections[0].Sections.map((section: any) =>
        section.Section.FormattedMeetingTimes
          // remove finals locations
          .filter((formattedMeetingTime: any) => formattedMeetingTime.InstructionalMethodDisplay !== "LECTURE")
          // get the building and room
          .map((formattedMeetingTime: any) => formattedMeetingTime.BuildingDisplay + " " + formattedMeetingTime.RoomDisplay)
      ).flat());

      courseSectionLocations.push({
        title: course.title,
        locations: [...locations],
      });

      console.log({
        title: course.title,
        locations: [...locations],
      });

      console.log("--------------------------------------------------")
    } catch (e) {
      console.log("Erroring attempting to fetch sections");
      console.error(e);
    }
  }
});
