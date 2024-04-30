import { test, expect } from '@playwright/test';

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
  await page.goto('https://prodss.suffolk.edu/Student/Courses/Search');

  const token = await page.$eval('input[name="__RequestVerificationToken"]', (el) => el.getAttribute('value'));

  if (!token) {
    throw new Error("Token not found");
  }

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
   */

  try {
    let res = await request.post("https://prodss.suffolk.edu/Student/Courses/SectionsAsync", {
      "headers": {
        "__isguestuser": "true",
        "__requestverificationtoken": "5CV94YdyV2iiR_TgfblJzIGlIAZ6tvKWBOztqSI83czq7aYbb7ODKzaMqmyZv_O2HIX1WIRypv97i_Ie23SuvprWkTz4FKA2rV0BzUZT4nE1",
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
      "data": "{\"courseId\":\"7245\",\"sectionIds\":[\"160962\"]}",
    });

    let data = await res.json();

    console.log("Sections fetched!");
    console.log(data);
  } catch (e) {
    console.log("Erroring attempting to fetch sections");
    console.error(e);
  }
});
